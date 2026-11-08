import { createState } from "../state.js";
import type { CommandType, EventOf, EventType, FabricaCommand, FabricaEvent } from "@fabrica/events";
import { createController } from "../run/controller.js";
import { ScriptedProvider, type Handler } from "./scripted.js";
import type { RoleName } from "../provider/types.js";
import type { BrowserRunner } from "../browser/types.js";
import { createMemoryStore, type MemoryStore } from "../memory/store.js";

/** Banco de pruebas: motor con guion, sin WebSocket. */
export interface Harness {
  provider: ScriptedProvider;
  events: FabricaEvent[];
  /** Envía un comando con `at` automático. */
  send<T extends CommandType>(type: T, data: Extract<FabricaCommand, { type: T }>["data"]): void;
  /** Espera (hasta 5 s) a que haya un evento que cumpla la condición y lo devuelve. */
  waitFor<T extends EventType>(type: T, test?: (data: EventOf<T>["data"]) => boolean): Promise<EventOf<T>>;
  /** Tipos de evento en orden, opcionalmente filtrados. */
  types(only?: readonly EventType[]): string[];
  of<T extends EventType>(type: T): EventOf<T>["data"][];
  /** Memoria del banco (SQLite en `:memory:`), para sembrar y revisar recuerdos. */
  memory: MemoryStore;
  close(): void;
}

/**
 * Arma un controlador con carpeta y key de mentira y un ScriptedProvider.
 * @param script Guiones por rol.
 * @param options `workspace: null` o `apiKey: false` para probar los errores de configuración; `browser` simula el navegador; `commitPerBlock: null` deja el commit en automático (por defecto apagado).
 */
export function makeHarness(
  script: Partial<Record<RoleName, Handler>>,
  options: { workspace?: string | null; apiKey?: boolean; browser?: BrowserRunner; commitPerBlock?: boolean | null } = {},
): Harness {
  const events: FabricaEvent[] = [];
  const state = createState();
  state.workspace = options.workspace === undefined ? process.cwd() : options.workspace;
  // Por seguridad los tests no commitean (la carpeta por defecto es el propio repo): hay que pedirlo.
  state.commitPerBlock = options.commitPerBlock === undefined ? false : options.commitPerBlock;
  if (options.apiKey !== false) state.setApiKey("sk-ant-test");
  const provider = new ScriptedProvider(script);
  const memory = createMemoryStore();
  memory.open(":memory:", null);
  const abort = createController({
    provider, state, memory, ...(options.browser ? { browser: options.browser } : {}),
    emit: (type, data) => void events.push({ type, at: new Date().toISOString(), data } as unknown as FabricaEvent),
  });
  const find = <T extends EventType>(type: T, test?: (d: EventOf<T>["data"]) => boolean) =>
    events.find((e) => e.type === type && (!test || test(e.data as never))) as EventOf<T> | undefined;
  return {
    provider, events, memory,
    send: (type, data) => abort.handle({ type, at: new Date().toISOString(), data } as FabricaCommand),
    async waitFor(type, test) {
      for (let i = 0; i < 500; i++) {
        const hit = find(type, test);
        if (hit) return hit;
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error(`No llegó ${type}. Eventos: ${events.map((e) => e.type).join(", ")}`);
    },
    types: (only) => events.map((e) => e.type).filter((t) => !only || only.includes(t)),
    of: (type) => events.filter((e) => e.type === type).map((e) => e.data) as never,
    close: () => {
      abort.shutdown();
      memory.close();
    },
  };
}

import type { FabricaCommand } from "@fabrica/events";
import type { BrowserRunner } from "../browser/types.js";
import { memoryControl } from "../memory/control.js";
import { emitMemory } from "../memory/sync.js";
import type { MemoryStore } from "../memory/store.js";
import type { Emit } from "../emit.js";
import type { ModelProvider } from "../provider/types.js";
import type { EngineState } from "../state.js";
import { handleChat } from "./chat.js";
import { createCtx } from "./context.js";
import { setCommitPerBlock } from "../git/setting.js";
import { approvePlan, rejectPlan } from "./planControl.js";

/** Dependencias del controlador de corridas. */
export interface ControllerDeps {
  emit: Emit;
  provider: ModelProvider;
  state: EngineState;
  memory: MemoryStore;
  /** Ejecutor de recorridos; por defecto Edge vía playwright-core. Los tests inyectan uno simulado. */
  browser?: BrowserRunner;
}

/** Controlador: traduce comandos de la UI en corridas del motor. */
export interface Controller {
  /** Despacha un comando; `reply` es el destino de las respuestas dirigidas al solicitante. */
  handle(command: FabricaCommand, reply?: Emit): void;
  /** Emite `engine.status` con el estado actual a todos los clientes. */
  emitStatus(): void;
  /** Manda el listado de la memoria (a un cliente o a todos). */
  emitMemory(reply?: Emit): void;
  /** Abre la base de memoria en `file` (null = cerrarla) y publica el nuevo listado. */
  setMemoryPath(file: string | null): void;
  /** Revisa que la base no haya quedado dentro de la carpeta del proyecto. */
  guardMemory(): void;
  shutdown(): void;
}

/**
 * Crea el controlador.
 * @param deps Publicador, proveedor y estado.
 */
export function createController(deps: ControllerDeps): Controller {
  const abort = new AbortController();
  const ctx = createCtx({ ...deps, signal: abort.signal });
  const { emit, state } = deps;
  const emitStatus = ctx.emitStatus;
  const memory = memoryControl(ctx);
  const background = (job: Promise<void>) =>
    void job.catch((e: unknown) => emit("engine.error", { code: "run_failed", message: String(e) }));

  function chat(texto: string): void {
    emit("chat.message", { rol: "usuario", texto });
    const missing = !state.workspace ? "no_workspace" : !state.hasApiKey() ? "no_api_key" : null;
    if (missing === "no_workspace") {
      emit("engine.error", { code: missing, message: "Falta elegir la carpeta del proyecto" });
      return ctx.say("sistema", "Elegí la carpeta del proyecto (arriba, en la barra) para que los agentes sepan dónde trabajar.");
    }
    if (missing === "no_api_key") {
      emit("engine.error", { code: missing, message: "Falta la API key" });
      return ctx.say("sistema", "Falta la API key de Anthropic: cargala en Ajustes para que los agentes puedan responder.");
    }
    background(handleChat(ctx, texto));
  }

  function resolve(key: string, value: unknown): void {
    ctx.decisions.get(key)?.(value);
    ctx.decisions.delete(key);
  }

  function handle(command: FabricaCommand, reply: Emit = emit): void {
    switch (command.type) {
      case "chat.send": return chat(command.data.texto);
      case "plan.approve": return approvePlan(ctx, command.data.planId, background);
      case "plan.reject": return rejectPlan(ctx, command.data.planId, command.data.comentario ?? "", background);
      case "block.approve": return resolve(`block:${command.data.blockId}`, { approve: true });
      case "block.reject":
        return resolve(`block:${command.data.blockId}`, {
          approve: false, comentario: command.data.comentario, marcas: command.data.marcas ?? [],
        });
      case "project.setCommitPerBlock": return setCommitPerBlock(ctx, command.data.enabled);
      case "memory.read": return memory.read(command, reply);
      case "memory.delete": return memory.remove(command);
      case "run.answer": return resolve(command.data.taskId, command.data.decision);
      case "budget.setLimit":
        ctx.budget.setLimit(command.data.usd);
        return emitStatus();
      case "budget.useReserve": return ctx.budget.useReserve();
      case "run.pause":
      case "run.resume":
        state.paused = command.type === "run.pause";
        ctx.gate.poke();
        return emitStatus();
      case "hello":
        return emit("engine.error", { code: "bad_command", message: "hello ya fue enviado" });
    }
  }

  return {
    handle, emitStatus, shutdown: () => {
      abort.abort();
      void ctx.preview.closeAll();
    },
    emitMemory: (reply) => emitMemory(ctx, reply),
    setMemoryPath: memory.setPath, guardMemory: memory.guard,
  };
}

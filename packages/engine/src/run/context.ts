import type { Emit } from "../emit.js";
import type { MemoryStore } from "../memory/store.js";
import type { BrowserRunner } from "../browser/types.js";
import { playwrightRunner } from "../browser/playwright.js";
import { createPreviewManager, type PreviewManager } from "../preview/manager.js";
import { commitEnabled } from "../git/blockCommit.js";
import { isGitRepo } from "../git/commit.js";
import { createBudget, type Budget } from "../budget/budget.js";
import type { ModelProvider } from "../provider/types.js";
import type { PlanOut } from "../roles/schemas.js";
import type { EngineState } from "../state.js";
import { createAgents, type Agents } from "./agents.js";
import { createGate, createPool, type Gate, type Pool } from "./gate.js";

/** Bloques en paralelo como máximo. */
export const MAX_PARALELO = 3;
/** Auditores en paralelo como máximo. */
export const MAX_AUDITORES = 2;

/** Resultado aprobado de un bloque ensamblado, para dar contexto a sus dependientes. */
export interface DoneBlock {
  resumen: string;
  archivos: string[];
}

/** Todo lo que comparte una corrida del motor. */
export interface Ctx {
  emit: Emit;
  provider: ModelProvider;
  state: EngineState;
  budget: Budget;
  gate: Gate;
  agents: Agents;
  auditors: Pool;
  memory: MemoryStore;
  signal: AbortSignal;
  auditorIds: Map<number, string>;
  branches: Set<string>;
  findings: string[];
  userMessages: string[];
  pendingPlan: { id: string; data: PlanOut } | null;
  done: Map<string, DoneBlock>;
  /** Servidores de vista previa de las carpetas de proyecto. */
  preview: PreviewManager;
  /** Ejecutor de recorridos en el navegador (Edge). */
  browser: BrowserRunner;
  /** Capturas del último recorrido de cada bloque, para dárselas al agente si el usuario rechaza. */
  captures: Map<string, string[]>;
  decisions: Map<string, (decision: unknown) => void>;
  counter: number;
  nextId(prefix: string): string;
  say(rol: "orquestador" | "sistema", texto: string): void;
  /** Emite `engine.status` con el estado actual a todos los clientes. */
  emitStatus(): void;
}

/**
 * Crea el contexto de una corrida.
 * @param deps Publicador, proveedor, estado del motor y señal de cierre.
 */
export function createCtx(deps: Pick<Ctx, "emit" | "provider" | "state" | "signal" | "memory"> & { browser?: BrowserRunner }): Ctx {
  const { emit } = deps;
  const gate = createGate(() => deps.state.paused || budget.blocked());
  const budget = createBudget(emit, () => gate.poke());
  return {
    ...deps,
    browser: deps.browser ?? playwrightRunner,
    preview: createPreviewManager(),
    captures: new Map(),
    budget,
    gate,
    agents: createAgents(emit),
    auditors: createPool(MAX_AUDITORES),
    auditorIds: new Map(),
    branches: new Set(),
    findings: [],
    userMessages: [],
    pendingPlan: null,
    done: new Map(),
    decisions: new Map(),
    counter: 0,
    nextId(prefix) {
      this.counter += 1;
      return `${prefix}-${this.counter}`;
    },
    say: (rol, texto) => emit("chat.message", { rol, texto }),
    emitStatus: () =>
      emit("engine.status", {
        apiKeyConfigured: deps.state.hasApiKey(), paused: deps.state.paused, workspace: deps.state.workspace,
        budgetLimit: budget.limit(), memoryCount: deps.memory.repo()?.count() ?? 0,
        commitPerBlock: commitEnabled(deps.state), gitRepo: deps.state.workspace !== null && isGitRepo(deps.state.workspace),
      }),
  };
}

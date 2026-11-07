import type { Emit } from "../emit.js";
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
  signal: AbortSignal;
  auditorIds: Map<number, string>;
  branches: Set<string>;
  findings: string[];
  userMessages: string[];
  pendingPlan: { id: string; data: PlanOut } | null;
  done: Map<string, DoneBlock>;
  decisions: Map<string, (decision: unknown) => void>;
  counter: number;
  nextId(prefix: string): string;
  say(rol: "orquestador" | "sistema", texto: string): void;
}

/**
 * Crea el contexto de una corrida.
 * @param deps Publicador, proveedor, estado del motor y señal de cierre.
 */
export function createCtx(deps: Pick<Ctx, "emit" | "provider" | "state" | "signal">): Ctx {
  const { emit } = deps;
  const gate = createGate(() => deps.state.paused || budget.blocked());
  const budget = createBudget(emit, () => gate.poke());
  return {
    ...deps,
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
  };
}

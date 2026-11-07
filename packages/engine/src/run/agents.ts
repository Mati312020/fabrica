import type { AgentState, ModelName } from "@fabrica/events";
import type { Emit } from "../emit.js";

/** Id fijo del agente orquestador (el nodo central del diagrama). */
export const ORCHESTRATOR_ID = "orquestador";

/** Registro de agentes: crea ids, emite estados y acumula tokens y costo por agente. */
export interface Agents {
  spawn(rama: string, modelo: ModelName, escaladoDesde?: ModelName): string;
  ensureOrchestrator(): void;
  status(id: string, estado: AgentState): void;
  /** Suma uso al agente y emite los totales acumulados. */
  addUsage(id: string, entrada: number, salida: number, costo: number): void;
}

/**
 * Crea el registro.
 * @param emit Publicador de eventos.
 */
export function createAgents(emit: Emit): Agents {
  const counters = new Map<string, number>();
  const totals = new Map<string, { entrada: number; salida: number; costo: number }>();
  let orchestrator = false;
  return {
    spawn(rama, modelo, escaladoDesde) {
      const n = (counters.get(rama) ?? 0) + 1;
      counters.set(rama, n);
      const id = `${rama}-${n}`;
      emit("agent.spawned", { id, rama, modelo, ...(escaladoDesde ? { escaladoDesde } : {}) });
      return id;
    },
    ensureOrchestrator() {
      if (orchestrator) return;
      orchestrator = true;
      emit("agent.spawned", { id: ORCHESTRATOR_ID, rama: ORCHESTRATOR_ID, modelo: "opus" });
    },
    status: (id, estado) => emit("agent.status", { id, estado }),
    addUsage(id, entrada, salida, costo) {
      const t = totals.get(id) ?? { entrada: 0, salida: 0, costo: 0 };
      t.entrada += entrada;
      t.salida += salida;
      t.costo += costo;
      totals.set(id, t);
      emit("agent.tokens", { id, ...t });
    },
  };
}

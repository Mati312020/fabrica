import type { FabricaEvent } from "@fabrica/events";
import { light } from "./fx";
import type { DomainState } from "./state";
import type { BlockInfo, BudgetPhase } from "./types";

const MAX_MESSAGES = 500;
/** Porcentajes del diseño (tablero 08): aviso y pausa. */
export const WARN_AT = 80;
export const PAUSE_AT = 95;

type PlanBlock = Pick<BlockInfo, "id" | "nombre" | "dependeDe" | "familia" | "tipo">;

const proposed = (b: PlanBlock): BlockInfo => ({
  ...b, pct: 0, estado: "propuesto", archivos: [], previewUrl: "", approvalSeq: 0, assembledSeq: 0,
});

function phaseFor(current: BudgetPhase, usado: number, limite: number): BudgetPhase {
  const pct = limite > 0 ? (usado / limite) * 100 : 0;
  if (pct < WARN_AT) return "normal";
  if (pct >= PAUSE_AT) return "pausa";
  return current === "pausa" ? "pausa" : "aviso";
}

function patchBlock(state: DomainState, id: string, patch: Partial<BlockInfo>): DomainState {
  const block = state.blocks[id];
  return block ? { ...state, blocks: { ...state.blocks, [id]: { ...block, ...patch } } } : state;
}

/**
 * Reduce los eventos de chat, motor, plan, bloques y presupuesto.
 * @param state Estado con `seq` ya actualizado.
 * @param event Evento del motor.
 */
export function reduceRun(state: DomainState, event: FabricaEvent): DomainState {
  switch (event.type) {
    case "chat.message": {
      const message = { id: state.seq, rol: event.data.rol, texto: event.data.texto };
      const next = { ...state, messages: [...state.messages, message].slice(-MAX_MESSAGES) };
      return event.data.rol === "usuario" ? light(next, ["chat"], "opus") : next;
    }
    case "engine.ready":
      return { ...state, engine: { version: event.data.version, protocol: event.data.protocol } };
    case "engine.status":
      return { ...state, ...event.data };
    case "plan.ready": {
      const blocks = Object.fromEntries(event.data.bloques.map((b) => [b.id, proposed(b)]));
      return { ...state, blocks, plan: { planId: event.data.planId, bloques: event.data.bloques, aprobado: false } };
    }
    case "block.progress": {
      const estado = state.blocks[event.data.blockId]?.estado;
      const open = estado === "propuesto" || estado === "pendiente";
      return patchBlock(state, event.data.blockId, { pct: event.data.pct, ...(open ? { estado: "construyendo" as const } : {}) });
    }
    case "block.approvalRequested":
      return patchBlock(state, event.data.blockId, {
        estado: "aprobacion", archivos: event.data.archivos, previewUrl: event.data.previewUrl, approvalSeq: state.seq,
      });
    case "block.assembled":
      return patchBlock(state, event.data.blockId, { estado: "ensamblado", pct: 100, assembledSeq: state.seq });
    case "budget.update": {
      const { usado, limite } = event.data;
      return { ...state, budget: { usado, limite }, budgetPhase: phaseFor(state.budgetPhase, usado, limite) };
    }
    case "budget.warning":
      return { ...state, budgetPhase: state.budgetPhase === "pausa" ? "pausa" : "aviso" };
    case "budget.paused":
      return { ...state, budgetPhase: "pausa" };
    default:
      return state;
  }
}

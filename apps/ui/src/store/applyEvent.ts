import type { FabricaEvent } from "@fabrica/events";
import type { DomainState } from "./state";
import { formatTime, summarize } from "./summarize";

const MAX_LOG = 200;
const MAX_MESSAGES = 500;

/**
 * Función pura: aplica un evento del motor al estado de dominio.
 * Todo evento queda en el registro; algunos además actualizan el estado visible.
 * @param state Estado anterior.
 * @param event Evento ya validado con zod.
 */
export function applyEvent(state: DomainState, event: FabricaEvent): DomainState {
  const seq = state.seq + 1;
  const entry = { id: seq, time: formatTime(event.at), type: event.type, summary: summarize(event) };
  const base = { ...state, seq, log: [...state.log, entry].slice(-MAX_LOG) };

  switch (event.type) {
    case "chat.message": {
      const message = { id: seq, rol: event.data.rol, texto: event.data.texto };
      return { ...base, messages: [...state.messages, message].slice(-MAX_MESSAGES) };
    }
    case "engine.ready":
      return { ...base, engine: { version: event.data.version, protocol: event.data.protocol } };
    case "engine.status":
      return { ...base, ...event.data };
    case "agent.spawned": {
      const agent = { modelo: event.data.modelo, estado: "esperando" as const };
      return { ...base, agents: { ...state.agents, [event.data.id]: agent } };
    }
    case "agent.status": {
      const agent = state.agents[event.data.id];
      if (!agent) return base;
      return { ...base, agents: { ...state.agents, [event.data.id]: { ...agent, estado: event.data.estado } } };
    }
    case "budget.update":
      return { ...base, budget: { usado: event.data.usado, limite: event.data.limite } };
    default:
      return base;
  }
}

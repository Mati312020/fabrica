import type { FabricaEvent } from "@fabrica/events";
import { reduceAgents } from "./reduceAgents";
import { reduceAudit } from "./reduceAudit";
import { reduceRun } from "./reduceRun";
import type { DomainState } from "./state";
import { formatTime, summarize } from "./summarize";

const MAX_LOG = 200;

/**
 * Función pura: aplica un evento del motor al estado de dominio.
 * Todo evento queda en el registro; los demás cambios salen de reductores por área.
 * @param state Estado anterior.
 * @param event Evento ya validado con zod.
 */
export function applyEvent(state: DomainState, event: FabricaEvent): DomainState {
  const seq = state.seq + 1;
  const entry = { id: seq, time: formatTime(event.at), type: event.type, summary: summarize(event) };
  const base = { ...state, seq, log: [...state.log, entry].slice(-MAX_LOG) };
  return reduceRun(reduceAudit(reduceAgents(base, event), event), event);
}

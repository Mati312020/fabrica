import type { DomainState } from "./state";
import type { AgentInfo, EdgeFx, FxColor } from "./types";

/**
 * Enciende cables: cada clave recibe el número de evento actual, que reinicia su animación.
 * @param state Estado ya con `seq` actualizado.
 * @param keys Claves lógicas en orden de recorrido (la primera se enciende antes).
 * @param color Color de la mecha.
 */
export function light(state: DomainState, keys: string[], color: FxColor): DomainState {
  const edgeFx: Record<string, EdgeFx> = { ...state.edgeFx };
  keys.forEach((key, step) => {
    edgeFx[key] = { seq: state.seq, color, step };
  });
  return { ...state, edgeFx };
}

/**
 * Cambia un agente conocido; si no existe devuelve el estado igual.
 * @param state Estado actual.
 * @param id Id del agente.
 * @param at Fecha ISO del evento (queda como último movimiento).
 * @param patch Cambios a aplicar.
 */
export function patchAgent(
  state: DomainState,
  id: string,
  at: string,
  patch: Partial<AgentInfo>,
): DomainState {
  const agent = state.agents[id];
  if (!agent) return state;
  return { ...state, agents: { ...state.agents, [id]: { ...agent, ...patch, lastAt: at } } };
}

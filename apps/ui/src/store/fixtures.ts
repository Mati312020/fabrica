import { eventSchema, type FabricaEvent } from "@fabrica/events";
import { applyEvent } from "./applyEvent";
import { initialState, type DomainState } from "./state";

/**
 * Arma un evento validado contra el contrato real. Solo para tests.
 * @param type Nombre del evento.
 * @param data Datos del evento.
 * @param second Segundo dentro de 12:00 para ordenar los eventos.
 */
export function ev(type: string, data: Record<string, unknown>, second = 0): FabricaEvent {
  const at = `2026-11-07T12:00:${String(second).padStart(2, "0")}.000Z`;
  return eventSchema.parse({ type, at, data });
}

/**
 * Aplica una lista de eventos al estado inicial. Solo para tests.
 * @param events Eventos en orden de llegada.
 * @param from Estado de partida.
 */
export function fold(events: FabricaEvent[], from: DomainState = initialState): DomainState {
  return events.reduce(applyEvent, from);
}

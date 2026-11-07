import type { AgentState, ModelName } from "@fabrica/events";
import type { AgentInfo, FxColor } from "../store/types";

/** Clase visual de cada estado (tablero 04). */
export const STATE_CLASS: Record<AgentState, string> = {
  esperando: "idle",
  dormido: "sleep",
  pensando: "on",
  trabajando: "on",
  en_auditoria: "aud",
  terminado: "done",
  error: "err",
  pausado: "pause",
};

/**
 * Color CSS de un modelo o de un resultado.
 * @param color Modelo, `ok` o `err`.
 */
export const cssColor = (color: FxColor | ModelName): string => `var(--${color})`;

/**
 * Milisegundos entre el primer estado activo del agente y su último evento.
 * @param agent Agente conocido.
 * @returns null si todavía no arrancó.
 */
export function elapsedMs(agent: Pick<AgentInfo, "startedAt" | "lastAt">): number | null {
  if (!agent.startedAt) return null;
  return Math.max(0, Date.parse(agent.lastAt) - Date.parse(agent.startedAt));
}

/**
 * Formatea una duración como mm:ss.
 * @param ms Milisegundos.
 */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

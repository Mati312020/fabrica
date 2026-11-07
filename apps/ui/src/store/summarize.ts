import type { FabricaEvent } from "@fabrica/events";

const MAX_SUMMARY = 80;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Formatea una fecha ISO como hh:mm:ss en hora local.
 * @param at Fecha ISO del evento.
 */
export function formatTime(at: string): string {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Resume los datos de un evento en una línea corta para el registro.
 * @param event Evento recibido.
 */
export function summarize(event: FabricaEvent): string {
  const entries = Object.entries(event.data as Record<string, unknown>);
  const text = entries
    .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" ");
  return text.length > MAX_SUMMARY ? `${text.slice(0, MAX_SUMMARY - 1)}…` : text;
}

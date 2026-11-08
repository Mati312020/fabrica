import type { TokenPoint } from "../store/types";

/** Cantidad máxima de barras que se conservan por agente. */
export const MAX_POINTS = 40;

/**
 * Agrega una actualización de uso a la serie; ignora las que no consumen tokens o retroceden.
 * @param serie Serie actual.
 * @param entrada Tokens de entrada nuevos (diferencia contra el acumulado anterior).
 * @param salida Tokens de salida nuevos.
 */
export function appendPoint(serie: readonly TokenPoint[], entrada: number, salida: number): TokenPoint[] {
  if (entrada <= 0 && salida <= 0) return [...serie];
  return [...serie, { entrada: Math.max(0, entrada), salida: Math.max(0, salida) }].slice(-MAX_POINTS);
}

/** Una barra ya medida, en unidades del viewBox. */
export interface Bar {
  x: number;
  inH: number;
  outH: number;
}

/**
 * Calcula las alturas de las barras de entrada y salida, escaladas al mayor valor de la serie.
 * @param serie Puntos a dibujar.
 * @param height Altura disponible de cada mitad (entrada arriba, salida abajo).
 * @param step Distancia horizontal entre barras.
 */
export function layoutBars(serie: readonly TokenPoint[], height: number, step: number): Bar[] {
  const max = Math.max(1, ...serie.flatMap((p) => [p.entrada, p.salida]));
  return serie.map((p, i) => ({ x: i * step, inH: (p.entrada / max) * height, outH: (p.salida / max) * height }));
}

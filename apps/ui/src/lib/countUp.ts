const MAX_STEP_MS = 40;
const TOTAL_MS = 600;

/**
 * Pausa entre cifras del contador (gramática 09, animación 05): min(40 ms, 600 ms / diferencia).
 * @param delta Cifras que faltan para llegar al valor final.
 */
export function stepDelay(delta: number): number {
  return Math.min(MAX_STEP_MS, TOTAL_MS / Math.max(1, Math.abs(delta)));
}

import { getBezierPath, getSmoothStepPath, getStraightPath, type Position } from "@xyflow/react";
import type { WireShape } from "./types";

const PX_PER_MS = 0.45;
const MIN_MS = 300;
const MAX_MS = 900;
const CURVE_FACTOR = 1.15;

/** Extremos de un cable tal como los entrega @xyflow/react. */
export interface WireEnds {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

/**
 * Trazado SVG del cable. Con `reverse` se recorre del destino al origen (la mecha viaja al revés).
 * @param shape Forma del cable.
 * @param ends Extremos.
 * @param reverse Recorrer al revés.
 */
export function wirePath(shape: WireShape, ends: WireEnds, reverse = false): string {
  const e = reverse
    ? { sourceX: ends.targetX, sourceY: ends.targetY, targetX: ends.sourceX, targetY: ends.sourceY, sourcePosition: ends.targetPosition, targetPosition: ends.sourcePosition }
    : ends;
  if (shape === "straight") return getStraightPath(e)[0];
  if (shape === "step") return getSmoothStepPath({ ...e, borderRadius: 12 })[0];
  return getBezierPath(e)[0];
}

/**
 * Tiempos de la mecha (gramática 09, animación 01): ≈450 px/s entre 300 y 900 ms.
 * El segmento `step` espera a que terminen los anteriores.
 * @param ends Extremos del cable.
 * @param step Posición del segmento en el recorrido (0 es el primero).
 */
export function fuseTiming(ends: Pick<WireEnds, "sourceX" | "sourceY" | "targetX" | "targetY">, step: number) {
  const length = Math.hypot(ends.targetX - ends.sourceX, ends.targetY - ends.sourceY) * CURVE_FACTOR;
  const travel = Math.min(MAX_MS, Math.max(MIN_MS, length / PX_PER_MS));
  return { travel, delay: step * travel };
}

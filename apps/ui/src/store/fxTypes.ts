import type { ModelName } from "@fabrica/events";

/** Color de un cable encendido. */
export type FxColor = ModelName | "ok" | "err";

/** Último encendido de un cable: `seq` cambia con cada evento y reinicia la animación. */
export interface EdgeFx {
  seq: number;
  color: FxColor;
  /** Segmento dentro del recorrido (0 primero): retrasa la mecha. */
  step: number;
}

/** Fase del presupuesto según los avisos del motor. */
export type BudgetPhase = "normal" | "aviso" | "pausa";

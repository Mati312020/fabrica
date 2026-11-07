import type { Emit } from "../emit.js";

/** Presupuesto por defecto en US$. */
export const DEFAULT_LIMIT_USD = 5;
const WARN = 80;
const PAUSE = 95;
const FULL = 100;

/** Presupuesto del proyecto: avisa al 80%, pausa al 95% y permite usar la reserva hasta el 100%. */
export interface Budget {
  limit(): number;
  used(): number;
  /** Lo que queda hasta el tope duro (nunca menor a un centavo). */
  remaining(): number;
  add(costUsd: number): void;
  setLimit(usd: number): void;
  useReserve(): void;
  /** True si no hay que despachar nada. */
  blocked(): boolean;
  /** True desde el 80%: no se crean ramas nuevas. */
  noNewBranches(): boolean;
}

/**
 * Crea el presupuesto.
 * @param emit Publicador de eventos.
 * @param onChange Se llama cuando cambia el estado de bloqueo (para despertar a los que esperan).
 */
export function createBudget(emit: Emit, onChange: () => void): Budget {
  let limit = DEFAULT_LIMIT_USD;
  let used = 0;
  let reserve = false;
  let warned = false;
  let pausedSent = false;
  const pct = () => (limit > 0 ? (used / limit) * 100 : FULL);
  const blocked = () => pct() >= FULL || (pct() >= PAUSE && !reserve);

  function check(): void {
    emit("budget.update", { usado: used, limite: limit });
    warned = warned && pct() >= WARN;
    if (!warned && pct() >= WARN) {
      warned = true;
      emit("budget.warning", { pct: Math.min(FULL, Math.round(pct())) });
    }
    if (blocked() && !pausedSent) emit("budget.paused", { pct: Math.min(FULL, Math.round(pct())) });
    pausedSent = blocked();
    onChange();
  }

  return {
    limit: () => limit,
    used: () => used,
    remaining: () => Math.max(0.01, (reserve ? limit : limit * (PAUSE / FULL)) - used),
    add(costUsd) {
      used += Math.max(0, costUsd);
      check();
    },
    setLimit(usd) {
      limit = usd;
      reserve = reserve && pct() >= PAUSE;
      check();
    },
    useReserve() {
      reserve = true;
      check();
    },
    blocked,
    noNewBranches: () => pct() >= WARN,
  };
}

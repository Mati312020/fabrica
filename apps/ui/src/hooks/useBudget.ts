import { useMemo } from "react";
import { PAUSE_AT, WARN_AT } from "../store/reduceRun";
import { costByModel } from "../store/selectors";
import { useFabricaStore } from "../store/store";
import { useUi } from "../store/uiStore";
import type { SendCommand } from "./useEngine";

/** Reserva final del presupuesto (del 95 % al 100 %). */
const RESERVE_SHARE = 100 - PAUSE_AT;

/** Datos derivados del presupuesto y sus acciones (`budget.setLimit`, `budget.useReserve`). */
export function useBudget(send: SendCommand) {
  const budget = useFabricaStore((s) => s.domain.budget);
  const fallbackLimit = useFabricaStore((s) => s.domain.budgetLimit);
  const phase = useFabricaStore((s) => s.domain.budgetPhase);
  const agents = useFabricaStore((s) => s.domain.agents);
  const reserveAsked = useUi((s) => s.reserveAsked);
  const askReserve = useUi((s) => s.askReserve);
  const costs = useMemo(() => costByModel(agents), [agents]);
  const limit = budget?.limite ?? fallbackLimit;
  const pct = budget && limit > 0 ? Math.min(100, (budget.usado / limit) * 100) : 0;
  return {
    budget,
    limit,
    pct,
    phase,
    costs,
    warnAt: (limit * WARN_AT) / 100,
    pauseAt: (limit * PAUSE_AT) / 100,
    reserveUsd: (limit * RESERVE_SHARE) / 100,
    canReserve: phase === "pausa" && pct < 100 && !reserveAsked,
    final: pct >= 100,
    setLimit: (usd: number) => send("budget.setLimit", { usd }),
    reserve: () => send("budget.useReserve", {}) && askReserve(),
  };
}

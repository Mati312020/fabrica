import { useTranslation } from "react-i18next";
import { useFabricaStore } from "../store/store";
import { EmptyState, Panel, PanelHeader } from "./Panel";

const WARN_AT = 80;
const PAUSE_AT = 95;

/** Presupuesto: vacío hasta que el motor emita `budget.update`. */
export function Budget() {
  const { t, i18n } = useTranslation();
  const budget = useFabricaStore((s) => s.domain.budget);
  if (!budget) {
    return (
      <Panel label={t("budget.title")} className="gap-2 px-3.5 py-3">
        <PanelHeader title={t("budget.title")} />
        <EmptyState>{t("budget.empty")}</EmptyState>
      </Panel>
    );
  }
  const money = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD" });
  const pct = budget.limite > 0 ? Math.min(100, (budget.usado / budget.limite) * 100) : 0;
  return (
    <Panel label={t("budget.title")} className="gap-2 px-3.5 py-3">
      <PanelHeader title={t("budget.title")} />
      <div className="flex items-baseline gap-1.5">
        <span className="mono text-[28px] leading-none font-semibold">{money.format(budget.usado)}</span>
        <span className="mono text-xs text-tx3">/ {money.format(budget.limite)}</span>
      </div>
      <span className="mono text-[11px] text-tx2">{t("budget.used", { pct: Math.round(pct) })}</span>
      <div className="relative mt-1 h-1.5 rounded-sm bg-tx/10">
        <i className="absolute inset-y-0 left-0 rounded-sm bg-tx2" style={{ width: `${pct}%` }} />
        <i className="absolute -top-1 h-3.5 w-px bg-warn" style={{ left: `${WARN_AT}%` }} />
        <i className="absolute -top-1 h-3.5 w-px bg-err" style={{ left: `${PAUSE_AT}%` }} />
      </div>
    </Panel>
  );
}

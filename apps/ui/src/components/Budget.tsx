import { useTranslation } from "react-i18next";
import { MODELS } from "@fabrica/events";
import type { SendCommand } from "../hooks/useEngine";
import { useBudget } from "../hooks/useBudget";
import { useFormat } from "../hooks/useFormat";
import { PAUSE_AT, WARN_AT } from "../store/reduceRun";
import { BudgetLimit } from "./BudgetLimit";
import { Panel, PanelHeader } from "./Panel";

/** Presupuesto (tablero 08): tres estados, desglose por modelo, límite editable y botón de reserva. */
export function Budget({ send }: { send: SendCommand }) {
  const { t } = useTranslation();
  const { money, int } = useFormat();
  const b = useBudget(send);
  const tone = b.phase === "pausa" ? "stop" : b.phase === "aviso" ? "warn" : "";
  return (
    <Panel label={t("budget.title")} className={`bcard ${tone} gap-2 overflow-y-auto px-3.5 py-3 [&>*]:shrink-0`}>
      <PanelHeader title={t("budget.title")} {...(b.budget ? { aside: t(`budget.phase.${b.phase}`) } : {})} />
      {b.budget ? (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="mono text-[22px] leading-none font-semibold">{money(b.budget.usado)}</span>
            <span className="mono text-xs text-tx3">/ {money(b.limit)}</span>
          </div>
          <span className="mono text-[11px] text-[var(--s)]">{t("budget.used", { pct: Math.round(b.pct) })}</span>
          <div className="bbar mb-3">
            <i className="fill" style={{ width: `${b.pct}%` }} />
            {b.phase === "pausa" ? <span className="res" /> : null}
            <span className="tick bg-warn" style={{ left: `${WARN_AT}%` }} />
            <span className="tick bg-err" style={{ left: `${PAUSE_AT}%` }} />
            <span className="tl text-warn" style={{ left: `${WARN_AT}%` }}>{WARN_AT}</span>
            <span className="tl text-err" style={{ left: `${PAUSE_AT}%` }}>{PAUSE_AT}</span>
          </div>
          {(b.canReserve ? [] : MODELS).map((m) => (
            <div key={m} className="mono flex justify-between gap-2 text-[11px] text-tx3">
              <span style={{ color: `var(--${m})` }}>{m}</span>
              <span title={t("budget.tokens", { input: int(b.usage[m].entrada), output: int(b.usage[m].salida) })}>
                {int(b.usage[m].entrada + b.usage[m].salida)} tok · {money(b.usage[m].costo)}
              </span>
            </div>
          ))}
          {b.canReserve ? null : (
            <span className="mono text-[10.5px] leading-snug text-tx3">
              {t("budget.thresholds", { warn: money(b.warnAt), pause: money(b.pauseAt) })}
            </span>
          )}
          {b.canReserve ? (
            <button type="button" className="btn pri h-8!" onClick={b.reserve}>
              {t("budget.reserve", { amount: money(b.reserveUsd) })}
            </button>
          ) : null}
          {b.final ? <span className="mono text-[11px] text-err">{t("budget.final")}</span> : null}
        </>
      ) : (
        <p className="m-0 font-mono text-[11.5px] text-tx3">{t("budget.empty")}</p>
      )}
      <BudgetLimit limit={b.limit} onSubmit={b.setLimit} />
    </Panel>
  );
}

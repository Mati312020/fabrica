import { useState } from "react";
import { useTranslation } from "react-i18next";
import { blockColors, planStats } from "../../lib/plan";
import type { PlanInfo } from "../../store/types";

/** Props de {@link PlanCard}. */
interface PlanCardProps {
  plan: PlanInfo;
  onApprove(): void;
  onReject(comment: string): void;
}

/** Tarjeta de aprobación del plan (tablero 07): bloques, dependencias, cambios opcionales y botones. */
export function PlanCard({ plan, onApprove, onReject }: PlanCardProps) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const colors = blockColors(plan.bloques);
  const stats = planStats(plan.bloques);
  return (
    <div className="acard plan">
      <div>
        <small>{t("cards.planPending")}</small>
        <span className="mono text-[13px] font-semibold">{t("cards.planStats", stats)}</span>
        <p className="m-0 text-[11.5px] text-tx3">{t("cards.planNote")}</p>
      </div>
      <table className="ptable">
        <thead>
          <tr><th>{t("cards.block")}</th><th>{t("cards.dependsOn")}</th></tr>
        </thead>
        <tbody>
          {plan.bloques.map((b) => (
            <tr key={b.id}>
              <td className="mono text-tx">
                <span className="sq" style={{ background: colors[b.id] ?? "var(--idle)" }} />
                {b.nombre}
                {b.tipo === "visual" ? <span className="vis"> · {t("cards.visual")}</span> : null}
              </td>
              <td>{b.dependeDe.length === 0 ? "—" : b.dependeDe.map((d) => <span key={d} className="dep">{d}</span>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <input
        value={comment}
        maxLength={4000}
        onChange={(e) => setComment(e.target.value)}
        aria-label={t("cards.planComment")}
        placeholder={t("cards.planComment")}
        className="h-8 rounded-md border border-line bg-transparent px-2.5 text-[12px] text-tx placeholder:text-tx3"
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={() => onReject(comment.trim())}>{t("cards.requestChanges")}</button>
        <button type="button" className="btn ok" onClick={onApprove}>{t("cards.approvePlan")}</button>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useFabricaStore } from "../../store/store";
import type { BrowserReport } from "../../store/types";

const Section = ({ label, items, tone }: { label: string; items: string[]; tone?: string }) => (
  <div>
    <span className="lbl">{label} · {items.length}</span>
    {items.length > 0 ? (
      <ul>
        {items.map((item, i) => <li key={i} className={tone ?? ""} title={item}>{item}</li>)}
      </ul>
    ) : null}
  </div>
);

/** Informe de una auditoría en navegador: errores, requests fallidos, pasos fallidos y capturas (solo rutas). */
export function BrowserReportView({ report }: { report: BrowserReport }) {
  const { t } = useTranslation();
  const clean = report.errores.length + report.fallidos.length + report.pasosFallidos.length === 0;
  return (
    <div className="rep">
      <span className="lbl">{t("report.title", { task: report.taskId })}</span>
      {clean ? <span className="mono text-[11.5px] text-ok">{t("report.clean")}</span> : null}
      <Section label={t("report.errors")} items={report.errores} tone="text-err" />
      <Section label={t("report.failed")} items={report.fallidos} tone="text-err" />
      <Section label={t("report.steps")} items={report.pasosFallidos} tone="text-warn" />
      <Section label={t("report.captures")} items={report.capturas} />
      {report.capturas.length > 0 ? <span className="mono text-[10.5px] text-tx3">{t("report.capturesNote")}</span> : null}
    </div>
  );
}

/** Informes del navegador, el más reciente primero; con `taskId` solo el de esa tarea. */
export function BrowserReports({ taskId }: { taskId?: string | null }) {
  const reports = useFabricaStore((s) => s.domain.browserReports);
  const list = Object.values(reports)
    .filter((r) => taskId === undefined || r.taskId === taskId)
    .sort((a, b) => b.seq - a.seq);
  return <>{list.map((r) => <BrowserReportView key={r.taskId} report={r} />)}</>;
}

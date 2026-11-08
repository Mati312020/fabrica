import { useTranslation } from "react-i18next";
import { auditors } from "../../lib/diagram/columns";
import type { SendCommand } from "../../hooks/useEngine";
import { useFabricaStore } from "../../store/store";
import { EmptyState } from "../Panel";
import { BrowserReports } from "./BrowserReportView";
import { CloseButton } from "./CloseButton";
import { MemoryList } from "./MemoryList";

/** Detalle de Memoria·Auditoría: auditores, último veredicto con su motivo e historial de la sesión. */
export function AuditDetail({ send }: { send: SendCommand }) {
  const { t } = useTranslation();
  const audit = useFabricaStore((s) => s.domain.audit);
  const agents = useFabricaStore((s) => s.domain.agents);
  const count = useFabricaStore((s) => s.domain.memory.count);
  const verdict = audit.veredicto;
  const history = [...audit.historial].reverse();
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="mtag">OPUS</span>
        <span className="mono text-[15px] font-semibold">{t("diagram.memory")}</span>
        <CloseButton />
      </div>
      <div className="stats s4">
        <div><span className="lbl">{t("diagram.calls")}</span><span className="stat-big">{audit.llamadas}</span></div>
        <div><span className="lbl">{t("diagram.auditors")}</span><span className="stat-big">{auditors(agents).length}</span></div>
        <div>
          <span className="lbl">{t("diagram.lastVerdict")}</span>
          <span className={`stat-big ${verdict ? (verdict.ok ? "text-ok" : "text-err") : "text-tx3"}`}>
            {verdict ? t(verdict.ok ? "diagram.approved" : "diagram.rejected") : "—"}
          </span>
        </div>
        <div><span className="lbl">{t("diagram.memories")}</span><span className="stat-big">{count}</span></div>
      </div>
      {verdict ? (
        <div className="rounded-lg border border-line p-3">
          <span className="lbl">{t("detail.reason")}</span>
          <p className="m-0 mt-1.5 text-[13px] leading-normal text-tx2">{verdict.motivo || t("detail.noReason")}</p>
        </div>
      ) : (
        <EmptyState>{t("detail.noAudits")}</EmptyState>
      )}
      <BrowserReports />
      <MemoryList send={send} />
      <span className="mono text-[11px] text-tx3">{t("memory.note")}</span>
      <ul className="m-0 flex list-none flex-col p-0">
        {history.map((v) => (
          <li key={v.seq} className="mono flex gap-2 border-b border-border py-1.5 text-[11.5px]">
            <span className={v.ok ? "text-ok" : "text-err"}>{t(v.ok ? "diagram.approved" : "diagram.rejected")}</span>
            <span className="text-tx2">{v.agentId}</span>
            <span className="truncate text-tx3">{v.motivo}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

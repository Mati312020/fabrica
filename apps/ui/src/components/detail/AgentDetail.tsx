import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat";
import { useStickToBottom } from "../../hooks/useStickToBottom";
import { elapsedMs, formatElapsed } from "../../lib/agentView";
import { useFabricaStore } from "../../store/store";
import { formatTime } from "../../store/summarize";
import { EmptyState } from "../Panel";
import { BrowserReports } from "./BrowserReportView";
import { CloseButton } from "./CloseButton";

const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <div>
    <span className="lbl">{label}</span>
    <span className="stat-big">{value}</span>
    {unit ? <span className="mono text-[10px] text-tx3">{unit}</span> : null}
  </div>
);

/** Detalle de un agente (tablero 05 sin memoria): estado, herramienta, tarea, tiempo, tokens, costo y salida. */
export function AgentDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { money, int } = useFormat();
  const agent = useFabricaStore((s) => s.domain.agents[id]);
  const branch = useFabricaStore((s) => s.domain.branches.find((b) => b.id === agent?.rama));
  const live = useStickToBottom<HTMLDivElement>(agent?.texto);
  if (!agent) return <EmptyState>{t("detail.gone")}</EmptyState>;
  const elapsed = elapsedMs(agent);
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="mtag">{agent.modelo.toUpperCase()}</span>
        <span className="mono text-[15px] font-semibold">{agent.id}</span>
        {agent.escaladoDesde ? <span className="mono text-[11px] text-warn">{t("detail.escalatedFrom", { model: agent.escaladoDesde })}</span> : null}
        <CloseButton />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="lbl">{t("detail.state")}</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="state">{t(`agent.state.${agent.estado}`)}</span>
          {agent.herramienta ? (
            <span className="mono rounded-[5px] border border-line px-2 py-1 text-xs text-tx2">
              <b className="text-[var(--m)]">▸ {agent.herramienta.nombre}</b> {agent.herramienta.detalle}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="lbl">{t("detail.task", { branch: branch?.nombre ?? agent.rama })}</span>
        <p className="m-0 text-[14px] leading-normal text-tx">{agent.tarea ?? t("detail.noTask")}</p>
      </div>
      <div className="stats">
        <Stat label={t("detail.time")} value={elapsed === null ? "—" : formatElapsed(elapsed)} />
        <Stat label={t("detail.progress")} value={agent.pct === null ? "—" : `${agent.pct}%`} />
        <Stat label={t("detail.cost")} value={money(agent.costo)} />
        <Stat label={t("detail.input")} value={int(agent.entrada)} unit={t("detail.tokens")} />
        <Stat label={t("detail.output")} value={int(agent.salida)} unit={t("detail.tokens")} />
      </div>
      {agent.taskId ? <BrowserReports taskId={agent.taskId} /> : null}
      <div className="flex min-h-0 flex-col gap-2">
        <span className="lbl">{t("detail.liveText")}</span>
        <div ref={live} className="live">{agent.texto || t("detail.noText")}</div>
      </div>
      <span className="mono text-[11px] text-tx3">
        {agent.startedAt ? t("detail.startedAt", { time: formatTime(agent.startedAt) }) : t("detail.notStarted")}
      </span>
    </>
  );
}

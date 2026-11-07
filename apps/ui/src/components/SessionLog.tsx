import { useTranslation } from "react-i18next";
import { useAlfaStore } from "../store/store";
import { EmptyState, Panel, PanelHeader } from "./Panel";

const VISIBLE_LINES = 10;
/** Brillo por antigüedad (gramática 10): 100 %, 70 %, 50 %, 38 %... mínimo 28 %. */
const AGE_OPACITY = [1, 0.7, 0.5, 0.38, 0.32, 0.28];

/**
 * Opacidad de una línea según cuántas más nuevas tiene.
 * @param age 0 para la más reciente.
 */
export function logOpacity(age: number): number {
  return AGE_OPACITY[Math.min(age, AGE_OPACITY.length - 1)] ?? 0.28;
}

/** Registro de sesión: una línea `hh:mm:ss · tipo · resumen` por cada evento recibido. */
export function SessionLog() {
  const { t } = useTranslation();
  const log = useAlfaStore((s) => s.domain.log);
  const lines = log.slice(-VISIBLE_LINES);
  return (
    <Panel label={t("log.title")} className="gap-2 px-3.5 py-3">
      <PanelHeader title={t("log.title")} aside={t("log.count", { count: log.length })} />
      {lines.length === 0 ? <EmptyState>{t("log.empty")}</EmptyState> : null}
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden font-mono text-[11.5px] leading-5">
        {lines.map((line, index) => (
          <div
            key={line.id}
            className="log-line flex gap-2 whitespace-nowrap"
            style={{ opacity: logOpacity(lines.length - 1 - index) }}
          >
            <span className="shrink-0 text-tx3">{line.time}</span>
            <span className="shrink-0 text-tx2">·</span>
            <span className="shrink-0 text-tx">{line.type}</span>
            <span className="shrink-0 text-tx2">·</span>
            <span className="truncate text-tx2">{line.summary}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

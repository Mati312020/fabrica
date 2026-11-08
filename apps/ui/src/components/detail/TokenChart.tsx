import { useTranslation } from "react-i18next";
import { layoutBars, MAX_POINTS } from "../../lib/tokenSeries";
import type { TokenPoint } from "../../store/types";

const STEP = 8;
const HALF = 34;
const WIDTH = MAX_POINTS * STEP;

/** Serie de tokens de un agente: barras finas, entrada hacia arriba y salida hacia abajo de la línea central. */
export function TokenChart({ serie }: { serie: readonly TokenPoint[] }) {
  const { t } = useTranslation();
  const bars = layoutBars(serie, HALF - 2, STEP);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <span className="lbl">{t("detail.series")}</span>
        <span className="mono text-[10.5px] text-[var(--m)]">▲ {t("detail.input")}</span>
        <span className="mono text-[10.5px] text-tx3">▼ {t("detail.output")}</span>
      </div>
      {bars.length === 0 ? (
        <p className="m-0 font-mono text-[11.5px] text-tx3">{t("detail.seriesEmpty")}</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HALF * 2}`} className="h-[72px] w-full" role="img" aria-label={t("detail.seriesLabel", { count: bars.length })} preserveAspectRatio="xMinYMid meet">
          <line x1="0" x2={WIDTH} y1={HALF} y2={HALF} stroke="var(--line)" strokeWidth="1" />
          {bars.map((b, i) => (
            <g key={i}>
              <rect x={b.x + 2} y={HALF - b.inH} width="3" height={b.inH} fill="var(--m)" />
              <rect x={b.x + 2} y={HALF} width="3" height={b.outH} fill="var(--tx3)" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

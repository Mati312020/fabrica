import { useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { PREVIEW_WIDTHS, type PreviewWidth } from "../../hooks/usePreviewReview";
import type { Mark } from "../../lib/marks";

/** Props de {@link PreviewFrame}. */
interface PreviewFrameProps {
  url: string;
  width: PreviewWidth;
  marking: boolean;
  marks: Mark[];
  onPlace(x: number, y: number, rect: DOMRect): void;
}

/** Vista previa embebida: iframe aislado (sin same-origin) y, en modo marcar, capa transparente con pines. */
export function PreviewFrame({ url, width, marking, marks, onPlace }: PreviewFrameProps) {
  const { t } = useTranslation();
  const area = useRef<HTMLDivElement>(null);
  const click = (e: MouseEvent) => {
    const rect = area.current?.getBoundingClientRect();
    if (rect) onPlace(e.clientX, e.clientY, rect);
  };
  return (
    <div className="pframe">
      <div className="pchrome">
        <span>{t("preview.title")}</span>
        <span className="purl">{url}</span>
        <span>{PREVIEW_WIDTHS[width]} px</span>
      </div>
      <div className="pstage">
        <div ref={area} className="parea" style={{ width: width === "mobile" ? 390 : "100%", maxWidth: "100%" }}>
          <iframe
            title={t("preview.iframe")}
            src={url}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
          />
          {marking ? <div className="pcatch" onClick={click} aria-label={t("preview.markLayer")} role="presentation" /> : null}
          {marks.map((m, i) => (
            <span key={i} className="ppin" style={{ left: `${m.x}%`, top: `${m.y}%` }}>{i + 1}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

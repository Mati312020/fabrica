import { useTranslation } from "react-i18next";
import { useEscape } from "../../hooks/useEscape";
import { usePreviewReview } from "../../hooks/usePreviewReview";
import { toAncho, toCommandMarks, type Ancho, type Mark } from "../../lib/marks";
import type { BlockInfo } from "../../store/types";
import { MarkList } from "./MarkList";
import { PreviewFrame } from "./PreviewFrame";
import { WidthSwitch } from "./WidthSwitch";

/** Props de {@link PreviewReview}. */
interface PreviewReviewProps {
  block: BlockInfo;
  /** URL ya validada como 127.0.0.1. */
  url: string;
  onApprove(): void;
  onReject(comment: string, marks: Mark[], ancho: Ancho): void;
  onClose(): void;
}

/** Aprobación de un bloque visual (tablero 06): vista previa, marcas, comentario general y decisión. */
export function PreviewReview({ block, url, onApprove, onReject, onClose }: PreviewReviewProps) {
  const { t } = useTranslation();
  const r = usePreviewReview();
  useEscape(onClose, true);
  return (
    <div className="fixed inset-0 z-20 flex bg-black/55 p-8" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={t("preview.dialog", { name: block.nombre })} onClick={(e) => e.stopPropagation()} className="glass pcard">
        <div className="flex flex-wrap items-center gap-3">
          <span className="lbl text-warn!">{t("preview.pending")}</span>
          <span className="mono text-[16px] font-semibold">{block.nombre}</span>
          <WidthSwitch value={r.width} onChange={r.setWidth} />
          <button type="button" aria-pressed={r.marking} className={r.marking ? "btn tg on" : "btn tg"} onClick={() => r.setMarking(!r.marking)}>
            {r.marking ? t("preview.marking") : t("preview.mark")}
          </button>
          <button type="button" className="btn ml-auto" onClick={onClose}>{t("preview.close")}</button>
        </div>
        <div className="flex min-h-0 flex-1 gap-5">
          <PreviewFrame url={url} width={r.width} marking={r.marking && !r.full} marks={r.marks} onPlace={r.place} />
          <div className="pside">
            <span className="lbl">{t("preview.changes", { count: r.marks.length })}</span>
            {r.marks.length === 0 ? <p className="m-0 text-[13px] leading-normal text-tx3">{r.marking ? t("preview.markHint") : t("preview.enableHint")}</p> : null}
            <MarkList marks={r.marks} onText={r.setText} onRemove={r.remove} />
            <label className="lbl" htmlFor="preview-comment">{t("preview.general")}</label>
            <textarea id="preview-comment" value={r.comment} maxLength={4000} onChange={(e) => r.setComment(e.target.value)} />
            <div className="mt-auto flex flex-col gap-2.5">
              <button type="button" className="btn big ok" onClick={onApprove}>{t("preview.approve")}</button>
              <button type="button" disabled={!r.canReject} className="btn big no" onClick={() => onReject(r.comment.trim(), toCommandMarks(r.marks), toAncho(r.width))}>
                {r.marks.length === 0 ? t("preview.rejectComment") : t("preview.reject", { count: r.marks.length })}
              </button>
              <span className="mono text-[11px] leading-normal text-tx3">{t("preview.rejectNote")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

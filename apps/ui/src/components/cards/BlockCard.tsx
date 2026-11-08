import { useState } from "react";
import { useTranslation } from "react-i18next";
import { safePreviewUrl } from "../../lib/previewUrl";
import type { Mark } from "../../lib/marks";
import type { BlockInfo } from "../../store/types";
import { PreviewReview } from "../preview/PreviewReview";

/** Props de {@link BlockCard}. */
interface BlockCardProps {
  block: BlockInfo;
  onApprove(): void;
  onReject(comment: string, marks?: Mark[]): void;
}

/** Tarjeta de un bloque visual: archivos, vista previa (solo si es 127.0.0.1) y decisión. */
export function BlockCard({ block, onApprove, onReject }: BlockCardProps) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const url = safePreviewUrl(block.previewUrl);
  return (
    <div className="acard">
      <div>
        <small>{t("cards.blockPending")}</small>
        <span className="mono text-[12px] text-tx">{block.nombre}</span>
      </div>
      {block.previewUrl ? <span className="mono truncate text-[11px] text-tx2">{block.previewUrl}</span> : null}
      {block.previewUrl && !url ? <span className="mono text-[11px] text-err">{t("preview.unsafe")}</span> : null}
      {url ? <button type="button" className="btn pri" onClick={() => setReviewing(true)}>{t("preview.open")}</button> : null}
      {url && reviewing ? (
        <PreviewReview block={block} url={url} onApprove={onApprove} onReject={onReject} onClose={() => setReviewing(false)} />
      ) : null}
      {block.archivos.length === 0 ? (
        <span className="mono text-[11px] text-tx3">{t("cards.noFiles")}</span>
      ) : (
        <ul className="mono m-0 max-h-20 list-none overflow-y-auto p-0 text-[11px] text-tx2">
          {block.archivos.map((f) => <li key={f} className="truncate">{f}</li>)}
        </ul>
      )}
      {rejecting ? (
        <input
          autoFocus
          value={comment}
          maxLength={4000}
          onChange={(e) => setComment(e.target.value)}
          aria-label={t("cards.rejectComment")}
          placeholder={t("cards.rejectComment")}
          className="h-8 rounded-md border border-line bg-transparent px-2.5 text-[12px] text-tx placeholder:text-tx3"
        />
      ) : null}
      <div className="flex justify-end gap-2">
        {rejecting ? (
          <button type="button" className="btn no" onClick={() => onReject(comment.trim())}>{t("cards.confirmReject")}</button>
        ) : (
          <>
            <button type="button" className="btn ok" onClick={onApprove}>{t("cards.approve")}</button>
            <button type="button" className="btn no" onClick={() => setRejecting(true)}>{t("cards.reject")}</button>
          </>
        )}
      </div>
    </div>
  );
}

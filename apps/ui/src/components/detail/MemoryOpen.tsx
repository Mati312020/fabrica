import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MemoryContent } from "../../store/memoryTypes";

/** Props de {@link MemoryOpen}. */
interface MemoryOpenProps {
  /** Recuerdo ya cargado, o null mientras llega `memory.content`. */
  content: MemoryContent | null;
  onClose(): void;
  onDelete(): void;
}

/** Recuerdo abierto: contenido, etiquetas y origen; borrar pide confirmación dentro de la página (sin `confirm()`). */
export function MemoryOpen({ content, onClose, onDelete }: MemoryOpenProps) {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  if (!content) return <div className="open mono text-tx3">{t("memory.loading")}</div>;
  const when = new Date(content.actualizado).toLocaleString(i18n.language);
  return (
    <div className="open flex flex-col gap-2" role="region" aria-label={content.titulo}>
      <p className="m-0 whitespace-pre-wrap break-words text-tx">{content.contenido}</p>
      {content.etiquetas.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {content.etiquetas.map((tag) => <li key={tag} className="dep">{tag}</li>)}
        </ul>
      ) : null}
      <span className="mono text-[10.5px] text-tx3">
        {t("memory.origin", { project: content.proyecto || "—", agent: content.agente || "—", task: content.tarea || "—", when })}
      </span>
      <div className="flex items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="mono mr-auto text-[11px] text-err">{t("memory.confirm")}</span>
            <button type="button" className="btn no" onClick={onDelete}>{t("memory.confirmDelete")}</button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>{t("memory.keep")}</button>
          </>
        ) : (
          <>
            <button type="button" className="btn no" onClick={() => setConfirming(true)}>{t("memory.delete")}</button>
            <button type="button" className="btn" onClick={onClose}>{t("memory.close")}</button>
          </>
        )}
      </div>
    </div>
  );
}

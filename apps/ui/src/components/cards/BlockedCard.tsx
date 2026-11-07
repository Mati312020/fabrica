import { useTranslation } from "react-i18next";
import type { BlockedTask } from "../../store/types";

/** Props de {@link BlockedCard}. */
interface BlockedCardProps {
  blocked: BlockedTask;
  onAnswer(decision: "reintentar" | "cancelar"): void;
}

/** Tarjeta de una tarea bloqueada: Opus falló tres veces y el motor espera `run.answer`. */
export function BlockedCard({ blocked, onAnswer }: BlockedCardProps) {
  const { t } = useTranslation();
  return (
    <div className="acard stop">
      <div>
        <small>{t("cards.blocked")}</small>
        <span className="text-[12px] text-tx2">{blocked.motivo}</span>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn pri" onClick={() => onAnswer("reintentar")}>{t("cards.retry")}</button>
        <button type="button" className="btn no" onClick={() => onAnswer("cancelar")}>{t("cards.cancel")}</button>
      </div>
    </div>
  );
}

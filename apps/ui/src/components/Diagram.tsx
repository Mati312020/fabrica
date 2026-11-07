import { useTranslation } from "react-i18next";
import { EmptyState } from "./Panel";

/** Diagrama de agentes: sin eventos de agentes todavía, solo el estado vacío. */
export function Diagram() {
  const { t } = useTranslation();
  return (
    <section aria-label={t("diagram.title")} className="flex min-h-0 min-w-0 flex-col">
      <span className="lbl px-1">{t("diagram.title")}</span>
      <EmptyState>{t("diagram.empty")}</EmptyState>
    </section>
  );
}

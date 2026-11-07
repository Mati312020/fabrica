import { useTranslation } from "react-i18next";
import { EmptyState, Panel, PanelHeader } from "./Panel";

/** Panel de montaje (columna derecha): vacío hasta que se apruebe un plan. */
export function Assembly() {
  const { t } = useTranslation();
  return (
    <Panel label={t("assembly.title")} className="row-span-2 gap-3 p-4">
      <PanelHeader title={t("assembly.title")} />
      <EmptyState>{t("assembly.empty")}</EmptyState>
    </Panel>
  );
}

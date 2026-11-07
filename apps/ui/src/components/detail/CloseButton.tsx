import { useTranslation } from "react-i18next";
import { useUi } from "../../store/uiStore";

/** Cruz que cierra el panel de detalle. */
export function CloseButton() {
  const { t } = useTranslation();
  const select = useUi((s) => s.select);
  return (
    <button
      type="button"
      aria-label={t("settings.close")}
      onClick={() => select(null)}
      className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-md border border-line bg-transparent text-tx2"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </button>
  );
}

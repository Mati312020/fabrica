import { useTranslation } from "react-i18next";
import { PREVIEW_WIDTHS, type PreviewWidth } from "../../hooks/usePreviewReview";

/** Props de {@link WidthSwitch}. */
interface WidthSwitchProps {
  value: PreviewWidth;
  onChange(width: PreviewWidth): void;
}

/** Selector de ancho de la vista previa: escritorio o móvil. */
export function WidthSwitch({ value, onChange }: WidthSwitchProps) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t("preview.width")} className="flex gap-1.5">
      {(Object.keys(PREVIEW_WIDTHS) as PreviewWidth[]).map((w) => (
        <button key={w} type="button" aria-pressed={value === w} className={value === w ? "btn tg on" : "btn"} onClick={() => onChange(w)}>
          {t(`preview.${w}`)} · {PREVIEW_WIDTHS[w]}
        </button>
      ))}
    </div>
  );
}

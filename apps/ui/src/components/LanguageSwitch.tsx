import { useTranslation } from "react-i18next";
import { usePrefs } from "../store/prefsStore";
import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
] as const;

/** Selector de idioma: ES / EN. */
export function LanguageSwitch() {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  return <SegmentedControl label={t("topbar.language")} options={OPTIONS} value={lang} onChange={setLang} />;
}

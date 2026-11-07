import { useTranslation } from "react-i18next";
import { THEMES } from "../lib/prefs";
import { usePrefs } from "../store/prefsStore";
import { SegmentedControl } from "./SegmentedControl";

/** Selector de tema: Oscuro / Claro / Sistema. */
export function ThemeSwitch() {
  const { t } = useTranslation();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const options = THEMES.map((value) => ({ value, label: t(`theme.${value}`) }));
  return <SegmentedControl label={t("topbar.theme")} options={options} value={theme} onChange={setTheme} />;
}

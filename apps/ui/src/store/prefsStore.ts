import { create } from "zustand";
import i18n, { LANG_KEY } from "../i18n";
import { LANGS, THEMES, readPref, writePref, type Lang, type ThemePref } from "../lib/prefs";
import { applyTheme } from "../lib/theme";

const THEME_KEY = "fabrica.theme";

interface PrefsStore {
  theme: ThemePref;
  lang: Lang;
  setTheme(theme: ThemePref): void;
  setLang(lang: Lang): void;
}

/** Preferencias de la persona (no son estado de dominio). */
export const usePrefs = create<PrefsStore>((set) => ({
  theme: readPref(THEME_KEY, THEMES, "oscuro"),
  lang: readPref(LANG_KEY, LANGS, "es"),
  setTheme(theme) {
    writePref(THEME_KEY, theme);
    applyTheme(theme, true);
    set({ theme });
  },
  setLang(lang) {
    writePref(LANG_KEY, lang);
    document.documentElement.lang = lang;
    void i18n.changeLanguage(lang);
    set({ lang });
  },
}));

/** Aplica el tema inicial y sigue a prefers-color-scheme cuando el tema es "sistema". */
export function initPrefs(): void {
  applyTheme(usePrefs.getState().theme, false);
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const { theme } = usePrefs.getState();
    if (theme === "sistema") applyTheme(theme, true);
  });
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGS, readPref } from "../lib/prefs";
import { en } from "./en";
import { es } from "./es";

/** Clave de localStorage del idioma. */
export const LANG_KEY = "alfa.lang";

const lng = readPref(LANG_KEY, LANGS, "es");
document.documentElement.lang = lng;

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng,
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

export default i18n;

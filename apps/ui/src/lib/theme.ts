import type { ThemePref } from "./prefs";

const FADE_MS = 200;

/**
 * Resuelve "sistema" según prefers-color-scheme.
 * @param pref Preferencia elegida.
 */
export function resolveTheme(pref: ThemePref): "oscuro" | "claro" {
  if (pref !== "sistema") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro";
}

/**
 * Aplica el tema al documento. Con `animate` hace el fundido de 180 ms (gramática 12).
 * @param pref Preferencia elegida.
 * @param animate Si es false (primer render) no hay transición.
 */
export function applyTheme(pref: ThemePref, animate: boolean): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), FADE_MS);
  }
  root.dataset["theme"] = resolveTheme(pref);
}

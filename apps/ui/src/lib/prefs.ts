/** Preferencias válidas de tema. */
export const THEMES = ["oscuro", "claro", "sistema"] as const;
/** Idiomas disponibles. */
export const LANGS = ["es", "en"] as const;

/** Tema elegido por el usuario. */
export type ThemePref = (typeof THEMES)[number];
/** Idioma de la interfaz. */
export type Lang = (typeof LANGS)[number];

/**
 * Lee una preferencia de localStorage y valida que sea una opción conocida.
 * @param key Clave de almacenamiento.
 * @param allowed Valores aceptados.
 * @param fallback Valor si no hay nada guardado o localStorage no está disponible.
 */
export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.find((option) => option === value) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Guarda una preferencia; si localStorage falla, la preferencia vale solo para la sesión.
 * @param key Clave de almacenamiento.
 * @param value Valor a guardar.
 */
export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue sin persistir.
  }
}

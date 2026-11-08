/** Códigos de `engine.error` con mensaje guiado en la interfaz. */
export const GUIDED_CODES = ["no_browser", "browser_failed", "git_failed"] as const;
export type GuidedCode = (typeof GUIDED_CODES)[number];

/**
 * Indica si un código de error tiene mensaje guiado.
 * @param code Código del `engine.error`.
 */
export function isGuided(code: string): code is GuidedCode {
  return (GUIDED_CODES as readonly string[]).includes(code);
}

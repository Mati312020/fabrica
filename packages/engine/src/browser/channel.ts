/**
 * Canal de navegador para Playwright. En Windows se usa el Edge del sistema (sin descargas); en
 * Linux (servidor/NAS) el Chromium que instala Playwright en la imagen, salvo que
 * `FABRICA_BROWSER_CHANNEL` diga otra cosa.
 * @param env Variables de entorno.
 * @param platform Plataforma del proceso.
 * @returns El canal, o `undefined` para el Chromium propio de Playwright.
 */
export function browserChannel(
  env: Record<string, string | undefined> = process.env,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  const chosen = env["FABRICA_BROWSER_CHANNEL"]?.trim();
  if (chosen === "chromium") return undefined;
  if (chosen) return chosen;
  return platform === "win32" ? "msedge" : undefined;
}

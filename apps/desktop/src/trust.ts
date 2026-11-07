import { fileURLToPath } from "node:url";
import path from "node:path";

/** URL del dev server de la UI; solo existe en desarrollo. */
export const devUiUrl = process.env["ALFA_UI_URL"];

/** Carpeta del build de la UI que carga la app empaquetada. */
export const uiDistDir = path.join(__dirname, "../../ui/dist");

/**
 * Decide si una URL es la propia UI de Alfa (dev server o archivos del build).
 * Se usa para IPC y navegación: cualquier otra página no recibe nada.
 * @param url URL del frame que invoca o navega.
 */
export function isTrustedUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (devUiUrl) return parsed.origin === new URL(devUiUrl).origin;
    if (parsed.protocol !== "file:") return false;
    return path.resolve(fileURLToPath(parsed)).startsWith(path.resolve(uiDistDir));
  } catch {
    return false;
  }
}

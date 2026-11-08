import { statSync } from "node:fs";
import path from "node:path";

/**
 * Carpeta que se sirve: `dist/` si existe y tiene `index.html`; si no, la carpeta del proyecto.
 * @param dir Carpeta del proyecto.
 */
export function siteRoot(dir: string): string {
  const dist = path.join(dir, "dist");
  try {
    return statSync(path.join(dist, "index.html")).isFile() ? dist : dir;
  } catch {
    return dir;
  }
}

/**
 * Traduce la ruta de un request a una ruta de archivo dentro de `root`, o null si es peligrosa:
 * `..` (también codificado), barras invertidas, bytes nulos, dotfiles (`.git`, `.env`, `.fabrica`)
 * o cualquier cosa que termine fuera de la carpeta.
 * @param root Carpeta servida.
 * @param rawUrl URL del request (con query y hash opcionales).
 */
export function resolveSafe(root: string, rawUrl: string): string | null {
  const pathname = rawUrl.split(/[?#]/, 1)[0] ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.includes("\\") || decoded.includes("\0")) return null;
  const parts = decoded.split("/").filter((p) => p !== "");
  if (parts.some((p) => p.startsWith(".") || p.includes(":"))) return null;
  const base = path.resolve(root);
  const full = path.resolve(base, ...parts);
  const rel = path.relative(base, full);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) return null;
  return full;
}

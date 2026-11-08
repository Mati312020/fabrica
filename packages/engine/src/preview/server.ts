import { createReadStream, promises as fs } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { isInside } from "../workspace/confine.js";
import { resolveSafe, siteRoot } from "./safePath.js";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".woff": "font/woff", ".woff2": "font/woff2", ".map": "application/json",
};

/** Servidor de vista previa en marcha. */
export interface PreviewServer {
  /** URL raíz, `http://127.0.0.1:<puerto>/`. */
  url: string;
  close(): Promise<void>;
}

async function pickFile(root: string, rawUrl: string): Promise<string | null> {
  const safe = resolveSafe(root, rawUrl);
  if (!safe) return null;
  try {
    const real = await fs.realpath(safe);
    if (!isInside(await fs.realpath(root), real)) return null;
    const stat = await fs.stat(real);
    if (stat.isFile()) return real;
    if (!stat.isDirectory()) return null;
    const index = path.join(real, "index.html");
    return (await fs.stat(index)).isFile() ? index : null;
  } catch {
    return null;
  }
}

function end(res: http.ServerResponse, status: number): void {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
  res.end(status === 404 ? "No encontrado" : "No permitido");
}

/**
 * Sirve una carpeta (o su `dist/`) en 127.0.0.1 y un puerto aleatorio. Solo lectura, sin listado de
 * directorios, sin dotfiles y sin salir de la carpeta. Rechaza `Host` ajenos (DNS rebinding).
 * @param dir Carpeta del proyecto.
 */
export async function startPreviewServer(dir: string): Promise<PreviewServer> {
  let port = 0;
  const server = http.createServer((req, res) => {
    const host = req.headers.host ?? "";
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return end(res, 403);
    if (req.method !== "GET" && req.method !== "HEAD") return end(res, 405);
    void pickFile(siteRoot(dir), req.url ?? "/").then((file) => {
      if (!file) return end(res, 404);
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store",
      });
      if (req.method === "HEAD") return void res.end();
      createReadStream(file).on("error", () => res.destroy()).pipe(res);
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }),
  };
}

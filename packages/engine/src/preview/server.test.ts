import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveSafe, siteRoot } from "./safePath.js";
import { startPreviewServer, type PreviewServer } from "./server.js";

let dir: string;
let server: PreviewServer;
beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "fabrica-prev-"));
  writeFileSync(path.join(dir, "index.html"), "<h1>hola</h1>");
  writeFileSync(path.join(dir, "app.js"), "1");
  writeFileSync(path.join(dir, ".env"), "SECRETO=1");
  mkdirSync(path.join(dir, ".git"));
  writeFileSync(path.join(dir, ".git", "config"), "x");
  mkdirSync(path.join(dir, ".fabrica"));
  writeFileSync(path.join(dir, ".fabrica", "a.png"), "x");
  server = await startPreviewServer(dir);
});
afterAll(async () => {
  await server.close();
  rmSync(dir, { recursive: true, force: true });
});

/** Request crudo: `fetch` normalizaría `..` antes de enviarlo. */
function raw(rawPath: string, host?: string): Promise<{ status: number; body: string }> {
  const u = new URL(server.url);
  return new Promise((resolve, reject) => {
    const headers = host ? { Host: host } : {};
    http.get({ host: u.hostname, port: u.port, path: rawPath, headers }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

describe("resolveSafe", () => {
  const root = path.resolve("/proy");
  it("resuelve rutas normales dentro de la carpeta", () => {
    expect(resolveSafe(root, "/a/b.js?x=1")).toBe(path.join(root, "a", "b.js"));
    expect(resolveSafe(root, "/")).toBe(root);
  });
  it.each(["/../x", "/a/../../x", "/%2e%2e/x", "/%2E%2E%2Fx", "/a%5C..%5Cx", "/a\\b", "/.env", "/.git/config",
    "/a/.fabrica/x", "/%2eenv", "/x%00.js", "/%zz", "/C:/Windows/win.ini", "x"])("rechaza %s", (p) => {
    expect(resolveSafe(root, p)).toBeNull();
  });
});

describe("servidor de vista previa", () => {
  it("escucha solo en 127.0.0.1 y sirve index.html con su tipo", async () => {
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    const r = await fetch(server.url);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(await r.text()).toContain("hola");
  });
  it.each(["/.env", "/.git/config", "/.fabrica/a.png", "/%2e%2e/x", "/%2e%2e%2f%2e%2e%2fwindows", "/..%5c..%5cx",
    "/a%5Cb", "/../../etc/passwd", "/nada.js"])("responde 404 a %s", async (p) => {
    const r = await raw(p);
    expect(r.status).toBe(404);
    expect(r.body).not.toContain("SECRETO");
  });
  it("no lista directorios y solo acepta GET/HEAD", async () => {
    expect((await raw("/.fabrica/")).status).toBe(404);
    const post = await fetch(server.url, { method: "POST" });
    expect(post.status).toBe(405);
  });
  it("rechaza un Host ajeno", async () => {
    expect((await raw("/", "evil.test")).status).toBe(403);
  });
  it("prefiere dist/ si tiene index.html", async () => {
    mkdirSync(path.join(dir, "dist"));
    expect(siteRoot(dir)).toBe(dir);
    writeFileSync(path.join(dir, "dist", "index.html"), "<h1>build</h1>");
    expect(siteRoot(dir)).toBe(path.join(dir, "dist"));
    expect(await (await fetch(server.url)).text()).toContain("build");
    expect((await raw("/app.js")).status).toBe(404);
  });
});

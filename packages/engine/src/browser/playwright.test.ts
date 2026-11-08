import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startPreviewServer, type PreviewServer } from "../preview/server.js";
import { playwrightRunner } from "./playwright.js";

const PAGE = `<!doctype html><html><body>
<h1>Tienda</h1><input id="nombre" /><button id="enviar">Enviar</button><p id="ok"></p>
<button id="roto">Roto</button>
<script>
document.getElementById('enviar').onclick = () => {
  document.getElementById('ok').textContent = 'Hola ' + document.getElementById('nombre').value;
};
document.getElementById('roto').onclick = () => { console.error('boom de consola'); fetch('/api/faltante.json'); };
</script></body></html>`;

/** Edge puede no existir o no arrancar en el entorno de test: en ese caso se salta con aviso. */
async function edgeWorks(): Promise<boolean> {
  try {
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({ channel: "msedge", headless: true, timeout: 20_000 });
    await browser.close();
    return true;
  } catch {
    console.warn("[aviso] Edge no arrancó en este entorno: se salta el test del ejecutor de recorridos.");
    return false;
  }
}

const hasEdge = await edgeWorks();
let dir: string;
let server: PreviewServer;
beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "fabrica-fixture-"));
  writeFileSync(path.join(dir, "index.html"), PAGE);
  server = await startPreviewServer(dir);
});
afterAll(async () => {
  await server.close();
  rmSync(dir, { recursive: true, force: true });
});

describe.skipIf(!hasEdge)("ejecutor de recorridos (Edge real)", () => {
  it("recorre la página en dos anchos y junta errores, requests fallidos, pasos fallidos y capturas", async () => {
    const outDir = path.join(dir, ".fabrica", "capturas");
    const seen: string[] = [];
    const report = await playwrightRunner.run({
      baseUrl: server.url, outDir, prefix: "t1", stepTimeoutMs: 1500, onStep: (d) => seen.push(d),
      recorrido: [
        { accion: "ir", valor: "/" },
        { accion: "escribir", selector: "#nombre", valor: "Ana" },
        { accion: "click", selector: "#enviar" },
        { accion: "verificarTexto", selector: "#ok", valor: "Hola Ana" },
        { accion: "click", selector: "#roto" },
        { accion: "esperar", valor: "300" },
        { accion: "click", selector: "#no-existe" },
        { accion: "ir", valor: "http://example.com/" },
      ],
    });
    expect(seen).toHaveLength(16);
    expect(seen[2]).toBe("paso 3/8 · click #enviar (1280px)");
    expect(report.capturas).toHaveLength(16);
    expect(report.capturas.every((c) => existsSync(c))).toBe(true);
    expect(report.capturas.some((c) => c.endsWith("t1-390-paso3.png"))).toBe(true);
    expect(report.errores.some((e) => e.includes("boom de consola"))).toBe(true);
    expect(report.fallidos.some((f) => f.includes("404") && f.includes("/api/faltante.json"))).toBe(true);
    expect(report.pasosFallidos.filter((p) => p.includes("#no-existe"))).toHaveLength(2);
    expect(report.pasosFallidos.some((p) => p.includes("fuera de la vista previa"))).toBe(true);
    expect(report.pasosFallidos.some((p) => p.includes("#enviar") || p.includes("Hola Ana"))).toBe(false);
  }, 90_000);

});

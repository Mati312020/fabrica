import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NoBrowserError, type BrowserReport, type BrowserRunner } from "../browser/types.js";
import { auditOk, blk, codeVisual, inOrder, orch, planOf, until, walk } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
let dir: string;
beforeEach(() => void (dir = mkdtempSync(path.join(os.tmpdir(), "fabrica-eng-"))));
afterEach(() => {
  h.close();
  rmSync(dir, { recursive: true, force: true });
});

const report = (): BrowserReport => ({
  errores: ["[1280px] boom"], fallidos: ["[1280px] 404 http://127.0.0.1/x.js"], pasosFallidos: ["[390px] paso 2/2 · click #enviar: no existe"],
  capturas: [path.join(dir, ".fabrica", "capturas", "blk-V-1-1280-paso1.png"), path.join(dir, ".fabrica", "capturas", "blk-V-1-390-paso1.png")],
});

async function visual(runner: BrowserRunner, coding = codeVisual): Promise<void> {
  h = makeHarness({
    orquestador: () => orch({ pedirPlan: true }), planificacion: () => planOf(blk("V", [], "visual")),
    codificacion: coding, auditoria: auditOk,
  }, { workspace: dir, browser: runner });
  h.send("chat.send", { texto: "web" });
  h.send("plan.approve", { planId: (await h.waitFor("plan.ready")).data.planId });
}

describe("bloque visual: recorrido en el navegador", () => {
  it("corre el recorrido tras la auditoría de código, emite el informe y audita con él", async () => {
    const seen: unknown[] = [];
    await visual({ run: async (req) => { seen.push(req); req.onStep?.("paso 1/2 · ir /"); return report(); } });
    await h.waitFor("block.approvalRequested");
    const req = seen[0] as { baseUrl: string; recorrido: unknown; outDir: string };
    expect(req.recorrido).toEqual(walk);
    expect(req.outDir).toBe(path.join(dir, ".fabrica", "capturas"));
    expect(h.of("audit.browserReport")[0]).toMatchObject({ errores: ["[1280px] boom"], capturas: expect.any(Array) });
    expect(h.of("agent.tool").some((t) => t.herramienta === "navegador" && t.detalle.startsWith("paso 1/2"))).toBe(true);
    expect(inOrder(h.types(), ["audit.result", "audit.browserReport", "audit.result", "block.approvalRequested"])).toBe(true);
    const audits = h.provider.calls.filter((c) => c.role === "auditoria");
    expect(audits).toHaveLength(3); // plan + código + código con el informe
    expect(audits[2]?.prompt).toContain("boom");
    expect(audits[2]?.tools).toContain("Read");
    expect(h.of("block.approvalRequested")[0]?.previewUrl).toBe(req.baseUrl);
  });

  it("el rechazo con marcas llega al agente con las capturas", async () => {
    await visual({ run: async () => report() });
    await h.waitFor("block.approvalRequested");
    h.send("block.reject", { blockId: "V", comentario: "el botón está feo", marcas: [{ x: 42.5, y: 17, texto: "más grande" }] });
    await until(() => h.provider.count("codificacion") === 2);
    const prompt = h.provider.calls.filter((c) => c.role === "codificacion")[1]?.prompt ?? "";
    expect(prompt).toContain("el botón está feo");
    expect(prompt).toContain("Marca 1 (x 42.5%, y 17%): más grande");
    expect(prompt).toContain("blk-V-1-390-paso1.png");
  });

  it("rechazo sin marcas: solo el comentario", async () => {
    await visual({ run: async () => report() });
    await h.waitFor("block.approvalRequested");
    h.send("block.reject", { blockId: "V", comentario: "no me gusta" });
    await until(() => h.provider.count("codificacion") === 2);
    const prompt = h.provider.calls.filter((c) => c.role === "codificacion")[1]?.prompt ?? "";
    expect(prompt).toContain("no me gusta");
    expect(prompt).not.toContain("Marca 1");
  });

  it("sin Edge: engine.error no_browser y el bloque sigue con la auditoría de código", async () => {
    await visual({ run: async () => { throw new NoBrowserError("sin edge"); } });
    await h.waitFor("block.approvalRequested");
    expect(h.of("engine.error").map((e) => e.code)).toContain("no_browser");
    expect(h.of("audit.browserReport")).toHaveLength(0);
    expect(h.provider.count("auditoria")).toBe(2); // plan + código
  });

  it("si el informe hace rechazar al auditor, el bloque se reintenta", async () => {
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }), planificacion: () => planOf(blk("V", [], "visual")),
      codificacion: codeVisual,
      auditoria: (_r, call) => (call === 2 ? { output: { ok: false, motivo: "consola con errores", sugerencia: "" } } : { output: { ok: true, motivo: "ok", sugerencia: "" } }),
    }, { workspace: dir, browser: { run: async () => report() } });
    h.send("chat.send", { texto: "web" });
    h.send("plan.approve", { planId: (await h.waitFor("plan.ready")).data.planId });
    await h.waitFor("block.approvalRequested");
    expect(h.provider.count("codificacion")).toBe(2);
    expect(h.provider.calls.filter((c) => c.role === "codificacion")[1]?.prompt).toContain("consola con errores");
  });
});

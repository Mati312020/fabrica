import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { auditOk, blk, ok, orch, planOf } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";
import { ensureFabricaIgnored } from "./commit.js";

let h: Harness;
let dir: string;
const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
beforeEach(() => void (dir = mkdtempSync(path.join(os.tmpdir(), "fabrica-git-"))));
afterEach(() => {
  h.close();
  rmSync(dir, { recursive: true, force: true });
});

function initRepo(): void {
  git("init", "-q");
  git("config", "user.email", "t@test.local");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  writeFileSync(path.join(dir, "base.txt"), "base");
  git("add", "base.txt");
  git("commit", "-q", "-m", "inicial");
}

/** Plan de un bloque técnico cuyo agente escribe `a.ts` y además deja un archivo ajeno sin commitear. */
async function runPlan(): Promise<void> {
  h = makeHarness({
    orquestador: () => orch({ pedirPlan: true }), planificacion: () => planOf(blk("A")),
    codificacion: () => {
      writeFileSync(path.join(dir, "a.ts"), "export {};");
      writeFileSync(path.join(dir, "ajeno.txt"), "no es del bloque");
      return ok({ resumen: "hecho\ncon dos líneas", archivos: ["a.ts"] });
    },
    auditoria: auditOk,
  }, { workspace: dir, commitPerBlock: null });
  h.send("chat.send", { texto: "hacé A" });
  h.send("plan.approve", { planId: (await h.waitFor("plan.ready")).data.planId });
  await h.waitFor("block.assembled");
}

describe("git por bloque", () => {
  it("en un repo existente commitea solo los archivos del bloque y no hace push", async () => {
    initRepo();
    await runPlan();
    const committed = await h.waitFor("block.committed");
    expect(committed.data.blockId).toBe("A");
    expect(git("log", "-1", "--format=%s")).toBe("Bloque Bloque A: hecho con dos líneas");
    expect(git("rev-parse", "--short", "HEAD")).toContain(committed.data.hash.slice(0, 7));
    expect(git("show", "--name-only", "--format=", "HEAD")).toBe("a.ts");
    expect(git("status", "--porcelain")).toContain("ajeno.txt");
    expect(readFileSync(path.join(dir, ".gitignore"), "utf8")).toContain(".fabrica/");
    expect(git("remote")).toBe("");
  });

  it("con la opción apagada no commitea", async () => {
    initRepo();
    await runPlanOff();
    expect(h.of("block.committed")).toHaveLength(0);
    expect(git("rev-list", "--count", "HEAD")).toBe("1");
    expect(h.of("engine.status").at(-1)).toMatchObject({ commitPerBlock: false, gitRepo: true });
  });

  it("carpeta sin repo: apagado por defecto y activarlo avisa git_failed", async () => {
    h = makeHarness({}, { workspace: dir, commitPerBlock: null });
    h.send("project.setCommitPerBlock", { enabled: true });
    expect(h.of("engine.error")[0]).toMatchObject({ code: "git_failed" });
    expect(h.of("engine.status").at(-1)).toMatchObject({ commitPerBlock: false, gitRepo: false });
  });

  it("repo existente: el estado arranca activado y se puede apagar y volver a activar", () => {
    initRepo();
    h = makeHarness({}, { workspace: dir });
    h.send("project.setCommitPerBlock", { enabled: false });
    h.send("project.setCommitPerBlock", { enabled: true });
    expect(h.of("engine.status").map((s) => s.commitPerBlock)).toEqual([false, true]);
  });

  it("ensureFabricaIgnored agrega la línea una sola vez, respetando lo que ya había", () => {
    writeFileSync(path.join(dir, ".gitignore"), "node_modules");
    ensureFabricaIgnored(dir);
    ensureFabricaIgnored(dir);
    expect(readFileSync(path.join(dir, ".gitignore"), "utf8")).toBe("node_modules\n.fabrica/\n");
    h = makeHarness({}, { workspace: dir });
  });
});

/** Igual que `runPlan`, pero con la opción apagada antes de empezar. */
async function runPlanOff(): Promise<void> {
  h = makeHarness({
    orquestador: () => orch({ pedirPlan: true }), planificacion: () => planOf(blk("A")),
    codificacion: () => {
      writeFileSync(path.join(dir, "a.ts"), "export {};");
      return ok({ resumen: "hecho", archivos: ["a.ts"] });
    },
    auditoria: auditOk,
  }, { workspace: dir });
  h.send("project.setCommitPerBlock", { enabled: false });
  h.send("chat.send", { texto: "hacé A" });
  h.send("plan.approve", { planId: (await h.waitFor("plan.ready")).data.planId });
  await h.waitFor("block.assembled");
  await new Promise((r) => setTimeout(r, 300));
}

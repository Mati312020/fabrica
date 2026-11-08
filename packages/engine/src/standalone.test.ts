import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "standalone.ts");

function run(args: string[], env: Record<string, string> = {}) {
  const base = { PATH: process.env["PATH"] ?? "", SystemRoot: process.env["SystemRoot"] ?? "", APPDATA: process.env["APPDATA"] ?? "" };
  return spawnSync(process.execPath, ["--import", "tsx", script, ...args], { env: { ...base, ...env }, encoding: "utf8", timeout: 30_000 });
}

describe("arranque del standalone", () => {
  it("no arranca con host público sin TLS ni --behind-proxy", () => {
    const r = run(["--host", "0.0.0.0"], { FABRICA_TOKEN: "k".repeat(32) });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("no es loopback");
  });

  it("no arranca con un token corto", () => {
    const r = run([], { FABRICA_TOKEN: "corto" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("32 bytes");
  });
});

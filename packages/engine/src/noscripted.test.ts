import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

describe("aislamiento de testing/", () => {
  it("ningún archivo de la app importa src/testing", () => {
    const app = files(SRC).filter((f) => f.endsWith(".ts") && !f.includes(`${path.sep}testing${path.sep}`) && !f.endsWith(".test.ts"));
    expect(app.length).toBeGreaterThan(10);
    const offenders = app.filter((f) => /from\s+["'][^"']*testing\//.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

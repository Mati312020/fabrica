import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryStore, isInside } from "./store.js";

describe("ubicación de la base", () => {
  it("isInside distingue la carpeta del proyecto", () => {
    expect(isInside("/p/app", "/p/app/memory.db")).toBe(true);
    expect(isInside("/p/app", "/p/app")).toBe(true);
    expect(isInside("/p/app", "/p/app2/memory.db")).toBe(false);
    expect(isInside("/p/app", "/p/memory.db")).toBe(false);
  });

  it("rechaza abrir la base dentro de la carpeta del proyecto", () => {
    const work = mkdtempSync(path.join(os.tmpdir(), "fabrica-ws-"));
    const data = mkdtempSync(path.join(os.tmpdir(), "fabrica-data-"));
    const store = createMemoryStore();
    try {
      expect(store.open(path.join(work, "memory.db"), work)).toBe("inside_workspace");
      expect(store.repo()).toBeNull();
      expect(store.open(path.join(data, "memory.db"), work)).toBeNull();
      expect(store.insideWorkspace(work)).toBe(false);
      expect(store.insideWorkspace(data)).toBe(true);
    } finally {
      store.close();
      rmSync(work, { recursive: true, force: true });
      rmSync(data, { recursive: true, force: true });
    }
  });
});

import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, migrate, openDatabase } from "./db.js";
import { createMemoryRepo, type MemoryRepo } from "./repo.js";
import type { MemoryInput } from "./types.js";

const input = (over: Partial<MemoryInput> = {}): MemoryInput => ({
  titulo: "Norma ISO para madera", contenido: "Usar ISO 13910 al clasificar estructuras de madera.",
  etiquetas: ["iso", "madera"], proyecto: "casa", agente: "investigacion-1", tarea: "inv-1", ...over,
});

const open = (): MemoryRepo => createMemoryRepo(openDatabase(":memory:"));

describe("repositorio de memoria", () => {
  it("guarda y lee un recuerdo con su origen", () => {
    const repo = open();
    const { id, created } = repo.save(input());
    expect(created).toBe(true);
    expect(repo.get(id)).toMatchObject({
      titulo: "Norma ISO para madera", etiquetas: ["iso", "madera"], proyecto: "casa", agente: "investigacion-1", tarea: "inv-1",
    });
    expect(repo.get("no-existe")).toBeNull();
    expect(repo.count()).toBe(1);
  });

  it("lista los más recientes primero", async () => {
    const repo = open();
    repo.save(input({ titulo: "Primero" }));
    await new Promise((r) => setTimeout(r, 5));
    repo.save(input({ titulo: "Segundo" }));
    expect(repo.list().map((m) => m.titulo)).toEqual(["Segundo", "Primero"]);
    expect(repo.list(1)).toHaveLength(1);
  });

  it("busca por texto completo, con acentos y prefijos", () => {
    const repo = open();
    repo.save(input());
    repo.save(input({ titulo: "Preferencia de estilo", contenido: "El usuario prefiere árboles de decisión simples.", etiquetas: ["estilo"] }));
    expect(repo.search("estructuras de madera", 5).map((m) => m.titulo)).toEqual(["Norma ISO para madera"]);
    expect(repo.search("arbol decision", 5).map((m) => m.titulo)).toEqual(["Preferencia de estilo"]);
    expect(repo.search("nada relacionado xyzzy", 5)).toEqual([]);
    expect(repo.search("madera", 0)).toEqual([]);
  });

  it("el texto de búsqueda nunca se interpreta como SQL ni como sintaxis FTS", () => {
    const repo = open();
    repo.save(input());
    expect(() => repo.search('"; DROP TABLE recuerdos; -- NEAR( AND * "', 5)).not.toThrow();
    expect(repo.count()).toBe(1);
  });

  it("el mismo título (sin mayúsculas) actualiza en vez de duplicar", () => {
    const repo = open();
    const first = repo.save(input());
    const again = repo.save(input({ titulo: "NORMA iso PARA madera", contenido: "Ahora vale ISO 20000 para pisos.", etiquetas: ["pisos"] }));
    expect(again).toEqual({ id: first.id, created: false });
    expect(repo.count()).toBe(1);
    expect(repo.get(first.id)).toMatchObject({ contenido: "Ahora vale ISO 20000 para pisos.", etiquetas: ["pisos"] });
    expect(repo.search("pisos", 5)).toHaveLength(1);
    expect(repo.search("clasificar", 5)).toHaveLength(0);
  });

  it("borra el recuerdo y su entrada de búsqueda", () => {
    const repo = open();
    const { id } = repo.save(input());
    expect(repo.remove(id)?.titulo).toBe("Norma ISO para madera");
    expect(repo.remove(id)).toBeNull();
    expect(repo.get(id)).toBeNull();
    expect(repo.search("madera", 5)).toEqual([]);
    expect(repo.count()).toBe(0);
  });
});

describe("migración", () => {
  it("es idempotente y conserva los datos al reabrir el archivo", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "fabrica-mem-"));
    const file = path.join(dir, "sub", "memory.db");
    try {
      const db = openDatabase(file);
      migrate(db);
      migrate(db);
      const version = db.prepare("PRAGMA user_version").get() as { user_version: number };
      expect(version.user_version).toBe(SCHEMA_VERSION);
      const { id } = createMemoryRepo(db).save(input());
      db.close();
      const again = openDatabase(file);
      expect(createMemoryRepo(again).get(id)?.titulo).toBe("Norma ISO para madera");
      expect(createMemoryRepo(again).search("madera", 5)).toHaveLength(1);
      again.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

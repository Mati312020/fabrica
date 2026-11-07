import { describe, expect, it } from "vitest";
import { filterMemories } from "../lib/memoryFilter";
import { ev, fold } from "./fixtures";

const item = (id: string, titulo: string, etiquetas: string[] = []) => ({
  id, titulo, etiquetas, proyecto: "casa", actualizado: "2026-11-07T12:00:00.000Z",
});
const content = (id: string, titulo: string) => ({
  ...item(id, titulo, ["iso"]), contenido: "texto", agente: "inv-1", tarea: "t1", creado: "2026-11-07T11:00:00.000Z",
});

describe("applyEvent · memoria", () => {
  it("memory.snapshot reemplaza el listado y el conteo", () => {
    const state = fold([ev("memory.snapshot", { items: [item("a", "Uno"), item("b", "Dos")] })]);
    expect(state.memory.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(state.memory.count).toBe(2);
    expect(state.log.at(-1)?.type).toBe("memory.snapshot");
  });

  it("memory.saved sube el contador, deja línea en el registro y marca la animación", () => {
    const state = fold([ev("engine.status", { apiKeyConfigured: true, paused: false, workspace: null, budgetLimit: 5, memoryCount: 4 }), ev("memory.saved", { id: "a", titulo: "Uno" })]);
    expect(state.memory.count).toBe(5);
    expect(state.memory.savedSeq).toBe(state.seq);
    expect(state.log.at(-1)).toMatchObject({ type: "memory.saved" });
    expect(state.log.at(-1)?.summary).toContain("Uno");
  });

  it("memory.deleted quita el recuerdo, baja el contador y cierra el abierto", () => {
    const before = fold([ev("memory.snapshot", { items: [item("a", "Uno"), item("b", "Dos")] }), ev("memory.content", content("a", "Uno"))]);
    expect(before.memory.content?.titulo).toBe("Uno");
    const state = fold([ev("memory.deleted", { id: "a", titulo: "Uno" })], before);
    expect(state.memory.items.map((i) => i.id)).toEqual(["b"]);
    expect(state.memory.count).toBe(1);
    expect(state.memory.content).toBeNull();
  });

  it("memory.content guarda el recuerdo abierto y engine.status trae el conteo", () => {
    const state = fold([ev("memory.content", content("a", "Uno")), ev("engine.status", { apiKeyConfigured: false, paused: false, workspace: null, budgetLimit: 5, memoryCount: 9 })]);
    expect(state.memory.content).toMatchObject({ id: "a", contenido: "texto", agente: "inv-1" });
    expect(state.memory.count).toBe(9);
  });

  it("el filtro local busca en título, etiquetas y proyecto sin distinguir mayúsculas", () => {
    const items = [item("a", "Reloj simulado", ["tests"]), item("b", "Norma ISO", ["madera"])];
    expect(filterMemories(items, "")).toHaveLength(2);
    expect(filterMemories(items, "RELOJ").map((i) => i.id)).toEqual(["a"]);
    expect(filterMemories(items, "madera").map((i) => i.id)).toEqual(["b"]);
    expect(filterMemories(items, "casa")).toHaveLength(2);
    expect(filterMemories(items, "zzz")).toEqual([]);
  });
});

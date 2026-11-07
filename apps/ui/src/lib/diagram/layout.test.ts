import { describe, expect, it } from "vitest";
import { busRoute, busSegments, layoutDiagram, type ColumnInput } from "./layout";

const three: ColumnInput[] = [
  { id: "plan", agents: ["plan-1", "plan-2"] },
  { id: "code", agents: ["code-1", "code-2", "code-3"] },
  { id: "inv", agents: ["inv-1"] },
];

describe("layoutDiagram", () => {
  const layout = layoutDiagram(three);

  it("reproduce las medidas del tablero 01 con tres ramas", () => {
    expect(Object.values(layout.columns).map((c) => c.x)).toEqual([40, 393, 746]);
    expect(layout.center).toBe(538);
    expect(layout.orch).toEqual({ x: 413, y: 16 });
    expect(layout.chat).toEqual({ x: 132, y: 26 });
    expect(layout.agents["code-2"]).toEqual({ x: 415, y: 228 });
    expect(layout.auditY).toBe(392);
    expect(layout.memoria).toEqual({ x: 308, y: 412 });
    expect(layout.joins["code"]).toEqual({ x: 403, y: 392 });
  });

  it("es determinista: mismas ramas, mismo resultado", () => {
    expect(layoutDiagram(three)).toEqual(layout);
    expect(layoutDiagram(structuredClone(three))).toEqual(layout);
  });

  it("apila los agentes en su columna y crece la línea de auditoría con la más alta", () => {
    const tall = layoutDiagram([{ id: "a", agents: ["1", "2", "3", "4", "5"] }]);
    expect(tall.agents["5"]).toEqual({ x: 62, y: 156 + 4 * 72 });
    expect(tall.auditY).toBe(156 + 5 * 72 + 20);
  });

  it("sin ramas deja una columna central vacía y sigue siendo válido", () => {
    const empty = layoutDiagram([]);
    expect(empty.center).toBe(185);
    expect(empty.auditY).toBe(156 + 2 * 72 + 20);
  });

  it("la línea de auditoría va ordenada por x y cada rama llega al centro", () => {
    expect(busSegments(layout).map((s) => s.id)).toEqual([
      "bus:join:plan>join:code",
      "bus:join:code>join:mid",
      "bus:join:mid>join:inv",
    ]);
    expect(busRoute(layout, "plan")).toEqual(["bus:join:plan>join:code", "bus:join:code>join:mid"]);
    expect(busRoute(layout, "inv")).toEqual(["bus:join:mid>join:inv"]);
    expect(busRoute(layout, "nope")).toEqual([]);
  });
});

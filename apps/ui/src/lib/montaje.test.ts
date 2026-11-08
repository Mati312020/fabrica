import { describe, expect, it } from "vitest";
import { blockLevels, isoBounds, isoFaces, ISO, layoutMontaje } from "./montaje";

const blocks = [
  { id: "ui", dependeDe: ["api", "db"] },
  { id: "db", dependeDe: [] },
  { id: "api", dependeDe: ["db"] },
  { id: "docs", dependeDe: [] },
];

describe("montaje", () => {
  it("nivel = 1 + máximo nivel de sus dependencias", () => {
    expect(blockLevels(blocks)).toEqual({ db: 1, api: 2, ui: 3, docs: 1 });
  });
  it("un ciclo y una dependencia ausente no cuelgan", () => {
    const levels = blockLevels([{ id: "a", dependeDe: ["b"] }, { id: "b", dependeDe: ["a"] }, { id: "c", dependeDe: ["zzz"] }]);
    expect(levels.c).toBe(1);
    expect(Object.keys(levels)).toHaveLength(3);
  });
  it("apila sobre la columna de la dependencia y evita superposiciones", () => {
    const cells = Object.fromEntries(layoutMontaje(blocks).map((c) => [c.id, c]));
    expect(cells.db).toMatchObject({ level: 1, col: 0 });
    expect(cells.docs).toMatchObject({ level: 1, col: 1 });
    expect(cells.api).toMatchObject({ level: 2, col: 0 });
    expect(cells.ui).toMatchObject({ level: 3, col: 0 });
    expect(cells.api!.y).toBe(cells.db!.y - ISO.h);
    expect(cells.ui!.y).toBe(cells.db!.y - 2 * ISO.h);
  });
  it("orden del pintor: de atrás hacia adelante y de abajo hacia arriba", () => {
    const order = layoutMontaje(blocks).map((c) => c.id);
    expect(order).toEqual(["db", "api", "ui", "docs"]);
  });
  it("la caja contiene a todos los cubos", () => {
    const cells = layoutMontaje(blocks);
    const box = isoBounds(cells);
    for (const c of cells) {
      expect(c.x - ISO.hw).toBeGreaterThanOrEqual(box.x);
      expect(c.x + ISO.hw).toBeLessThanOrEqual(box.x + box.w);
      expect(c.y).toBeGreaterThanOrEqual(box.y);
      expect(c.y + 2 * ISO.hh + ISO.h).toBeLessThanOrEqual(box.y + box.h);
    }
    expect(isoBounds([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
  it("caras del cubo", () => {
    expect(isoFaces(0, 0).top).toBe(`0,0 ${ISO.hw},${ISO.hh} 0,${2 * ISO.hh} ${-ISO.hw},${ISO.hh}`);
  });
});

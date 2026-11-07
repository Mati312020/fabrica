import { describe, expect, it } from "vitest";
import { elapsedMs, formatElapsed } from "./agentView";
import { stepDelay } from "./countUp";
import { cubePoints } from "./cube";
import { fuseTiming } from "./diagram/wire";
import { blockColors, planLevels, planStats } from "./plan";

const blocks = [
  { id: "a", dependeDe: [], familia: "f1" },
  { id: "b", dependeDe: ["a"], familia: "f1" },
  { id: "c", dependeDe: ["a", "b"], familia: "f2" },
];

describe("plan", () => {
  it("cuenta bloques, familias y niveles", () => {
    expect(planStats(blocks)).toEqual({ bloques: 3, familias: 2, niveles: 3 });
  });
  it("un ciclo no cuelga el cálculo", () => {
    expect(planLevels([{ id: "x", dependeDe: ["y"], familia: "f" }, { id: "y", dependeDe: ["x"], familia: "f" }])).toBeGreaterThan(0);
  });
  it("un color por familia y tonos distintos dentro de ella", () => {
    const colors = blockColors(blocks);
    expect(colors["a"]).toBe("var(--famA)");
    expect(colors["b"]).toContain("var(--famA) 78%");
    expect(colors["c"]).toBe("var(--famB)");
  });
});

describe("animaciones", () => {
  it("el contador sube más lento cuanto menos falta (máx. 40 ms, 600 ms en total)", () => {
    expect(stepDelay(26)).toBeCloseTo(600 / 26);
    expect(stepDelay(5)).toBe(40);
    expect(stepDelay(0)).toBe(40);
  });
  it("la mecha viaja a ≈450 px/s entre 300 y 900 ms y los segmentos esperan a los anteriores", () => {
    const short = fuseTiming({ sourceX: 0, sourceY: 0, targetX: 10, targetY: 0 }, 0);
    const long = fuseTiming({ sourceX: 0, sourceY: 0, targetX: 5000, targetY: 0 }, 2);
    expect(short.travel).toBe(300);
    expect(long.travel).toBe(900);
    expect(long.delay).toBe(1800);
  });
  it("el cubo se llena de abajo hacia arriba", () => {
    expect(cubePoints(100).top).toBe("32,1 63,17 32,33 1,17");
    expect(cubePoints(0).top).toBe("32,37 63,53 32,69 1,53");
    expect(cubePoints(500)).toEqual(cubePoints(100));
  });
});

describe("tiempo del agente", () => {
  it("se mide entre eventos, sin relojes", () => {
    const agent = { startedAt: "2026-11-07T12:00:00.000Z", lastAt: "2026-11-07T12:04:12.000Z" };
    expect(formatElapsed(elapsedMs(agent) ?? 0)).toBe("04:12");
    expect(elapsedMs({ startedAt: null, lastAt: agent.lastAt })).toBeNull();
  });
});

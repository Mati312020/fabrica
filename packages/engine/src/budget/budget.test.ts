import { describe, expect, it } from "vitest";
import { createBudget } from "./budget.js";

function setup() {
  const events: Array<{ type: string; data: unknown }> = [];
  const budget = createBudget((type, data) => void events.push({ type, data }), () => undefined);
  budget.setLimit(10);
  events.length = 0;
  const count = (type: string) => events.filter((e) => e.type === type).length;
  return { budget, events, count };
}

describe("presupuesto", () => {
  it("avisa una sola vez al 80% y pausa al 95%", () => {
    const { budget, events, count } = setup();
    budget.add(7);
    expect(count("budget.warning")).toBe(0);
    budget.add(1);
    budget.add(0.2);
    expect(count("budget.warning")).toBe(1);
    expect(budget.noNewBranches()).toBe(true);
    expect(budget.blocked()).toBe(false);
    budget.add(1.4);
    expect(budget.blocked()).toBe(true);
    expect(events.filter((e) => e.type === "budget.paused")).toEqual([{ type: "budget.paused", data: { pct: 96 } }]);
    expect(count("budget.warning")).toBe(1);
  });

  it("la reserva habilita hasta el 100% y ahí hay pausa definitiva", () => {
    const { budget, count } = setup();
    budget.add(9.6);
    budget.useReserve();
    expect(budget.blocked()).toBe(false);
    expect(budget.remaining()).toBeCloseTo(0.4);
    budget.add(0.4);
    expect(budget.blocked()).toBe(true);
    expect(count("budget.paused")).toBe(2);
    budget.useReserve();
    expect(budget.blocked()).toBe(true);
  });

  it("subir el límite desbloquea y vuelve a permitir ramas", () => {
    const { budget } = setup();
    budget.add(9.8);
    expect(budget.blocked()).toBe(true);
    budget.setLimit(50);
    expect(budget.blocked()).toBe(false);
    expect(budget.noNewBranches()).toBe(false);
  });

  it("el tope duro que recibe el SDK es el 95% si no se usó la reserva", () => {
    const { budget } = setup();
    budget.add(2);
    expect(budget.remaining()).toBeCloseTo(7.5);
  });
});

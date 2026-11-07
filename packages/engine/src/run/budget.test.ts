import { afterEach, describe, expect, it } from "vitest";
import { auditOk, orch, until } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

describe("presupuesto en el motor", () => {
  it("pasado el 80% no se crean ramas nuevas y el aviso sale una vez", async () => {
    h = makeHarness({ orquestador: () => orch({ ramas: [{ tipo: "diseno", nombre: "Diseño" }] }, 0.85), auditoria: auditOk });
    h.send("budget.setLimit", { usd: 1 });
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("budget.warning");
    await until(() => h.of("chat.message").length >= 3);
    expect(h.of("branch.created")).toHaveLength(0);
    expect(h.of("chat.message").some((m) => m.texto.includes("80%"))).toBe(true);
    expect(h.of("budget.warning")).toEqual([{ pct: 85 }]);
    expect(h.of("engine.status").at(-1)).toMatchObject({ budgetLimit: 1 });
  });

  it("al 95% se pausa; la reserva permite seguir", async () => {
    h = makeHarness({ orquestador: () => orch({}, 0.96) });
    h.send("budget.setLimit", { usd: 1 });
    h.send("chat.send", { texto: "uno" });
    await h.waitFor("budget.paused");
    h.send("chat.send", { texto: "dos" });
    await h.waitFor("agent.status", (d) => d.estado === "pausado");
    await new Promise((r) => setTimeout(r, 50));
    expect(h.provider.count("orquestador")).toBe(1);
    h.send("budget.useReserve", {});
    await until(() => h.provider.count("orquestador") === 2);
  });

  it("el pedido al proveedor lleva lo que queda del presupuesto", async () => {
    h = makeHarness({ orquestador: () => orch({}, 0.2) });
    h.send("budget.setLimit", { usd: 2 });
    h.send("chat.send", { texto: "uno" });
    await h.waitFor("budget.update", (d) => d.usado > 0);
    expect(h.provider.calls[0]?.maxBudgetUsd).toBeCloseTo(1.9);
  });
});

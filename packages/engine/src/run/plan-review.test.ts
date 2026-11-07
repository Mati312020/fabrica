import { afterEach, describe, expect, it } from "vitest";
import { auditOk, blk, code, orch, planOf } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

describe("revisión del plan por el usuario", () => {
  it("rechazar el plan lanza otra planificación con el comentario", async () => {
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }),
      planificacion: (_r, call) => (call === 1 ? planOf(blk("A")) : planOf(blk("A"), blk("B", ["A"]))),
      codificacion: code,
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "armá una web" });
    const first = await h.waitFor("plan.ready");
    h.send("plan.reject", { planId: first.data.planId, comentario: "Separar el login" });
    const second = await h.waitFor("plan.ready", (d) => d.planId !== first.data.planId);
    expect(second.data.bloques).toHaveLength(2);
    const retry = h.provider.calls.filter((c) => c.role === "planificacion")[1];
    expect(retry?.prompt).toContain("Separar el login");
    expect(retry?.prompt).toContain("Bloque A");
    expect(h.provider.count("codificacion")).toBe(0);
  });

  it("aprobar un plan viejo o inexistente no hace nada", async () => {
    h = makeHarness({ orquestador: () => orch({ pedirPlan: true }), planificacion: () => planOf(blk("A")), auditoria: auditOk });
    h.send("chat.send", { texto: "plan" });
    await h.waitFor("plan.ready");
    h.send("plan.approve", { planId: "otro" });
    await new Promise((r) => setTimeout(r, 50));
    expect(h.provider.count("codificacion")).toBe(0);
  });
});

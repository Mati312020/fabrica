import { afterEach, describe, expect, it } from "vitest";
import { auditOk, blk, code, inOrder, ok, orch, planOf } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

describe("camino feliz", () => {
  it("chat → investigación → plan → aprobación → 3 bloques → ensamblado", async () => {
    h = makeHarness({
      orquestador: () => orch({ investigaciones: [{ resumen: "normas" }], pedirPlan: true }),
      investigacion: () => ok({ hallazgos: "hay una norma", fuentes: ["https://x.test"] }),
      planificacion: () => planOf(blk("A"), blk("B", ["A"], "visual"), blk("C", ["A", "B"])),
      codificacion: code,
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "Quiero una web" });
    const plan = await h.waitFor("plan.ready");
    expect(plan.data.bloques.map((b) => b.id)).toEqual(["A", "B", "C"]);
    expect(plan.data.bloques[1]).toMatchObject({ tipo: "visual", dependeDe: ["A"], familia: "azul" });
    h.send("plan.approve", { planId: plan.data.planId });

    const card = await h.waitFor("block.approvalRequested");
    expect(card.data).toMatchObject({ blockId: "B", previewUrl: "", archivos: ["a.ts"] });
    expect(h.of("block.assembled").map((b) => b.blockId)).toEqual(["A"]);
    h.send("block.approve", { blockId: "B" });
    await h.waitFor("block.assembled", (d) => d.blockId === "C");

    expect(h.of("block.assembled").map((b) => b.blockId)).toEqual(["A", "B", "C"]);
    expect(h.of("audit.result").every((a) => a.ok)).toBe(true);
    expect(h.of("audit.result")).toHaveLength(5);
    expect(h.provider.calls.every((c) => !c.tools.includes("Bash"))).toBe(true);
  });

  it("emite el ciclo de una tarea en el orden esperado", async () => {
    h = makeHarness({
      orquestador: () => orch({ investigaciones: [{ resumen: "normas" }] }),
      investigacion: () => ({ output: { hallazgos: "h", fuentes: [] }, tools: ["WebSearch"], text: "buscando" }),
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("audit.result");
    expect(
      inOrder(h.types(), [
        "chat.message", "agent.spawned", "agent.status", "chat.message", "branch.created", "agent.spawned",
        "task.assigned", "agent.status", "agent.tool", "agent.output", "agent.tokens", "agent.status",
        "task.toAudit", "audit.result",
      ]),
    ).toBe(true);
    expect(h.of("branch.created")).toEqual(
      expect.arrayContaining([{ id: "investigacion", tipo: "investigacion", nombre: "Investigación" }]),
    );
    expect(h.of("agent.tokens").at(-1)?.costo).toBeGreaterThan(0);
    expect(h.of("budget.update").at(-1)?.usado).toBeGreaterThan(0);
  });
});

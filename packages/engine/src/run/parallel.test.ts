import { afterEach, describe, expect, it } from "vitest";
import { auditOk, blk, ok, orch, planOf, until } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

describe("paralelismo de bloques", () => {
  it("nunca más de 3 a la vez y ninguno antes que sus dependencias", async () => {
    const plan = planOf(
      blk("P1"), blk("P2"), blk("P3"), blk("P4"), blk("P5"),
      blk("D1", ["P1"]), blk("D2", ["P1", "P2"]), blk("F", ["D1", "D2", "P5"]),
    );
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }),
      planificacion: () => plan,
      codificacion: async () => {
        await new Promise((r) => setTimeout(r, 40));
        return ok({ resumen: "hecho", archivos: [] });
      },
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "plan" });
    const ready = await h.waitFor("plan.ready");
    h.send("plan.approve", { planId: ready.data.planId });
    await until(() => h.of("block.assembled").length === 8);

    expect(h.provider.maxActive.codificacion).toBe(3);
    const assembled = new Map<string, number>();
    h.events.forEach((e, i) => e.type === "block.assembled" && assembled.set(e.data.blockId, i));
    for (const e of h.events.filter((x) => x.type === "task.assigned" && x.data.blockId)) {
      const block = ready.data.bloques.find((b) => e.type === "task.assigned" && b.id === e.data.blockId)!;
      for (const dep of block.dependeDe) {
        expect(assembled.get(dep)!).toBeLessThan(h.events.indexOf(e));
      }
    }
    expect(h.of("agent.spawned").filter((a) => a.rama === "codificacion")).toHaveLength(8);
    expect(h.of("agent.spawned").filter((a) => a.rama === "auditoria").length).toBeLessThanOrEqual(2);
    expect(h.provider.maxActive.auditoria).toBeLessThanOrEqual(2);
  });

  it("un bloque visual rechazado vuelve a codificarse con el comentario", async () => {
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }),
      planificacion: () => planOf(blk("V", [], "visual")),
      codificacion: () => ok({ resumen: "hecho", archivos: ["v.tsx"] }),
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "plan" });
    h.send("plan.approve", { planId: (await h.waitFor("plan.ready")).data.planId });
    await h.waitFor("block.approvalRequested");
    h.send("block.reject", { blockId: "V", comentario: "Más contraste" });
    await until(() => h.of("block.approvalRequested").length === 2);
    expect(h.provider.calls.filter((c) => c.role === "codificacion")[1]?.prompt).toContain("Más contraste");
    h.send("block.approve", { blockId: "V" });
    await h.waitFor("block.assembled");
  });
});

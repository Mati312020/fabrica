import { afterEach, describe, expect, it } from "vitest";
import { auditNo, auditOk, passed, blk, ok, orch, planOf, until } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());
const research = () => ok({ hallazgos: "h", fuentes: [] });
const asks = { orquestador: () => orch({ investigaciones: [{ resumen: "normas" }] }), investigacion: research };

describe("rechazos y escalamiento", () => {
  it("3 rechazos de Haiku escalan a Sonnet con un agente nuevo que rehace desde cero", async () => {
    h = makeHarness({ ...asks, auditoria: (_r, call) => (call <= 3 ? auditNo(`motivo-${call}`) : passed) });
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("task.escalated");
    await until(() => h.of("audit.result").length === 4);
    expect(h.of("task.escalated")[0]).toMatchObject({ modeloAnterior: "haiku", modeloNuevo: "sonnet" });
    expect(h.of("agent.spawned").filter((a) => a.rama === "investigacion")).toMatchObject([
      { modelo: "haiku" }, { modelo: "sonnet", escaladoDesde: "haiku" },
    ]);
    const calls = h.provider.calls.filter((c) => c.role === "investigacion");
    expect(calls.map((c) => c.model)).toEqual(["haiku", "haiku", "haiku", "sonnet"]);
    expect(calls[1]?.prompt).toContain("motivo-1");
    expect(calls[1]?.prompt).not.toContain("motivo-2");
    expect(calls[3]?.prompt).toMatch(/motivo-1[\s\S]*motivo-2[\s\S]*motivo-3/);
    expect(h.of("audit.result").map((a) => a.ok)).toEqual([false, false, false, true]);
  });

  async function blockedOpus(): Promise<{ allow: () => void }> {
    let allowed = false;
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }),
      planificacion: () => planOf(blk("A")),
      auditoria: () => (allowed ? passed : auditNo("mal")),
    });
    h.send("chat.send", { texto: "plan" });
    await h.waitFor("task.blocked");
    return { allow: () => void (allowed = true) };
  }

  it("3 rechazos de Opus bloquean la tarea y piden decisión; reintentar la retoma", async () => {
    const { allow } = await blockedOpus();
    const blocked = h.of("task.blocked")[0]!;
    expect(h.of("task.escalated")).toHaveLength(0);
    expect(h.events.some((e) => e.type === "chat.message" && e.data.rol === "sistema")).toBe(true);
    allow();
    h.send("run.answer", { taskId: blocked.taskId, decision: "reintentar" });
    await h.waitFor("plan.ready");
    expect(h.provider.calls.filter((c) => c.role === "planificacion").every((c) => c.model === "opus")).toBe(true);
  });

  it("cancelar deja la tarea sin plan", async () => {
    await blockedOpus();
    h.send("run.answer", { taskId: h.of("task.blocked")[0]!.taskId, decision: "cancelar" });
    await new Promise((r) => setTimeout(r, 60));
    expect(h.of("plan.ready")).toHaveLength(0);
  });

  it("una salida que no valida cuenta como rechazo salida_invalida sin auditar", async () => {
    h = makeHarness({
      ...asks,
      investigacion: (_r, call) => (call === 1 ? ok({ nada: true }) : research()),
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("audit.result", (d) => d.ok);
    const [first] = h.of("audit.result");
    expect(first).toMatchObject({ ok: false });
    expect(first?.motivo.startsWith("salida_invalida")).toBe(true);
    expect(h.provider.count("auditoria")).toBe(1);
  });

  it("un plan con ciclo se rechaza sin llamar al modelo auditor", async () => {
    h = makeHarness({
      orquestador: () => orch({ pedirPlan: true }),
      planificacion: (_r, call) => (call === 1 ? planOf(blk("A", ["B"]), blk("B", ["A"])) : planOf(blk("A"))),
      auditoria: auditOk,
    });
    h.send("chat.send", { texto: "plan" });
    await h.waitFor("plan.ready");
    expect(h.of("audit.result")[0]?.motivo).toContain("ciclo_de_dependencias");
    expect(h.provider.count("auditoria")).toBe(1);
    expect(h.provider.count("planificacion")).toBe(2);
  });
});

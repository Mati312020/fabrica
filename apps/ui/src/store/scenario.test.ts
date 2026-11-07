import { describe, expect, it } from "vitest";
import { buildGraph } from "../lib/diagram/graph";
import { fold } from "./fixtures";
import { building, failing, planning } from "./scenario";
import { costByModel, modelCounts, pendingCards } from "./selectors";
import { cardKey } from "./uiStore";

/** Escenario completo: vive solo en tests, la app nunca muestra datos de ejemplo. */
describe("escenario completo desde eventos", () => {
  const planned = fold(planning);

  it("construye ramas, agentes, tareas y el plan pendiente", () => {
    expect(planned.workspace).toBe("D:\\proyectos\\demo");
    expect(planned.branches.map((b) => b.id)).toEqual(["investigacion", "planificacion", "auditoria"]);
    expect(planned.agents["investigacion-1"]).toMatchObject({ estado: "trabajando", pct: 40, tarea: "buscar" });
    expect(planned.audit).toMatchObject({ llamadas: 1, veredicto: { ok: true } });
    expect(pendingCards(planned, {}).map((c) => c.kind)).toEqual(["plan"]);
  });

  it("la tarjeta del plan desaparece al decidirla y el plan se aprueba con la rama de codificación", () => {
    expect(pendingCards(planned, { [cardKey.plan("p1")]: true })).toEqual([]);
    const built = fold(building, planned);
    expect(built.plan?.aprobado).toBe(true);
    expect(built.blocks["auth"]?.estado).toBe("ensamblado");
    expect(built.blocks["db"]?.estado).toBe("pendiente");
    expect(pendingCards(built, {}).map((c) => c.kind)).toEqual(["block"]);
    expect(built.budget).toEqual({ usado: 0.25, limite: 5 });
  });

  it("enciende cables solo con eventos: tarea, auditoría y retorno", () => {
    const { edgeFx } = fold(building, planned);
    expect(edgeFx["dispatch:codificacion"]).toMatchObject({ color: "haiku", step: 0 });
    expect(edgeFx["task:codificacion-1"]).toMatchObject({ color: "haiku", step: 1 });
    expect(planned.edgeFx["audit:investigacion"]?.color).toBe("haiku");
    expect(planned.edgeFx["return"]?.color).toBe("ok");
    expect(fold([]).edgeFx).toEqual({});
  });

  it("3 rechazos, escalado, bloqueo y pausa por presupuesto", () => {
    const state = fold(failing, fold(building, planned));
    expect(state.agents["codificacion-1"]).toMatchObject({ errores: 3, escalado: true });
    expect(state.agents["codificacion-2"]).toMatchObject({ escaladoDesde: "haiku", modelo: "sonnet" });
    expect(state.tasks["t2"]?.rechazos).toBe(3);
    expect(state.edgeFx["return"]?.color).toBe("err");
    expect(state.budgetPhase).toBe("pausa");
    expect(pendingCards(state, {}).map((c) => c.kind)).toEqual(["block", "blocked"]);
    expect(costByModel(state.agents).haiku).toBe(0.25);
    expect(modelCounts(state.agents).find((m) => m.model === "sonnet")?.total).toBe(1);
  });

  it("el diagrama sale del estado: orquestador, columnas sin auditoría y memoria", () => {
    const graph = buildGraph({ ...fold(building, planned), pending: 0 });
    const ids = graph.nodes.map((n) => n.id);
    expect(ids).toContain("agent:codificacion-1");
    expect(ids).not.toContain("agent:auditoria-1");
    expect(ids).toEqual(expect.arrayContaining(["chat", "orch", "memo", "head:codificacion", "join:investigacion"]));
    const lit = graph.edges.find((e) => e.id === "head:codificacion>agent:codificacion-1");
    expect((lit?.data as { fx?: unknown }).fx).toBeDefined();
  });
});

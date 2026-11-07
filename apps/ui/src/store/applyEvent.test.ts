import { describe, expect, it } from "vitest";
import type { FabricaEvent } from "@fabrica/events";
import { applyEvent } from "./applyEvent";
import { ev, fold } from "./fixtures";
import { initialState } from "./state";

const at = "2026-11-07T12:00:00.000Z";

const chat = (texto: string): FabricaEvent => ({
  type: "chat.message",
  at,
  data: { rol: "sistema", texto },
});

describe("applyEvent", () => {
  it("agrega los chat.message al chat y al registro", () => {
    const state = applyEvent(applyEvent(initialState, chat("uno")), chat("dos"));
    expect(state.messages.map((m) => m.texto)).toEqual(["uno", "dos"]);
    expect(state.log.map((l) => l.type)).toEqual(["chat.message", "chat.message"]);
  });

  it("engine.status actualiza pausa y API key", () => {
    const event: FabricaEvent = { type: "engine.status", at, data: { apiKeyConfigured: true, paused: true, workspace: null, budgetLimit: 5 } };
    const state = applyEvent(initialState, event);
    expect(state).toMatchObject({ apiKeyConfigured: true, paused: true, workspace: null, budgetLimit: 5 });
  });

  it("engine.ready guarda la versión del motor", () => {
    const event: FabricaEvent = { type: "engine.ready", at, data: { version: "1.2.3", protocol: 1 } };
    expect(applyEvent(initialState, event).engine).toEqual({ version: "1.2.3", protocol: 1 });
  });

  it("cada evento es una línea hh:mm:ss con tipo y resumen", () => {
    const [line] = applyEvent(initialState, chat("hola")).log;
    expect(line?.time).toMatch(/^\d\d:\d\d:\d\d$/);
    expect(line).toMatchObject({ type: "chat.message" });
    expect(line?.summary).toContain("hola");
  });

  it("no muta el estado anterior y limita el registro a 200 líneas", () => {
    let state = initialState;
    for (let i = 0; i < 250; i++) state = applyEvent(state, chat(String(i)));
    expect(initialState.log).toHaveLength(0);
    expect(state.log).toHaveLength(200);
    expect(state.log.at(-1)?.summary).toContain("249");
  });

  it("ignora agent.status de un agente desconocido", () => {
    const event: FabricaEvent = { type: "agent.status", at, data: { id: "x", estado: "trabajando" } };
    expect(applyEvent(initialState, event).agents).toEqual({});
  });

  it("budget: aviso una vez, pausa al 95 % y vuelve a normal al subir el límite", () => {
    const warned = fold([ev("budget.update", { usado: 4.1, limite: 5 }), ev("budget.warning", { pct: 82 })]);
    expect(warned.budgetPhase).toBe("aviso");
    const paused = fold([ev("budget.update", { usado: 4.8, limite: 5 })], warned);
    expect(paused.budgetPhase).toBe("pausa");
    expect(fold([ev("budget.update", { usado: 4.8, limite: 20 })], paused).budgetPhase).toBe("normal");
  });

  it("un plan nuevo (replanificación) reemplaza al anterior y vuelve a pedir aprobación", () => {
    const bloques = [{ id: "a", nombre: "a", tipo: "tecnico", dependeDe: [], familia: "f" }];
    const state = fold([ev("plan.ready", { planId: "p1", bloques }), ev("plan.ready", { planId: "p2", bloques })]);
    expect(state.plan).toMatchObject({ planId: "p2", aprobado: false });
    expect(state.blocks["a"]?.estado).toBe("propuesto");
  });

  it("agent.output se acumula y la herramienta se limpia al cambiar de estado", () => {
    const state = fold([
      ev("agent.spawned", { id: "x-1", rama: "x", modelo: "sonnet" }),
      ev("agent.tool", { id: "x-1", herramienta: "Write", detalle: "a.ts" }),
      ev("agent.output", { id: "x-1", texto: "uno " }),
      ev("agent.output", { id: "x-1", texto: "dos" }),
    ]);
    expect(state.agents["x-1"]).toMatchObject({ texto: "uno dos", herramienta: null });
  });
});

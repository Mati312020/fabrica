import { describe, expect, it } from "vitest";
import { PROTOCOL_VERSION, commandSchema, eventSchema } from "./index.js";

const at = "2026-11-07T12:00:00.000Z";

describe("commandSchema", () => {
  it("acepta un hello válido", () => {
    const hello = { type: "hello", at, data: { token: "abc", protocol: PROTOCOL_VERSION } };
    expect(commandSchema.safeParse(hello).success).toBe(true);
  });

  it("acepta chat.send y rechaza texto vacío", () => {
    const ok = { type: "chat.send", at, data: { texto: "hola" } };
    const vacio = { type: "chat.send", at, data: { texto: "   " } };
    expect(commandSchema.safeParse(ok).success).toBe(true);
    expect(commandSchema.safeParse(vacio).success).toBe(false);
  });

  it("rechaza tipos desconocidos y fechas inválidas", () => {
    expect(commandSchema.safeParse({ type: "nope", at, data: {} }).success).toBe(false);
    expect(commandSchema.safeParse({ type: "run.pause", at: "ayer", data: {} }).success).toBe(false);
  });

  it("exige comentario en block.reject", () => {
    const sin = { type: "block.reject", at, data: { blockId: "b1" } };
    expect(commandSchema.safeParse(sin).success).toBe(false);
  });
});

describe("comandos de la Fase 1", () => {
  it("acepta budget.setLimit positivo y run.answer con decisión válida", () => {
    expect(commandSchema.safeParse({ type: "budget.setLimit", at, data: { usd: 10 } }).success).toBe(true);
    expect(commandSchema.safeParse({ type: "budget.setLimit", at, data: { usd: 0 } }).success).toBe(false);
    const answer = { type: "run.answer", at, data: { taskId: "t1", decision: "reintentar" } };
    expect(commandSchema.safeParse(answer).success).toBe(true);
    expect(commandSchema.safeParse({ ...answer, data: { taskId: "t1", decision: "quizas" } }).success).toBe(false);
  });

  it("plan.reject lleva un comentario opcional", () => {
    expect(commandSchema.safeParse({ type: "plan.reject", at, data: { planId: "p" } }).success).toBe(true);
    expect(commandSchema.safeParse({ type: "plan.reject", at, data: { planId: "p", comentario: "x" } }).success).toBe(true);
  });
});

describe("eventos de la Fase 1", () => {
  it("task.blocked, agent.spawned con escaladoDesde y ramas con tipo libre", () => {
    expect(eventSchema.safeParse({ type: "task.blocked", at, data: { taskId: "t", motivo: "m" } }).success).toBe(true);
    const spawned = { type: "agent.spawned", at, data: { id: "a", rama: "r", modelo: "sonnet", escaladoDesde: "haiku" } };
    expect(eventSchema.safeParse(spawned).success).toBe(true);
    expect(eventSchema.safeParse({ ...spawned, data: { ...spawned.data, escaladoDesde: "gpt" } }).success).toBe(false);
    expect(eventSchema.safeParse({ type: "branch.created", at, data: { id: "diseno", tipo: "diseno", nombre: "Diseño" } }).success).toBe(true);
  });

  it("plan.ready exige tipo, dependencias y familia por bloque", () => {
    const bloque = { id: "A", nombre: "Auth", tipo: "tecnico", dependeDe: [], familia: "azul" };
    const plan = (b: unknown) => ({ type: "plan.ready", at, data: { planId: "p", bloques: [b] } });
    expect(eventSchema.safeParse(plan(bloque)).success).toBe(true);
    expect(eventSchema.safeParse(plan({ id: "A", nombre: "Auth" })).success).toBe(false);
    expect(eventSchema.safeParse(plan({ ...bloque, tipo: "raro" })).success).toBe(false);
  });
});

describe("eventSchema", () => {
  it("acepta engine.status y chat.message", () => {
    const status = { type: "engine.status", at, data: { apiKeyConfigured: false, paused: false, workspace: null, budgetLimit: 5 } };
    const chat = { type: "chat.message", at, data: { rol: "sistema", texto: "ok" } };
    expect(eventSchema.safeParse(status).success).toBe(true);
    expect(eventSchema.safeParse(chat).success).toBe(true);
  });

  it("rechaza roles y estados inexistentes", () => {
    const rol = { type: "chat.message", at, data: { rol: "robot", texto: "x" } };
    const estado = { type: "agent.status", at, data: { id: "a", estado: "volando" } };
    expect(eventSchema.safeParse(rol).success).toBe(false);
    expect(eventSchema.safeParse(estado).success).toBe(false);
  });

  it("acepta el estado dormido y rechaza progreso fuera de rango", () => {
    const dormido = { type: "agent.status", at, data: { id: "a", estado: "dormido" } };
    const pct = { type: "agent.progress", at, data: { id: "a", pct: 140 } };
    expect(eventSchema.safeParse(dormido).success).toBe(true);
    expect(eventSchema.safeParse(pct).success).toBe(false);
  });
});

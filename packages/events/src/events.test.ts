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

describe("eventSchema", () => {
  it("acepta engine.status y chat.message", () => {
    const status = { type: "engine.status", at, data: { apiKeyConfigured: false, paused: false } };
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

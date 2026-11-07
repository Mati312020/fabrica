import { describe, expect, it } from "vitest";
import type { AlfaEvent } from "@alfa/events";
import { applyEvent } from "./applyEvent";
import { initialState } from "./state";

const at = "2026-11-07T12:00:00.000Z";

const chat = (texto: string): AlfaEvent => ({
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
    const event: AlfaEvent = { type: "engine.status", at, data: { apiKeyConfigured: true, paused: true } };
    const state = applyEvent(initialState, event);
    expect(state).toMatchObject({ apiKeyConfigured: true, paused: true });
  });

  it("engine.ready guarda la versión del motor", () => {
    const event: AlfaEvent = { type: "engine.ready", at, data: { version: "1.2.3", protocol: 1 } };
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
    const event: AlfaEvent = { type: "agent.status", at, data: { id: "x", estado: "trabajando" } };
    expect(applyEvent(initialState, event).agents).toEqual({});
  });
});

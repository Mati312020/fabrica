import { describe, expect, it } from "vitest";
import { commandSchema, eventSchema } from "./index.js";

const at = "2026-11-07T12:00:00.000Z";

describe("contrato de la Fase 4", () => {
  it("block.reject acepta marcas opcionales con x e y en 0-100", () => {
    const base = { blockId: "b", comentario: "x" };
    const cmd = (data: unknown) => commandSchema.safeParse({ type: "block.reject", at, data });
    expect(cmd(base).success).toBe(true);
    expect(cmd({ ...base, marcas: [{ x: 10, y: 99.5, texto: "aquí" }] }).success).toBe(true);
    expect(cmd({ ...base, marcas: [{ x: 101, y: 5, texto: "aquí" }] }).success).toBe(false);
    expect(cmd({ ...base, marcas: [{ x: 1, y: 5 }] }).success).toBe(false);
  });

  it("project.setCommitPerBlock exige un booleano", () => {
    expect(commandSchema.safeParse({ type: "project.setCommitPerBlock", at, data: { enabled: true } }).success).toBe(true);
    expect(commandSchema.safeParse({ type: "project.setCommitPerBlock", at, data: { enabled: "si" } }).success).toBe(false);
  });

  it("audit.browserReport y block.committed", () => {
    const report = { taskId: "t", errores: [], fallidos: ["404 /x"], pasosFallidos: [], capturas: ["c.png"] };
    expect(eventSchema.safeParse({ type: "audit.browserReport", at, data: report }).success).toBe(true);
    expect(eventSchema.safeParse({ type: "audit.browserReport", at, data: { taskId: "t" } }).success).toBe(false);
    expect(eventSchema.safeParse({ type: "block.committed", at, data: { blockId: "b", hash: "abc1234" } }).success).toBe(true);
  });

  it("engine.status suma commitPerBlock y gitRepo (false si faltan)", () => {
    const data = { apiKeyConfigured: false, paused: false, workspace: null, budgetLimit: 5 };
    const parsed = eventSchema.safeParse({ type: "engine.status", at, data });
    expect(parsed.success && parsed.data.type === "engine.status" && parsed.data.data.commitPerBlock).toBe(false);
    expect(eventSchema.safeParse({ type: "engine.status", at, data: { ...data, commitPerBlock: true, gitRepo: true } }).success).toBe(true);
  });
});

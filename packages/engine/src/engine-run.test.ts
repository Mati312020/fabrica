import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { PROTOCOL_VERSION, type FabricaEvent } from "@fabrica/events";
import { startEngine, type EngineHandle } from "./index.js";
import { auditOk, orch } from "./testing/fixtures.js";
import { ScriptedProvider } from "./testing/scripted.js";

const TOKEN = "t".repeat(32);
const stamp = (type: string, data: unknown) => JSON.stringify({ type, at: new Date().toISOString(), data });
let engine: EngineHandle;
let dir: string;
afterEach(async () => {
  await engine.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("motor con proveedor inyectado", () => {
  it("carpeta y key configuradas: el chat corre al orquestador y la key no se emite", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "fabrica-"));
    const provider = new ScriptedProvider({ orquestador: () => orch({ respuesta: "Hola, soy el orquestador" }), auditoria: auditOk });
    engine = await startEngine({ token: TOKEN, provider });
    engine.setApiKey("sk-ant-secreta");
    engine.setWorkspace(dir);
    const events: FabricaEvent[] = [];
    const ws = new WebSocket(`ws://127.0.0.1:${engine.port}`);
    ws.on("message", (raw) => events.push(JSON.parse(String(raw)) as FabricaEvent));
    ws.on("open", () => {
      ws.send(stamp("hello", { token: TOKEN, protocol: PROTOCOL_VERSION }));
      ws.send(stamp("chat.send", { texto: "hola" }));
    });
    for (let i = 0; i < 300 && !events.some((e) => e.type === "chat.message" && e.data.rol === "orquestador"); i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const status = events.find((e) => e.type === "engine.status");
    expect(status).toMatchObject({ data: { workspace: path.resolve(dir), apiKeyConfigured: true } });
    expect(events.some((e) => e.type === "chat.message" && e.data.texto === "Hola, soy el orquestador")).toBe(true);
    expect(provider.calls[0]?.cwd).toBe(path.resolve(dir));
    expect(JSON.stringify(events)).not.toContain("secreta");
    ws.close();
  });

  it("una carpeta inexistente o relativa no se acepta", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "fabrica-"));
    engine = await startEngine({ token: TOKEN, provider: new ScriptedProvider({}) });
    engine.setWorkspace(path.join(dir, "no-existe"));
    engine.setWorkspace("relativa/carpeta");
    const ws = new WebSocket(`ws://127.0.0.1:${engine.port}`);
    const seen = new Promise<FabricaEvent[]>((resolve) => {
      const got: FabricaEvent[] = [];
      ws.on("message", (raw) => {
        got.push(JSON.parse(String(raw)) as FabricaEvent);
        if (got.length === 2) resolve(got);
      });
    });
    ws.on("open", () => ws.send(stamp("hello", { token: TOKEN, protocol: PROTOCOL_VERSION })));
    expect((await seen)[1]).toMatchObject({ data: { workspace: null } });
    ws.close();
  });
});

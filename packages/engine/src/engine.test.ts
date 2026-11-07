import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { PROTOCOL_VERSION, type AlfaEvent } from "@alfa/events";
import { startEngine, type EngineHandle } from "./index.js";

const TOKEN = "t".repeat(32);
const stamp = (type: string, data: unknown) => JSON.stringify({ type, at: new Date().toISOString(), data });
const hello = (token: string) => stamp("hello", { token, protocol: PROTOCOL_VERSION });

let engine: EngineHandle;
beforeEach(async () => {
  engine = await startEngine({ token: TOKEN });
});
afterEach(() => engine.close());

function connect(origin?: string): WebSocket {
  return new WebSocket(`ws://127.0.0.1:${engine.port}`, origin ? { origin } : {});
}

function collect(ws: WebSocket, count: number): Promise<AlfaEvent[]> {
  const events: AlfaEvent[] = [];
  return new Promise((resolve) => {
    ws.on("message", (raw) => {
      events.push(JSON.parse(String(raw)) as AlfaEvent);
      if (events.length === count) resolve(events);
    });
  });
}

const closeCode = (ws: WebSocket) => new Promise<number>((r) => ws.on("close", (code) => r(code)));

describe("motor", () => {
  it("cierra con 4401 si el token es incorrecto", async () => {
    const ws = connect();
    const code = closeCode(ws);
    ws.on("open", () => ws.send(hello("x".repeat(32))));
    expect(await code).toBe(4401);
  });

  it("rechaza orígenes de páginas web ajenas", async () => {
    const ws = connect("https://evil.example");
    const failed = new Promise<boolean>((r) => ws.on("error", () => r(true)));
    expect(await failed).toBe(true);
  });

  it("con token correcto manda engine.ready y engine.status", async () => {
    const ws = connect("http://localhost:5173");
    const events = collect(ws, 2);
    ws.on("open", () => ws.send(hello(TOKEN)));
    const [ready, status] = await events;
    expect(ready?.type).toBe("engine.ready");
    expect(status).toMatchObject({ type: "engine.status", data: { apiKeyConfigured: false } });
    ws.close();
  });

  it("chat.send responde con chat.message del sistema", async () => {
    const ws = connect();
    const events = collect(ws, 4);
    ws.on("open", () => {
      ws.send(hello(TOKEN));
      ws.send(stamp("chat.send", { texto: "hola" }));
    });
    const roles = (await events).filter((e) => e.type === "chat.message").map((e) => e.data);
    expect(roles).toMatchObject([{ rol: "usuario" }, { rol: "sistema" }]);
    ws.close();
  });

  it("un comando inválido da engine.error sin cerrar la conexión", async () => {
    const ws = connect();
    const events = collect(ws, 3);
    ws.on("open", () => {
      ws.send(hello(TOKEN));
      ws.send(stamp("chat.send", { texto: 42 }));
    });
    expect((await events)[2]).toMatchObject({ type: "engine.error", data: { code: "bad_command" } });
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("la API key solo cambia el estado, nunca se emite", async () => {
    const ws = connect();
    const events = collect(ws, 3);
    ws.on("open", () => ws.send(hello(TOKEN)));
    await new Promise((r) => setTimeout(r, 100));
    engine.setApiKey("sk-ant-secreta");
    const all = await events;
    expect(all[2]).toMatchObject({ data: { apiKeyConfigured: true } });
    expect(JSON.stringify(all)).not.toContain("secreta");
    ws.close();
  });
});

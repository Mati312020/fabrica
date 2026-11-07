import { z } from "zod";
import { startEngine, type EngineHandle } from "./server.js";

/** `process.parentPort` solo existe dentro de un utilityProcess de Electron. */
interface ParentPort {
  on(event: "message", cb: (e: { data: unknown }) => void): void;
  postMessage(message: unknown): void;
}

const parentMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("init"), token: z.string().min(16) }),
  z.object({ type: z.literal("config.apiKey"), key: z.string().max(512) }),
]);

const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;
if (!parentPort) throw new Error("child.ts debe correr como utilityProcess de Electron");

let engine: EngineHandle | null = null;
let pendingKey: string | null = null;

parentPort.on("message", async ({ data }) => {
  const message = parentMessage.safeParse(data);
  if (!message.success) return;
  if (message.data.type === "config.apiKey") {
    if (engine) engine.setApiKey(message.data.key);
    else pendingKey = message.data.key;
    return;
  }
  if (engine) return;
  engine = await startEngine({ token: message.data.token });
  if (pendingKey !== null) engine.setApiKey(pendingKey);
  parentPort.postMessage({ type: "listening", port: engine.port });
});

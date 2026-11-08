import { z } from "zod";
import { writeDiagnostics } from "./diag.js";
import { startEngine, type EngineHandle } from "./server.js";

/** `process.parentPort` solo existe dentro de un utilityProcess de Electron. */
interface ParentPort {
  on(event: "message", cb: (e: { data: unknown }) => void): void;
  postMessage(message: unknown): void;
}

const parentMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("init"), token: z.string().min(16) }),
  z.object({ type: z.literal("config.apiKey"), key: z.string().max(512) }),
  z.object({ type: z.literal("config.workspace"), path: z.string().max(1024).nullable() }),
  z.object({ type: z.literal("config.memoryPath"), path: z.string().max(1024).nullable() }),
]);

const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;
if (!parentPort) throw new Error("child.ts debe correr como utilityProcess de Electron");

let engine: EngineHandle | null = null;
let pendingKey: string | null = null;
let pendingWorkspace: string | null = null;
let pendingMemory: string | null = null;

parentPort.on("message", async ({ data }) => {
  const message = parentMessage.safeParse(data);
  if (!message.success) return;
  const m = message.data;
  if (m.type === "config.apiKey") {
    if (engine) engine.setApiKey(m.key);
    else pendingKey = m.key;
    return;
  }
  if (m.type === "config.workspace") {
    if (engine) engine.setWorkspace(m.path);
    else pendingWorkspace = m.path;
    return;
  }
  if (m.type === "config.memoryPath") {
    if (engine) engine.setMemoryPath(m.path);
    else pendingMemory = m.path;
    return;
  }
  if (engine) return;
  engine = await startEngine({ token: m.token });
  if (pendingKey !== null) engine.setApiKey(pendingKey);
  if (pendingWorkspace !== null) engine.setWorkspace(pendingWorkspace);
  if (pendingMemory !== null) engine.setMemoryPath(pendingMemory);
  parentPort.postMessage({ type: "listening", port: engine.port });
  const diagFile = process.env["FABRICA_DIAG_FILE"];
  if (diagFile) void writeDiagnostics(diagFile, engine.port, m.token);
});

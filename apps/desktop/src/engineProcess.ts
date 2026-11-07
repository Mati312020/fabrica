import type { EngineConnection } from "@fabrica/events";
import { utilityProcess } from "electron";
import { randomBytes } from "node:crypto";
import path from "node:path";

/** Motor corriendo como proceso hijo. */
export interface EngineProcess {
  /** Se resuelve cuando el motor informa `listening`; falla si muere antes. */
  connection: Promise<EngineConnection>;
  alive(): boolean;
  /** Manda la API key al motor por el canal del proceso padre (nunca por WebSocket). */
  sendApiKey(key: string): void;
  /** Manda la carpeta del proyecto al motor (null = ninguna). */
  sendWorkspace(dir: string | null): void;
  /** Manda la ruta del archivo de memoria (SQLite, fuera de la carpeta del proyecto). */
  sendMemoryPath(file: string | null): void;
  kill(): void;
}

/**
 * Lanza el motor con utilityProcess y un token aleatorio de 32 bytes.
 * @param onExit Se llama si el motor termina por su cuenta.
 */
export function startEngineProcess(onExit: (code: number) => void): EngineProcess {
  const token = randomBytes(32).toString("hex");
  const child = utilityProcess.fork(path.join(__dirname, "engine.cjs"), [], { serviceName: "fabrica-engine" });
  let alive = true;
  let killedByUs = false;

  const connection = new Promise<EngineConnection>((resolve, reject) => {
    child.on("message", (message: unknown) => {
      const m = message as { type?: string; port?: number };
      if (m.type === "listening" && typeof m.port === "number") {
        resolve({ url: `ws://127.0.0.1:${m.port}`, token });
      }
    });
    child.once("exit", (code) => {
      alive = false;
      reject(new Error(`El motor terminó con código ${code}`));
      if (!killedByUs) onExit(code);
    });
  });
  connection.catch(() => undefined);
  child.postMessage({ type: "init", token });

  return {
    connection,
    alive: () => alive,
    sendApiKey: (key) => child.postMessage({ type: "config.apiKey", key }),
    sendWorkspace: (dir) => child.postMessage({ type: "config.workspace", path: dir }),
    sendMemoryPath: (file) => child.postMessage({ type: "config.memoryPath", path: file }),
    kill() {
      killedByUs = true;
      child.kill();
    },
  };
}

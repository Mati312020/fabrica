import { statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { WebSocketServer } from "ws";
import { DEV_UI_ORIGINS, originAllowed } from "./auth.js";
import { createBus } from "./bus.js";
import { attachConnection } from "./connection.js";
import type { ModelProvider } from "./provider/types.js";
import { SdkProvider } from "./provider/sdk.js";
import { createController } from "./run/controller.js";
import { createState } from "./state.js";

const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Opciones de `startEngine`. */
export interface EngineOptions {
  token: string;
  /** Puerto TCP; 0 (por defecto) elige uno libre. */
  port?: number;
  /** Orígenes web permitidos además de null, file:// y app://. */
  allowedOrigins?: readonly string[];
  /** Proveedor de modelos; por defecto el SDK real. Los tests inyectan un guion. */
  provider?: ModelProvider;
}

/** Motor en ejecución. */
export interface EngineHandle {
  port: number;
  /** Guarda la API key en memoria y avisa el nuevo estado. Vacía = borrar. */
  setApiKey(key: string): void;
  /** Fija la carpeta del proyecto (debe ser un directorio existente); null o inválida = ninguna. */
  setWorkspace(dir: string | null): void;
  close(): Promise<void>;
}

function validDirectory(dir: string | null): string | null {
  if (!dir || !path.isAbsolute(dir)) return null;
  try {
    return statSync(dir).isDirectory() ? path.resolve(dir) : null;
  } catch {
    return null;
  }
}

/**
 * Levanta el WebSocket del motor, siempre en 127.0.0.1.
 * @param options Token de sesión, puerto, orígenes permitidos y proveedor.
 */
export async function startEngine(options: EngineOptions): Promise<EngineHandle> {
  const allowed = options.allowedOrigins ?? DEV_UI_ORIGINS;
  const bus = createBus();
  const state = createState();
  const provider = options.provider ?? new SdkProvider(state.apiKey);
  const controller = createController({ emit: bus.emit, provider, state });
  const wss = new WebSocketServer({
    host: "127.0.0.1",
    port: options.port ?? 0,
    maxPayload: MAX_PAYLOAD_BYTES,
    verifyClient: ({ origin }: { origin?: string }) => originAllowed(origin, allowed),
  });
  await new Promise<void>((resolve, reject) => {
    wss.once("listening", resolve);
    wss.once("error", reject);
  });
  wss.on("connection", (socket) => attachConnection(socket, { token: options.token, bus, controller }));

  return {
    port: (wss.address() as AddressInfo).port,
    setApiKey(key) {
      state.setApiKey(key);
      controller.emitStatus();
    },
    setWorkspace(dir) {
      state.workspace = validDirectory(dir);
      controller.emitStatus();
    },
    close: () =>
      new Promise<void>((resolve) => {
        controller.shutdown();
        for (const client of wss.clients) client.terminate();
        wss.close(() => resolve());
      }),
  };
}

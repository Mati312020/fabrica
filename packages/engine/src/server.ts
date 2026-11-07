import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { DEV_UI_ORIGINS, originAllowed } from "./auth.js";
import { createBus } from "./bus.js";
import { attachConnection } from "./connection.js";
import { emitStatus } from "./handlers.js";
import { createState } from "./state.js";

const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Opciones de `startEngine`. */
export interface EngineOptions {
  token: string;
  /** Puerto TCP; 0 (por defecto) elige uno libre. */
  port?: number;
  /** Orígenes web permitidos además de null, file:// y app://. */
  allowedOrigins?: readonly string[];
}

/** Motor en ejecución. */
export interface EngineHandle {
  port: number;
  /** Guarda la API key en memoria y avisa el nuevo estado. Vacía = borrar. */
  setApiKey(key: string): void;
  close(): Promise<void>;
}

/**
 * Levanta el WebSocket del motor, siempre en 127.0.0.1.
 * @param options Token de sesión, puerto y orígenes permitidos.
 */
export async function startEngine(options: EngineOptions): Promise<EngineHandle> {
  const allowed = options.allowedOrigins ?? DEV_UI_ORIGINS;
  const bus = createBus();
  const state = createState();
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
  wss.on("connection", (socket) => attachConnection(socket, { token: options.token, bus, state }));

  return {
    port: (wss.address() as AddressInfo).port,
    setApiKey(key) {
      state.setApiKey(key);
      emitStatus(bus, state);
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of wss.clients) client.terminate();
        wss.close(() => resolve());
      }),
  };
}

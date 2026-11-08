import { statSync } from "node:fs";
import path from "node:path";
import { DEV_UI_ORIGINS, originAllowed } from "./auth.js";
import { createBus } from "./bus.js";
import { attachConnection } from "./connection.js";
import type { ModelProvider } from "./provider/types.js";
import { SdkProvider } from "./provider/sdk.js";
import { createController } from "./run/controller.js";
import { createMemoryStore } from "./memory/store.js";
import { listen, type TlsOptions } from "./listen.js";
import { createState } from "./state.js";

const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Opciones de `startEngine`. */
export interface EngineOptions {
  token: string;
  /** Puerto TCP; 0 (por defecto) elige uno libre. */
  port?: number;
  /** Interfaz de red; por defecto 127.0.0.1. Un host no loopback exige que el llamador haya validado TLS o proxy. */
  host?: string;
  /** Certificado y clave: el motor sirve `wss://` por sí mismo. */
  tls?: TlsOptions;
  /** Orígenes web permitidos además de null, file:// y app://. */
  allowedOrigins?: readonly string[];
  /** Proveedor de modelos; por defecto el SDK real. Los tests inyectan un guion. */
  provider?: ModelProvider;
  /** Archivo de la memoria (SQLite). Fuera de la carpeta del proyecto; `:memory:` en tests. */
  memoryPath?: string;
}

/** Motor en ejecución. */
export interface EngineHandle {
  port: number;
  /** Guarda la API key en memoria y avisa el nuevo estado. Vacía = borrar. */
  setApiKey(key: string): void;
  /** Abre la base de memoria en esa ruta (null = cerrarla). Debe estar fuera de la carpeta del proyecto. */
  setMemoryPath(file: string | null): void;
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
 * Levanta el WebSocket del motor (por defecto en 127.0.0.1).
 * @param options Token de sesión, host, puerto, TLS, orígenes permitidos y proveedor.
 */
export async function startEngine(options: EngineOptions): Promise<EngineHandle> {
  const allowed = options.allowedOrigins ?? DEV_UI_ORIGINS;
  const bus = createBus();
  const state = createState();
  const provider = options.provider ?? new SdkProvider(state.apiKey);
  const controller = createController({ emit: bus.emit, provider, state, memory: createMemoryStore() });
  if (options.memoryPath) controller.setMemoryPath(options.memoryPath);
  const { wss, port, close } = await listen({
    host: options.host ?? "127.0.0.1",
    port: options.port ?? 0,
    tls: options.tls,
    maxPayload: MAX_PAYLOAD_BYTES,
    verifyOrigin: (origin) => originAllowed(origin, allowed),
  });
  wss.on("connection", (socket) => attachConnection(socket, { token: options.token, bus, controller }));

  return {
    port,
    setApiKey(key) {
      state.setApiKey(key);
      controller.emitStatus();
    },
    setMemoryPath: (file) => controller.setMemoryPath(file),
    setWorkspace(dir) {
      state.workspace = validDirectory(dir);
      state.commitPerBlock = null;
      controller.guardMemory();
      controller.emitStatus();
    },
    close() {
      controller.shutdown();
      return close();
    },
  };
}

/** Datos para conectarse al WebSocket del motor. */
export interface EngineConnection {
  url: string;
  token: string;
}

/** Resultado de guardar la API key. La key nunca vuelve a la UI. */
export type ApiKeyResult =
  | { ok: true }
  | { ok: false; error: "invalid_format" | "encryption_unavailable" | "engine_unavailable" | "engine_remote" };

/** Qué motor usa la app: el local (proceso hijo) o uno remoto en un servidor. */
export interface EngineConfig {
  mode: "local" | "remote";
  /** URL `wss://` del motor remoto, si se configuró. */
  url: string | null;
  /** Hay un token guardado (nunca se devuelve su valor). */
  tokenConfigured: boolean;
}

/** Entrada para cambiar de motor; `token` omitido conserva el guardado. */
export type EngineConfigInput = { mode: "local" } | { mode: "remote"; url: string; token?: string | undefined };

/** Resultado de cambiar de motor. Si es `ok`, la app se reinicia para aplicar el cambio. */
export type EngineConfigResult =
  | { ok: true }
  | { ok: false; error: "invalid_url" | "invalid_token" | "token_required" | "encryption_unavailable" };

/** API que el preload de Electron expone como `window.fabrica`. */
export interface FabricaBridge {
  engine: {
    getConnection(): Promise<EngineConnection | null>;
    /** Motor elegido (local por defecto). */
    getConfig(): Promise<EngineConfig>;
    /** Cambia de motor; la app se reinicia si sale bien. */
    setConfig(input: EngineConfigInput): Promise<EngineConfigResult>;
  };
  apiKey: {
    set(key: string): Promise<ApiKeyResult>;
    status(): Promise<{ configured: boolean }>;
    clear(): Promise<void>;
  };
  workspace: {
    /** Abre el selector de carpeta; devuelve la ruta elegida o null si se canceló (siempre null con motor remoto). */
    choose(): Promise<string | null>;
    /** Carpeta guardada, si hay. */
    current(): Promise<string | null>;
  };
  onEngineExit(cb: (code: number) => void): () => void;
}

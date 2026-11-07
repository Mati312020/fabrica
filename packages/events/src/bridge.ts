/** Datos para conectarse al WebSocket del motor. */
export interface EngineConnection {
  url: string;
  token: string;
}

/** Resultado de guardar la API key. La key nunca vuelve a la UI. */
export type ApiKeyResult =
  | { ok: true }
  | { ok: false; error: "invalid_format" | "encryption_unavailable" | "engine_unavailable" };

/** API que el preload de Electron expone como `window.fabrica`. */
export interface FabricaBridge {
  engine: { getConnection(): Promise<EngineConnection | null> };
  apiKey: {
    set(key: string): Promise<ApiKeyResult>;
    status(): Promise<{ configured: boolean }>;
    clear(): Promise<void>;
  };
  workspace: {
    /** Abre el selector de carpeta; devuelve la ruta elegida o null si se canceló. */
    choose(): Promise<string | null>;
    /** Carpeta guardada, si hay. */
    current(): Promise<string | null>;
  };
  onEngineExit(cb: (code: number) => void): () => void;
}

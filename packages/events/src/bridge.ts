/** Datos para conectarse al WebSocket del motor. */
export interface EngineConnection {
  url: string;
  token: string;
}

/** Resultado de guardar la API key. La key nunca vuelve a la UI. */
export type ApiKeyResult =
  | { ok: true }
  | { ok: false; error: "invalid_format" | "encryption_unavailable" | "engine_unavailable" };

/** API que el preload de Electron expone como `window.alfa`. */
export interface AlfaBridge {
  engine: { getConnection(): Promise<EngineConnection | null> };
  apiKey: {
    set(key: string): Promise<ApiKeyResult>;
    status(): Promise<{ configured: boolean }>;
    clear(): Promise<void>;
  };
  onEngineExit(cb: (code: number) => void): () => void;
}

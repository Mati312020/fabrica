/** Estado en memoria del motor. La API key nunca sale de acá. */
export interface EngineState {
  paused: boolean;
  workspace: string | null;
  /** Commit por bloque: `null` = sin elegir (se activa solo si la carpeta ya es un repo git). */
  commitPerBlock: boolean | null;
  readonly hasApiKey: () => boolean;
  /** Solo para el proveedor del SDK, dentro del proceso del motor. */
  readonly apiKey: () => string;
  setApiKey(key: string): void;
}

/** Crea el estado inicial: sin key, sin carpeta y sin pausa. */
export function createState(): EngineState {
  let apiKey = "";
  return {
    paused: false,
    workspace: null,
    commitPerBlock: null,
    hasApiKey: () => apiKey.length > 0,
    apiKey: () => apiKey,
    setApiKey(key) {
      apiKey = key;
    },
  };
}

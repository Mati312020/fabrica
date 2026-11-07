/** Estado en memoria del motor. La API key nunca sale de acá. */
export interface EngineState {
  paused: boolean;
  readonly hasApiKey: () => boolean;
  setApiKey(key: string): void;
}

/** Crea el estado inicial: sin key y sin pausa. */
export function createState(): EngineState {
  let apiKey = "";
  const state: EngineState = {
    paused: false,
    hasApiKey: () => apiKey.length > 0,
    setApiKey(key) {
      apiKey = key;
    },
  };
  return state;
}

import {
  PROTOCOL_VERSION,
  eventSchema,
  type CommandOf,
  type CommandType,
  type AlfaEvent,
  type EngineConnection,
} from "@alfa/events";

/** Estado de la conexión con el motor. */
export type ConnectionStatus = "conectando" | "conectado" | "desconectado";

/** Callbacks que necesita el cliente. */
export interface ClientHandlers {
  resolve(): Promise<EngineConnection | null>;
  onEvent(event: AlfaEvent): void;
  onStatus(status: ConnectionStatus): void;
}

/** Cliente WebSocket con reconexión. */
export interface EngineClient {
  /** Envía un comando; devuelve false si no hay conexión autenticada. */
  send<T extends CommandType>(type: T, data: CommandOf<T>["data"]): boolean;
  stop(): void;
}

const BACKOFF_MIN_MS = 1000;
const BACKOFF_MAX_MS = 10000;

const stamp = (type: string, data: unknown) =>
  JSON.stringify({ type, at: new Date().toISOString(), data });

function parseEvent(raw: unknown): AlfaEvent | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = eventSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Crea el cliente: manda `hello`, valida cada evento con zod y reconecta con backoff (1 s a 10 s).
 * @param handlers Resolución de la conexión y callbacks de eventos y estado.
 */
export function createEngineClient(handlers: ClientHandlers): EngineClient {
  let socket: WebSocket | null = null;
  let ready = false;
  let attempt = 0;
  let stopped = false;
  let timer: number | undefined;

  const retry = () => {
    if (stopped) return;
    handlers.onStatus("desconectado");
    const delay = Math.min(BACKOFF_MIN_MS * 2 ** attempt, BACKOFF_MAX_MS);
    attempt += 1;
    timer = window.setTimeout(() => void connect(), delay);
  };

  const connect = async () => {
    handlers.onStatus("conectando");
    const info = await handlers.resolve().catch(() => null);
    if (stopped) return;
    if (!info) return retry();
    const ws = new WebSocket(info.url);
    socket = ws;
    ws.onopen = () => ws.send(stamp("hello", { token: info.token, protocol: PROTOCOL_VERSION }));
    ws.onmessage = (message) => {
      const event = parseEvent(message.data);
      if (!event) return;
      if (event.type === "engine.ready") {
        ready = true;
        attempt = 0;
        handlers.onStatus("conectado");
      }
      handlers.onEvent(event);
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      ready = false;
      retry();
    };
  };

  void connect();

  return {
    send(type, data) {
      if (!socket || !ready) return false;
      socket.send(stamp(type, data));
      return true;
    },
    stop() {
      stopped = true;
      window.clearTimeout(timer);
      socket?.close();
      socket = null;
    },
  };
}

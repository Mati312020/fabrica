import type { EventOf, EventType } from "@alfa/events";
import type { WebSocket } from "ws";

/** Distribuye eventos a los clientes autenticados. */
export interface EventBus {
  add(socket: WebSocket): void;
  remove(socket: WebSocket): void;
  /** Arma `{type, at, data}` y lo envía a todos los clientes autenticados. */
  emit<T extends EventType>(type: T, data: EventOf<T>["data"]): void;
  /** Envía un evento solo a un cliente. */
  emitTo<T extends EventType>(socket: WebSocket, type: T, data: EventOf<T>["data"]): void;
}

/** Crea un bus vacío. */
export function createBus(): EventBus {
  const clients = new Set<WebSocket>();
  const serialize = (type: string, data: unknown) =>
    JSON.stringify({ type, at: new Date().toISOString(), data });
  return {
    add: (socket) => void clients.add(socket),
    remove: (socket) => void clients.delete(socket),
    emit(type, data) {
      const payload = serialize(type, data);
      for (const client of clients) client.send(payload);
    },
    emitTo(socket, type, data) {
      socket.send(serialize(type, data));
    },
  };
}

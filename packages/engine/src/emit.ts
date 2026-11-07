import type { EventOf, EventType } from "@fabrica/events";

/** Función que publica un evento del motor hacia la UI. */
export type Emit = <T extends EventType>(type: T, data: EventOf<T>["data"]) => void;

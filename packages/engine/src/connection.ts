import { CLOSE_UNAUTHORIZED, PROTOCOL_VERSION, commandSchema } from "@fabrica/events";
import type { WebSocket } from "ws";
import { tokenMatches } from "./auth.js";
import type { EventBus } from "./bus.js";
import type { Controller } from "./run/controller.js";
import { ENGINE_VERSION } from "./version.js";

const HELLO_TIMEOUT_MS = 3000;

/** Dependencias compartidas por todas las conexiones. */
export interface ConnectionDeps {
  token: string;
  bus: EventBus;
  controller: Controller;
}

function parseCommand(raw: unknown, isBinary: boolean) {
  if (isBinary || !(raw instanceof Buffer)) return null;
  try {
    const parsed = commandSchema.safeParse(JSON.parse(raw.toString("utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Gobierna una conexión: exige `hello` con token en 3 s y después despacha comandos.
 * @param socket Socket recién aceptado.
 * @param deps Token esperado, bus y controlador.
 */
export function attachConnection(socket: WebSocket, deps: ConnectionDeps): void {
  const { token, bus, controller } = deps;
  let authenticated = false;
  const timer = setTimeout(() => socket.close(CLOSE_UNAUTHORIZED, "hello timeout"), HELLO_TIMEOUT_MS);

  socket.on("message", (raw, isBinary) => {
    const command = parseCommand(raw, isBinary);
    if (!authenticated) {
      const valid =
        command?.type === "hello" &&
        command.data.protocol === PROTOCOL_VERSION &&
        tokenMatches(token, command.data.token);
      if (!valid) return socket.close(CLOSE_UNAUTHORIZED, "unauthorized");
      authenticated = true;
      clearTimeout(timer);
      bus.add(socket);
      bus.emitTo(socket, "engine.ready", { version: ENGINE_VERSION, protocol: PROTOCOL_VERSION });
      return controller.emitStatus();
    }
    if (!command) {
      return bus.emitTo(socket, "engine.error", { code: "bad_command", message: "Comando inválido" });
    }
    controller.handle(command);
  });

  socket.on("close", () => {
    clearTimeout(timer);
    bus.remove(socket);
  });
}

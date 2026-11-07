import type { FabricaCommand } from "@fabrica/events";
import type { EventBus } from "./bus.js";
import type { EngineState } from "./state.js";
import type { WebSocket } from "ws";

/** Contexto de ejecución de un comando. */
export interface CommandContext {
  bus: EventBus;
  state: EngineState;
  socket: WebSocket;
}

/** Versión que el motor informa en `engine.ready`. */
export const ENGINE_VERSION = "0.0.0";

const CONNECTED_TEXT =
  "Motor conectado. Todavía no hay agentes: llegan en la Fase 1, así que por ahora no hay nadie que te responda.";

/** Emite el estado actual a todos los clientes. */
export function emitStatus(bus: EventBus, state: EngineState): void {
  bus.emit("engine.status", { apiKeyConfigured: state.hasApiKey(), paused: state.paused });
}

/**
 * Ejecuta un comando ya validado y autenticado.
 * @param command Comando UI -> motor.
 * @param ctx Bus, estado y socket que envió el comando.
 */
export function handleCommand(command: FabricaCommand, ctx: CommandContext): void {
  const { bus, state, socket } = ctx;
  switch (command.type) {
    case "chat.send":
      bus.emit("chat.message", { rol: "usuario", texto: command.data.texto });
      bus.emit("chat.message", { rol: "sistema", texto: CONNECTED_TEXT });
      return;
    case "run.pause":
    case "run.resume":
      state.paused = command.type === "run.pause";
      emitStatus(bus, state);
      return;
    case "hello":
      bus.emitTo(socket, "engine.error", { code: "bad_command", message: "hello ya fue enviado" });
      return;
    default:
      bus.emitTo(socket, "engine.error", {
        code: "not_implemented",
        message: `${command.type} llega en una fase posterior`,
      });
  }
}

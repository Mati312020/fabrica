import type { z } from "zod";
import type { AGENT_STATES, CHAT_ROLES, MODELS } from "./constants.js";
import type { commandSchema } from "./commands.js";
import type { eventSchema } from "./events.js";

/** Evento motor -> UI. */
export type FabricaEvent = z.infer<typeof eventSchema>;
/** Comando UI -> motor. */
export type FabricaCommand = z.infer<typeof commandSchema>;
/** Nombre de cualquier comando. */
export type CommandType = FabricaCommand["type"];
/** Comando filtrado por nombre. */
export type CommandOf<T extends CommandType> = Extract<FabricaCommand, { type: T }>;
/** Nombre de cualquier evento. */
export type EventType = FabricaEvent["type"];
/** Evento filtrado por nombre. */
export type EventOf<T extends EventType> = Extract<FabricaEvent, { type: T }>;
/** Estado de un agente. */
export type AgentState = (typeof AGENT_STATES)[number];
/** Modelo de un agente. */
export type ModelName = (typeof MODELS)[number];
/** Rol de un mensaje de chat. */
export type ChatRole = (typeof CHAT_ROLES)[number];

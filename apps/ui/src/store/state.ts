import type { AgentState, ChatRole, ModelName } from "@alfa/events";

/** Mensaje de chat tal como lo emitió el motor. */
export interface ChatMessage {
  id: number;
  rol: ChatRole;
  texto: string;
}

/** Línea del registro de sesión: un evento recibido. */
export interface LogEntry {
  id: number;
  time: string;
  type: string;
  summary: string;
}

/** Agente conocido por los eventos `agent.*`. */
export interface AgentInfo {
  modelo: ModelName;
  estado: AgentState;
}

/** Estado de dominio: se construye solo con `applyEvent`. */
export interface DomainState {
  seq: number;
  engine: { version: string; protocol: number } | null;
  apiKeyConfigured: boolean;
  paused: boolean;
  messages: ChatMessage[];
  log: LogEntry[];
  agents: Record<string, AgentInfo>;
  budget: { usado: number; limite: number } | null;
}

/** Estado antes de recibir cualquier evento. */
export const initialState: DomainState = {
  seq: 0,
  engine: null,
  apiKeyConfigured: false,
  paused: false,
  messages: [],
  log: [],
  agents: {},
  budget: null,
};

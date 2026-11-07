/** Versión del protocolo WebSocket UI <-> motor. Debe coincidir en el `hello`. */
export const PROTOCOL_VERSION = 1;

/** Código de cierre cuando falla la autenticación del `hello`. */
export const CLOSE_UNAUTHORIZED = 4401;

/** Modelos de agente (colores y chips del diseño). */
export const MODELS = ["opus", "sonnet", "haiku"] as const;

/** Estados de agente; `dormido` sale del tablero 04 del diseño. */
export const AGENT_STATES = [
  "esperando",
  "pensando",
  "trabajando",
  "en_auditoria",
  "terminado",
  "error",
  "pausado",
  "dormido",
] as const;

/** Roles de un mensaje de chat. */
export const CHAT_ROLES = ["usuario", "orquestador", "sistema"] as const;

/** Tipos de bloque del plan: los visuales los aprueba el usuario. */
export const BLOCK_KINDS = ["visual", "tecnico"] as const;

/** Decisiones posibles cuando una tarea quedó bloqueada (`run.answer`). */
export const RUN_DECISIONS = ["reintentar", "cancelar"] as const;

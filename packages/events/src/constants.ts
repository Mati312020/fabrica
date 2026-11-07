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

/** Tipos de rama del diagrama. */
export const BRANCH_KINDS = ["planificacion", "codificacion", "investigacion"] as const;

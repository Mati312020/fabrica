import type { AgentState, BlockKind, ChatRole, ModelName } from "@fabrica/events";

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

/** Herramienta en uso por un agente. */
export interface ToolUse {
  nombre: string;
  detalle: string;
}

/** Agente conocido por los eventos `agent.*` (los tokens y costos son acumulados). */
export interface AgentInfo {
  id: string;
  rama: string;
  modelo: ModelName;
  estado: AgentState;
  /** Orden de aparición, para apilar los nodos. */
  order: number;
  pct: number | null;
  herramienta: ToolUse | null;
  tarea: string | null;
  taskId: string | null;
  entrada: number;
  salida: number;
  costo: number;
  texto: string;
  errores: number;
  escalado: boolean;
  escaladoDesde: ModelName | null;
  /** Fecha ISO del primer estado distinto de "esperando". */
  startedAt: string | null;
  /** Fecha ISO del último evento del agente. */
  lastAt: string;
}

/** Rama creada por el motor. */
export interface BranchInfo {
  id: string;
  tipo: string;
  nombre: string;
}

/** Tarea asignada por el orquestador a un agente. */
export interface TaskInfo {
  taskId: string;
  de: string;
  a: string;
  resumen: string;
  estado: "asignada" | "en_auditoria" | "ok" | "rechazada";
  rechazos: number;
}

/** Bloque del plan con su avance. */
export interface BlockInfo {
  id: string;
  nombre: string;
  tipo: BlockKind;
  dependeDe: string[];
  familia: string;
  pct: number;
  estado: "propuesto" | "pendiente" | "construyendo" | "aprobacion" | "ensamblado";
  archivos: string[];
  previewUrl: string;
  /** Número de evento del último pedido de aprobación (identifica la tarjeta). */
  approvalSeq: number;
  /** Número de evento en que se ensambló. */
  assembledSeq: number;
}

/** Plan pendiente o vigente. */
export interface PlanInfo {
  planId: string;
  bloques: Pick<BlockInfo, "id" | "nombre" | "dependeDe" | "familia" | "tipo">[];
  aprobado: boolean;
}

/** Tarea que el motor no pudo resolver; espera `run.answer`. */
export interface BlockedTask {
  seq: number;
  taskId: string;
  motivo: string;
}

/** Veredicto de una auditoría. */
export interface Verdict {
  seq: number;
  taskId: string;
  agentId: string;
  ok: boolean;
  motivo: string;
}

/** Color de un cable encendido. */
export type FxColor = ModelName | "ok" | "err";

/** Último encendido de un cable: `seq` cambia con cada evento y reinicia la animación. */
export interface EdgeFx {
  seq: number;
  color: FxColor;
  /** Segmento dentro del recorrido (0 primero): retrasa la mecha. */
  step: number;
}

/** Fase del presupuesto según los avisos del motor. */
export type BudgetPhase = "normal" | "aviso" | "pausa";

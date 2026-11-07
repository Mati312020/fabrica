import type { ModelName } from "@fabrica/events";
import type { z } from "zod";

/** Roles de agente que el motor sabe ejecutar. */
export type RoleName = "orquestador" | "investigacion" | "planificacion" | "codificacion" | "auditoria";

/** Pedido de una corrida de rol. No lleva la API key: vive solo dentro del proveedor. */
export interface RoleRequest {
  role: RoleName;
  model: ModelName;
  system: string;
  prompt: string;
  /** Herramientas integradas permitidas (nunca Bash). */
  tools: readonly string[];
  /** Esquema de la salida estructurada. */
  schema: z.ZodType;
  /** Carpeta del proyecto: todo acceso a archivos queda confinado acá. */
  cwd: string;
  /** Lo que queda del presupuesto, en US$. */
  maxBudgetUsd: number;
  agentId: string;
  taskId: string;
  /** Número de intento de la tarea, desde 1. */
  attempt: number;
}

/** Lo que un proveedor informa mientras corre un rol. */
export type ProviderEvent =
  | { kind: "tool"; name: string; detail: string }
  | { kind: "text"; delta: string }
  | { kind: "result"; output: unknown; costUsd: number; inputTokens: number; outputTokens: number }
  | { kind: "error"; code: string; message: string; costUsd?: number };

/** Fuente de respuestas de modelo: el SDK real o un guion de tests. */
export interface ModelProvider {
  run(req: RoleRequest, signal: AbortSignal): AsyncIterable<ProviderEvent>;
}

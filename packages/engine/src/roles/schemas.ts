import { z } from "zod";
import { BLOCK_KINDS } from "@fabrica/events";

/** Salida del orquestador. */
export const orchestratorOut = z.object({
  respuesta: z.string(),
  ramas: z.array(z.object({ tipo: z.string().min(1), nombre: z.string().min(1) })),
  investigaciones: z.array(z.object({ resumen: z.string().min(1) })),
  pedirPlan: z.boolean(),
});

/** Salida de investigación. */
export const researchOut = z.object({ hallazgos: z.string().min(1), fuentes: z.array(z.string()) });

/** Bloque de un plan. */
export const planBlockOut = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(BLOCK_KINDS),
  dependeDe: z.array(z.string()),
  familia: z.string().min(1),
  descripcion: z.string(),
});

/** Salida de planificación. */
export const planOut = z.object({ resumen: z.string(), bloques: z.array(planBlockOut).min(1) });

/** Acciones permitidas en un recorrido de navegador. */
export const STEP_ACTIONS = ["ir", "click", "escribir", "esperar", "verificarTexto"] as const;

/** Paso de un recorrido: cómo usaría un cliente lo construido. Lo ejecuta el motor, no el modelo. */
export const stepOut = z.object({
  accion: z.enum(STEP_ACTIONS),
  selector: z.string().optional(),
  valor: z.string().optional(),
});

/** Máximo de pasos de un recorrido. */
export const MAX_PASOS = 15;

/** Salida de codificación; los bloques visuales suman un `recorrido`. */
export const codeOut = z.object({
  resumen: z.string(),
  archivos: z.array(z.string()),
  recorrido: z.array(stepOut).max(MAX_PASOS).optional(),
});

/** Aprendizaje reutilizable que propone el auditor (se valida en el motor antes de guardarlo). */
export const learningOut = z.object({ titulo: z.string(), contenido: z.string(), etiquetas: z.array(z.string()) });

/** Salida de auditoría. `aprendizajes` solo cuenta cuando `ok` es true (máximo 3). */
export const auditOut = z.object({
  ok: z.boolean(),
  motivo: z.string(),
  sugerencia: z.string(),
  aprendizajes: z.array(learningOut).optional(),
});

export type OrchestratorOut = z.infer<typeof orchestratorOut>;
export type ResearchOut = z.infer<typeof researchOut>;
export type PlanOut = z.infer<typeof planOut>;
export type PlanBlock = z.infer<typeof planBlockOut>;
export type Step = z.infer<typeof stepOut>;
export type CodeOut = z.infer<typeof codeOut>;
export type AuditOut = z.infer<typeof auditOut>;

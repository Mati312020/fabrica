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

/** Salida de codificación. */
export const codeOut = z.object({ resumen: z.string(), archivos: z.array(z.string()) });

/** Salida de auditoría. */
export const auditOut = z.object({ ok: z.boolean(), motivo: z.string(), sugerencia: z.string() });

export type OrchestratorOut = z.infer<typeof orchestratorOut>;
export type ResearchOut = z.infer<typeof researchOut>;
export type PlanOut = z.infer<typeof planOut>;
export type PlanBlock = z.infer<typeof planBlockOut>;
export type CodeOut = z.infer<typeof codeOut>;
export type AuditOut = z.infer<typeof auditOut>;

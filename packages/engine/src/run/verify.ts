import type { CodeOut } from "../roles/schemas.js";
import { auditTask, type AuditVerdict } from "./audit.js";
import { browserAudit } from "./browserAudit.js";
import type { Ctx } from "./context.js";
import type { TaskSpec } from "./task.js";

/**
 * Verifica la salida de una tarea: auditoría de código y, en bloques visuales con `recorrido`,
 * una segunda auditoría con el informe del recorrido en el navegador.
 * @param ctx Contexto de la corrida.
 * @param spec Tarea.
 * @param output Salida ya validada contra el esquema.
 * @param agent Agente que la produjo.
 */
export async function verify(ctx: Ctx, spec: TaskSpec, output: unknown, agent: string): Promise<AuditVerdict> {
  const code = await auditTask(ctx, spec.id, spec.resumen, output, agent);
  if (!code.ok || code.fatal !== undefined || !spec.visual) return code;
  return browserAudit(ctx, spec, output as CodeOut, agent, code);
}

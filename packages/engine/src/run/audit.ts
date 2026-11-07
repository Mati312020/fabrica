import { ROLES } from "../roles/roles.js";
import type { AuditOut } from "../roles/schemas.js";
import { ensureCore } from "./branches.js";
import type { Ctx } from "./context.js";
import { execRole } from "./exec.js";

const MAX_OUTPUT_CHARS = 6000;

/** Veredicto de una auditoría; `fatal` si el auditor mismo no pudo responder. */
export type AuditVerdict = { ok: boolean; motivo: string; fatal?: string };

/**
 * Audita el resultado de una tarea con un auditor del pool (máximo 2 a la vez).
 * Emite `task.toAudit` y `audit.result`.
 * @param ctx Contexto de la corrida.
 * @param taskId Tarea auditada.
 * @param resumen Qué se le pidió al agente.
 * @param output Resultado ya validado.
 */
export async function auditTask(ctx: Ctx, taskId: string, resumen: string, output: unknown): Promise<AuditVerdict> {
  const slot = await ctx.auditors.acquire();
  try {
    let auditor = ctx.auditorIds.get(slot);
    if (!auditor) {
      auditor = ctx.agents.spawn(ensureCore(ctx, "auditoria"), "opus");
      ctx.auditorIds.set(slot, auditor);
    }
    ctx.emit("task.toAudit", { taskId, auditorId: auditor });
    const prompt = `Tarea pedida:\n${resumen}\n\nResultado a auditar:\n${JSON.stringify(output).slice(0, MAX_OUTPUT_CHARS)}`;
    const role = ROLES.auditoria;
    const out = await execRole(ctx, auditor, {
      role: "auditoria", model: role.model, system: role.system, prompt, tools: role.tools,
      schema: role.schema, cwd: ctx.state.workspace ?? "", agentId: auditor, taskId, attempt: 1,
    });
    ctx.agents.status(auditor, out.ok ? "esperando" : "error");
    if (!out.ok) return { ok: false, motivo: out.message, fatal: out.message };
    const verdict = out.data as AuditOut;
    const motivo = verdict.ok || !verdict.sugerencia ? verdict.motivo : `${verdict.motivo} Sugerencia: ${verdict.sugerencia}`;
    ctx.emit("audit.result", { taskId, ok: verdict.ok, motivo });
    return { ok: verdict.ok, motivo };
  } finally {
    ctx.auditors.release(slot);
  }
}

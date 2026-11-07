import type { ModelName } from "@fabrica/events";
import { ROLES, nextModel } from "../roles/roles.js";
import type { RoleName } from "../provider/types.js";
import { auditTask } from "./audit.js";
import type { Ctx } from "./context.js";
import { escalate } from "./escalate.js";
import { execRole } from "./exec.js";

/** Rechazos seguidos del mismo modelo antes de escalar. */
export const MAX_RECHAZOS = 3;

/** Una tarea de rama: un rol, un prompt y, opcionalmente, una validación propia del motor. */
export interface TaskSpec {
  id: string;
  rama: string;
  role: Exclude<RoleName, "orquestador" | "auditoria">;
  model: ModelName;
  resumen: string;
  blockId?: string;
  /** Arma el prompt a partir de los motivos de rechazo acumulados. */
  build(motivos: string[]): string;
  /** Validación del motor sobre la salida; devuelve el motivo de rechazo o null. */
  check?(output: unknown): string | null;
  /** Motivos previos (por ejemplo, el comentario del usuario). */
  motivos?: string[];
}

/** Resultado final de una tarea. */
export type TaskResult = { status: "ok"; output: unknown } | { status: "cancelled" | "failed" };

/**
 * Ciclo de vida completo de una tarea (§6.1): asignar, correr, validar, auditar,
 * reintentar con el motivo y escalar de modelo a los 3 rechazos.
 * @param ctx Contexto de la corrida.
 * @param spec Tarea a ejecutar.
 */
export async function runTask(ctx: Ctx, spec: TaskSpec): Promise<TaskResult> {
  const def = ROLES[spec.role];
  let model = spec.model;
  let agent = ctx.agents.spawn(spec.rama, model);
  const motivos = [...(spec.motivos ?? [])];
  let rechazos = 0;
  const progress = (pct: number) => {
    ctx.emit("agent.progress", { id: agent, pct });
    if (spec.blockId) ctx.emit("block.progress", { blockId: spec.blockId, pct });
  };
  for (let attempt = 1; ; attempt++) {
    ctx.emit("task.assigned", {
      taskId: spec.id, de: "orquestador", a: agent, resumen: spec.resumen,
      ...(spec.blockId ? { blockId: spec.blockId } : {}),
    });
    progress(10);
    const prompt = spec.build(rechazos === 0 ? motivos : motivos.slice(-1));
    const out = await execRole(ctx, agent, {
      role: spec.role, model, system: def.system, prompt, tools: def.tools, schema: def.schema,
      cwd: ctx.state.workspace ?? "", agentId: agent, taskId: spec.id, attempt,
    });
    if (!out.ok && !out.invalid) return fail(ctx, agent, out.message);
    let motivo = out.ok ? (spec.check?.(out.data) ?? null) : `salida_invalida: ${out.message}`;
    if (out.ok && motivo === null) {
      progress(60);
      ctx.agents.status(agent, "en_auditoria");
      const verdict = await auditTask(ctx, spec.id, spec.resumen, out.data);
      if (verdict.fatal !== undefined) return fail(ctx, agent, verdict.fatal);
      if (verdict.ok) {
        ctx.agents.status(agent, "terminado");
        progress(90);
        return { status: "ok", output: out.data };
      }
      motivo = verdict.motivo;
    } else if (motivo !== null) {
      ctx.emit("audit.result", { taskId: spec.id, ok: false, motivo });
    }
    motivos.push(motivo ?? "rechazada");
    ctx.agents.status(agent, "error");
    if (++rechazos < MAX_RECHAZOS) continue;
    const next = nextModel(model);
    const outcome = await escalate(ctx, spec, { model, next, agent, motivo: motivos.at(-1) ?? "" });
    if (outcome === "cancelled") return { status: "cancelled" };
    if (next) {
      model = next;
      agent = outcome;
    }
    rechazos = 0;
  }
}

function fail(ctx: Ctx, agent: string, message: string): TaskResult {
  ctx.agents.status(agent, "error");
  ctx.emit("engine.error", { code: "provider_error", message });
  ctx.say("sistema", `Un agente falló y la tarea se detuvo: ${message}`);
  return { status: "failed" };
}

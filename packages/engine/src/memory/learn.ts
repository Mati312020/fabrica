import path from "node:path";
import type { Ctx } from "../run/context.js";
import { emitMemory } from "./sync.js";
import { LIMITS, validateLearning, type Learning } from "./validate.js";

/** Quién produjo el trabajo auditado. */
export interface LearningSource {
  taskId: string;
  agent: string;
}

/**
 * Guarda los aprendizajes de una auditoría APROBADA (máximo 3). Los que no pasan la validación
 * se descartan en silencio y quedan en `engine.error` con `memory_rejected`, sin repetir el contenido.
 * @param ctx Contexto de la corrida.
 * @param source Tarea y agente de origen.
 * @param items Propuestas del auditor.
 */
export function learn(ctx: Ctx, source: LearningSource, items: Learning[] | undefined): void {
  const repo = ctx.memory.repo();
  if (!repo || !items?.length) return;
  const proyecto = ctx.state.workspace ? path.basename(ctx.state.workspace) : "";
  let saved = false;
  for (const item of items.slice(0, LIMITS.porAuditoria)) {
    const check = validateLearning(item);
    if (!check.ok) {
      ctx.emit("engine.error", { code: "memory_rejected", message: `Recuerdo rechazado (${check.reason}) en la tarea ${source.taskId}` });
      continue;
    }
    const { id } = repo.save({ ...check.value, proyecto, agente: source.agent, tarea: source.taskId });
    ctx.emit("memory.saved", { id, titulo: check.value.titulo });
    saved = true;
  }
  if (saved) emitMemory(ctx);
}

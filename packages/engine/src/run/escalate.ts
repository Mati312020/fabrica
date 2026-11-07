import type { ModelName } from "@fabrica/events";
import type { Ctx } from "./context.js";
import type { TaskSpec } from "./task.js";

interface Situation {
  model: ModelName;
  next: ModelName | null;
  agent: string;
  motivo: string;
}

/**
 * Se agotaron los rechazos de un modelo. Si hay un modelo superior, lo escala (agente nuevo que
 * rehace la tarea desde cero) y devuelve el id del agente nuevo. Si no, bloquea la tarea y espera
 * la decisión del usuario: `reintentar` devuelve el mismo agente, `cancelar` devuelve "cancelled".
 */
export async function escalate(ctx: Ctx, spec: TaskSpec, s: Situation): Promise<string> {
  if (s.next) {
    ctx.emit("task.escalated", { taskId: spec.id, modeloAnterior: s.model, modeloNuevo: s.next });
    return ctx.agents.spawn(spec.rama, s.next, s.model);
  }
  ctx.emit("task.blocked", { taskId: spec.id, motivo: s.motivo });
  ctx.say("sistema", `Opus rechazó 3 veces la tarea "${spec.resumen}". ¿Reintento o cancelo?`);
  const decision = await new Promise<unknown>((resolve) => ctx.decisions.set(spec.id, resolve));
  return decision === "reintentar" ? s.agent : "cancelled";
}

import type { PlanBlock, PlanOut } from "../roles/schemas.js";
import { ensureCore } from "./branches.js";
import type { Ctx } from "./context.js";
import { runTask } from "./task.js";

/**
 * Validación del motor sobre un plan: ids únicos, dependencias existentes y sin ciclos.
 * @returns El motivo de rechazo, o null si el plan es válido.
 */
export function validatePlan(plan: PlanOut): string | null {
  const ids = new Set<string>();
  for (const b of plan.bloques) {
    if (ids.has(b.id)) return `ids_repetidos: el bloque "${b.id}" aparece más de una vez`;
    ids.add(b.id);
  }
  for (const b of plan.bloques) {
    const missing = b.dependeDe.find((d) => !ids.has(d) || d === b.id);
    if (missing !== undefined) return `dependencia_invalida: "${b.id}" depende de "${missing}"`;
  }
  const pending = new Map(plan.bloques.map((b) => [b.id, new Set(b.dependeDe)]));
  for (let progress = true; progress && pending.size > 0; ) {
    progress = false;
    for (const [id, deps] of pending) {
      if (deps.size > 0) continue;
      pending.delete(id);
      for (const other of pending.values()) other.delete(id);
      progress = true;
    }
  }
  return pending.size > 0 ? `ciclo_de_dependencias: ${[...pending.keys()].join(", ")}` : null;
}

function buildPrompt(ctx: Ctx, previous: PlanBlock[] | null, motivos: string[]): string {
  const parts = ["Pedido del usuario:", ...ctx.userMessages.slice(-5).map((m) => `- ${m}`)];
  if (ctx.findings.length) parts.push("Hallazgos aprobados:", ...ctx.findings.map((f) => `- ${f}`));
  if (previous) parts.push(`Plan anterior (bloques): ${previous.map((b) => b.nombre).join(", ")}`);
  if (motivos.length) parts.push("Motivos de rechazo previos:", ...motivos.map((m) => `- ${m}`));
  return parts.join("\n");
}

/**
 * Corre la tarea de planificación y, si la auditoría la aprueba, emite `plan.ready`.
 * @param ctx Contexto de la corrida.
 * @param previous Plan rechazado por el usuario, si es una replanificación.
 * @param comentario Comentario del usuario al rechazar.
 */
export async function planFlow(ctx: Ctx, previous: PlanBlock[] | null = null, comentario = ""): Promise<void> {
  const rama = ensureCore(ctx, "planificacion");
  const result = await runTask(ctx, {
    id: ctx.nextId("plan-task"), rama, role: "planificacion", model: "opus",
    resumen: comentario ? "Replanificar con el comentario del usuario" : "Armar el plan de bloques",
    motivos: comentario ? [`El usuario rechazó el plan: ${comentario}`] : [],
    build: (motivos) => buildPrompt(ctx, previous, motivos),
    check: (output) => validatePlan(output as PlanOut),
  });
  if (result.status !== "ok") return;
  const data = result.output as PlanOut;
  const id = ctx.nextId("plan");
  ctx.pendingPlan = { id, data };
  ctx.emit("plan.ready", {
    planId: id,
    bloques: data.bloques.map(({ id: b, nombre, tipo, dependeDe, familia }) => ({ id: b, nombre, tipo, dependeDe, familia })),
  });
  ctx.say("orquestador", `El plan está listo y auditado: ${data.resumen} Revisalo y aprobalo para empezar a codificar.`);
}

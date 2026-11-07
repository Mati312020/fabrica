import { codePlan } from "./coding.js";
import type { Ctx } from "./context.js";
import { planFlow } from "./plan.js";

type Background = (job: Promise<void>) => void;

/**
 * Aprueba el plan pendiente y lanza la codificación.
 * @param ctx Contexto de la corrida.
 * @param planId Plan que la persona aprobó.
 * @param background Ejecutor en segundo plano.
 */
export function approvePlan(ctx: Ctx, planId: string, background: Background): void {
  if (ctx.pendingPlan?.id !== planId) return;
  const { data } = ctx.pendingPlan;
  ctx.pendingPlan = null;
  background(codePlan(ctx, data));
}

/**
 * Rechaza el plan pendiente y replanifica con el comentario.
 * @param ctx Contexto de la corrida.
 * @param planId Plan rechazado.
 * @param comentario Qué hay que cambiar.
 * @param background Ejecutor en segundo plano.
 */
export function rejectPlan(ctx: Ctx, planId: string, comentario: string, background: Background): void {
  if (ctx.pendingPlan?.id !== planId) return;
  const { data } = ctx.pendingPlan;
  ctx.pendingPlan = null;
  background(planFlow(ctx, data.bloques, comentario));
}

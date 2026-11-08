import type { PlanOut } from "../roles/schemas.js";
import { ensureCore } from "./branches.js";
import { runBlock } from "./block.js";
import { MAX_PARALELO, type Ctx } from "./context.js";

/**
 * Ejecuta el plan aprobado: bloques listos (sin dependencias pendientes) en paralelo hasta
 * `MAX_PARALELO`, en orden de aparición. Un bloque fallido deja sin correr a sus dependientes.
 * @param ctx Contexto de la corrida.
 * @param plan Plan aprobado.
 */
export async function codePlan(ctx: Ctx, plan: PlanOut): Promise<void> {
  const rama = ensureCore(ctx, "codificacion");
  const pending = [...plan.bloques];
  const failed = new Set<string>();
  const running = new Map<string, Promise<void>>();
  while (pending.length > 0 || running.size > 0) {
    await ctx.gate.wait();
    const ready = pending.filter((b) => b.dependeDe.every((d) => ctx.done.has(d)));
    for (const block of ready.slice(0, MAX_PARALELO - running.size)) {
      pending.splice(pending.indexOf(block), 1);
      running.set(block.id, runBlock(ctx, rama, block).then((ok) => {
        running.delete(block.id);
        if (!ok) failed.add(block.id);
      }));
    }
    if (running.size === 0) break;
    await Promise.race(running.values());
  }
  const total = plan.bloques.length;
  const hechos = plan.bloques.filter((b) => ctx.done.has(b.id)).length;
  ctx.say("orquestador", hechos === total
    ? `Los ${total} bloques están ensamblados.`
    : `Quedaron ${hechos} de ${total} bloques ensamblados; ${failed.size} fallaron o se cancelaron.`);
}

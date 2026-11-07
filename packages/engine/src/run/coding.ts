import type { PlanBlock, PlanOut, CodeOut } from "../roles/schemas.js";
import { ensureCore } from "./branches.js";
import { MAX_PARALELO, type Ctx } from "./context.js";
import { runTask } from "./task.js";

type Decision = { approve: true } | { approve: false; comentario: string };

function prompt(ctx: Ctx, block: PlanBlock, motivos: string[]): string {
  const parts = [`Bloque "${block.nombre}" (${block.tipo}): ${block.descripcion}`];
  for (const dep of block.dependeDe) {
    const d = ctx.done.get(dep);
    if (d) parts.push(`Ya hecho "${dep}": ${d.resumen} Archivos: ${d.archivos.join(", ")}`);
  }
  if (motivos.length) parts.push("Motivos de rechazo previos:", ...motivos.map((m) => `- ${m}`));
  return parts.join("\n");
}

async function runBlock(ctx: Ctx, rama: string, block: PlanBlock): Promise<boolean> {
  let motivos: string[] = [];
  for (;;) {
    const result = await runTask(ctx, {
      id: ctx.nextId(`blk-${block.id}`), rama, role: "codificacion", model: "sonnet", blockId: block.id,
      resumen: `Codificar el bloque ${block.nombre}`, motivos, build: (m) => prompt(ctx, block, m),
    });
    if (result.status !== "ok") return false;
    const out = result.output as CodeOut;
    if (block.tipo === "visual") {
      ctx.emit("block.approvalRequested", { blockId: block.id, previewUrl: "", archivos: out.archivos });
      const decision = await new Promise<Decision>((resolve) => ctx.decisions.set(`block:${block.id}`, (d) => resolve(d as Decision)));
      if (!decision.approve) {
        motivos = [`El usuario rechazó el bloque: ${decision.comentario}`];
        continue;
      }
    }
    ctx.done.set(block.id, { resumen: out.resumen, archivos: out.archivos });
    ctx.emit("block.progress", { blockId: block.id, pct: 100 });
    ctx.emit("block.assembled", { blockId: block.id });
    return true;
  }
}

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

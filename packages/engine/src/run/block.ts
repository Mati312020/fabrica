import { commitBlock } from "../git/blockCommit.js";
import type { PlanBlock, CodeOut } from "../roles/schemas.js";
import type { Ctx } from "./context.js";
import { runTask } from "./task.js";

/** Marca del usuario sobre la vista previa (x, y en % del área). */
export interface Mark {
  x: number;
  y: number;
  texto: string;
}

type Decision = { approve: true } | { approve: false; comentario: string; marcas: Mark[] };

function prompt(ctx: Ctx, block: PlanBlock, motivos: string[]): string {
  const parts = [`Bloque "${block.nombre}" (${block.tipo}): ${block.descripcion}`];
  for (const dep of block.dependeDe) {
    const d = ctx.done.get(dep);
    if (d) parts.push(`Ya hecho "${dep}": ${d.resumen} Archivos: ${d.archivos.join(", ")}`);
  }
  if (block.tipo === "visual") parts.push("Es un bloque visual: devolvé también `recorrido`, los pasos con los que un cliente lo probaría.");
  if (motivos.length) parts.push("Motivos de rechazo previos:", ...motivos.map((m) => `- ${m}`));
  return parts.join("\n");
}

/**
 * Motivo de rechazo que recibe el agente: el comentario, las marcas (posición en % de la vista
 * previa) y las capturas del último recorrido, que puede abrir con Read.
 * @param comentario Comentario del usuario.
 * @param marcas Marcas sobre la vista previa.
 * @param capturas Capturas del último recorrido del bloque.
 */
export function rejectionReason(comentario: string, marcas: readonly Mark[], capturas: readonly string[] = []): string {
  const lines = [`El usuario rechazó el bloque: ${comentario}`];
  marcas.forEach((m, i) => lines.push(`  Marca ${i + 1} (x ${m.x}%, y ${m.y}%): ${m.texto}`));
  if (marcas.length && capturas.length) {
    lines.push("  Las marcas son % del área visible. Capturas por ancho (el ancho está en el nombre):", ...capturas.map((c) => `  - ${c}`));
  }
  return lines.join("\n");
}

/**
 * Codifica un bloque; si es visual espera la aprobación del usuario sobre la vista previa. Un rechazo
 * vuelve a codificar con el comentario y las marcas. Al aprobarse lo ensambla y, si corresponde, lo commitea.
 * @returns true si el bloque quedó ensamblado.
 */
export async function runBlock(ctx: Ctx, rama: string, block: PlanBlock): Promise<boolean> {
  let motivos: string[] = [];
  for (;;) {
    const result = await runTask(ctx, {
      id: ctx.nextId(`blk-${block.id}`), rama, role: "codificacion", model: "sonnet", blockId: block.id,
      visual: block.tipo === "visual", resumen: `Codificar el bloque ${block.nombre}`,
      memoryQuery: `${block.nombre} ${block.descripcion}`, motivos, build: (m) => prompt(ctx, block, m),
    });
    if (result.status !== "ok") return false;
    const out = result.output as CodeOut;
    if (block.tipo === "visual") {
      const previewUrl = ctx.state.workspace ? await ctx.preview.urlFor(ctx.state.workspace).catch(() => "") : "";
      ctx.emit("block.approvalRequested", { blockId: block.id, previewUrl, archivos: out.archivos });
      const decision = await new Promise<Decision>((resolve) => ctx.decisions.set(`block:${block.id}`, (d) => resolve(d as Decision)));
      if (!decision.approve) {
        motivos = [rejectionReason(decision.comentario, decision.marcas, ctx.captures.get(block.id))];
        continue;
      }
    }
    ctx.done.set(block.id, { resumen: out.resumen, archivos: out.archivos });
    ctx.emit("block.progress", { blockId: block.id, pct: 100 });
    ctx.emit("block.assembled", { blockId: block.id });
    await commitBlock(ctx, block, out);
    return true;
  }
}

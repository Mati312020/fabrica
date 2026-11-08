import type { PlanBlock } from "../roles/schemas.js";
import type { Ctx } from "../run/context.js";
import type { EngineState } from "../state.js";
import { commitFiles, isGitRepo } from "./commit.js";

/**
 * Indica si hay que commitear cada bloque: la opción del proyecto si se eligió una; si no,
 * activada solo cuando la carpeta ya es un repo git.
 * @param state Estado del motor.
 */
export function commitEnabled(state: Pick<EngineState, "workspace" | "commitPerBlock">): boolean {
  const { workspace, commitPerBlock } = state;
  return commitPerBlock ?? (workspace !== null && isGitRepo(workspace));
}

function oneLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * Si la opción está activa, commitea los archivos del bloque recién ensamblado y emite
 * `block.committed`. Si git falla emite `engine.error git_failed` y sigue: el bloque ya quedó ensamblado.
 * @param ctx Contexto de la corrida.
 * @param block Bloque del plan.
 * @param out Resumen y archivos que devolvió el agente.
 */
export async function commitBlock(ctx: Ctx, block: PlanBlock, out: { resumen: string; archivos: string[] }): Promise<void> {
  const dir = ctx.state.workspace;
  if (!dir || !commitEnabled(ctx.state)) return;
  try {
    const hash = await commitFiles(dir, out.archivos, `Bloque ${block.nombre}: ${oneLine(out.resumen, 120)}`);
    if (hash) ctx.emit("block.committed", { blockId: block.id, hash });
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    ctx.emit("engine.error", { code: "git_failed", message: `No se pudo commitear el bloque ${block.nombre}: ${reason}` });
  }
}

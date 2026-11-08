import type { Ctx } from "../run/context.js";
import { isGitRepo } from "./commit.js";

/**
 * Activa o apaga el commit por bloque del proyecto actual y publica el estado.
 * Activarlo en una carpeta que no es un repo git se rechaza con `engine.error git_failed`.
 * @param ctx Contexto de la corrida.
 * @param enabled Valor pedido.
 */
export function setCommitPerBlock(ctx: Ctx, enabled: boolean): void {
  const dir = ctx.state.workspace;
  if (enabled && (!dir || !isGitRepo(dir))) {
    ctx.emit("engine.error", { code: "git_failed", message: "La carpeta del proyecto no es un repositorio git: ejecutá git init para activar el commit por bloque" });
  } else {
    ctx.state.commitPerBlock = enabled;
  }
  ctx.emitStatus();
}

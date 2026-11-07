import type { Ctx } from "../run/context.js";

/**
 * Publica el listado y el conteo de la memoria tras un cambio.
 * @param ctx Contexto de la corrida.
 * @param reply Destino; por defecto todos los clientes.
 */
export function emitMemory(ctx: Ctx, reply: Ctx["emit"] = ctx.emit): void {
  const items = ctx.memory.repo()?.list() ?? [];
  reply("memory.snapshot", { items });
  if (reply === ctx.emit) ctx.emitStatus();
}

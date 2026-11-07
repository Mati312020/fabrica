import type { CommandOf } from "@fabrica/events";
import type { Emit } from "../emit.js";
import type { Ctx } from "../run/context.js";
import { emitMemory } from "./sync.js";

/** Operaciones de memoria que expone el controlador. */
export interface MemoryControl {
  read(command: CommandOf<"memory.read">, reply: Emit): void;
  remove(command: CommandOf<"memory.delete">): void;
  setPath(file: string | null): void;
  guard(): void;
}

/**
 * Comandos y configuración de la memoria persistente.
 * @param ctx Contexto de la corrida.
 */
export function memoryControl(ctx: Ctx): MemoryControl {
  const fail = (code: string, message: string) => ctx.emit("engine.error", { code, message });
  return {
    read(command, reply) {
      const item = ctx.memory.repo()?.get(command.data.id);
      if (!item) return fail("memory_not_found", "El recuerdo no existe");
      reply("memory.content", item);
    },
    remove(command) {
      const item = ctx.memory.repo()?.remove(command.data.id);
      if (!item) return fail("memory_not_found", "El recuerdo no existe");
      ctx.emit("memory.deleted", { id: item.id, titulo: item.titulo });
      emitMemory(ctx);
    },
    setPath(file) {
      ctx.memory.close();
      const problem = file ? ctx.memory.open(file, ctx.state.workspace) : null;
      if (problem) fail("memory_path", `La memoria no se abrió (${problem}): debe estar fuera de la carpeta del proyecto`);
      emitMemory(ctx);
    },
    guard() {
      if (!ctx.memory.insideWorkspace(ctx.state.workspace)) return;
      ctx.memory.close();
      fail("memory_path", "La memoria quedó dentro de la carpeta del proyecto y se cerró");
      emitMemory(ctx);
    },
  };
}

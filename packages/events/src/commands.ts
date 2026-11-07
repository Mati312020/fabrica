import { z } from "zod";
import { RUN_DECISIONS } from "./constants.js";
import { msg } from "./envelope.js";

const empty = {};

/** Comandos UI -> motor (§9) más el `hello` de autenticación. */
export const commandSchema = z.discriminatedUnion("type", [
  msg("hello", { token: z.string().min(1).max(256), protocol: z.number().int() }),
  msg("chat.send", { texto: z.string().trim().min(1).max(8000) }),
  msg("plan.approve", { planId: z.string() }),
  msg("plan.reject", { planId: z.string(), comentario: z.string().max(4000).optional() }),
  msg("block.approve", { blockId: z.string() }),
  msg("block.reject", { blockId: z.string(), comentario: z.string().max(4000) }),
  msg("memory.delete", { id: z.string() }),
  msg("memory.read", { id: z.string() }),
  msg("budget.useReserve", empty),
  msg("budget.setLimit", { usd: z.number().positive().max(100000) }),
  msg("run.answer", { taskId: z.string(), decision: z.enum(RUN_DECISIONS) }),
  msg("run.pause", empty),
  msg("run.resume", empty),
]);

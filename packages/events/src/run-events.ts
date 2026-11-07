import { z } from "zod";
import { BLOCK_KINDS, CHAT_ROLES } from "./constants.js";
import { msg, nonNegative } from "./envelope.js";

const pct = z.number().min(0).max(100);

const planBlock = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.enum(BLOCK_KINDS),
  dependeDe: z.array(z.string()),
  familia: z.string(),
});

/** Eventos del motor sobre planes, bloques, presupuesto, chat y el propio motor. */
export const runEventSchemas = [
  msg("plan.ready", {
    planId: z.string(),
    bloques: z.array(planBlock),
  }),
  msg("block.progress", { blockId: z.string(), pct }),
  msg("block.approvalRequested", {
    blockId: z.string(),
    previewUrl: z.string(),
    archivos: z.array(z.string()),
  }),
  msg("block.assembled", { blockId: z.string() }),
  msg("budget.update", { usado: nonNegative, limite: nonNegative }),
  msg("budget.warning", { pct }),
  msg("budget.paused", { pct }),
  msg("chat.message", { rol: z.enum(CHAT_ROLES), texto: z.string() }),
  msg("engine.ready", { version: z.string(), protocol: z.number().int() }),
  msg("engine.status", {
    apiKeyConfigured: z.boolean(),
    paused: z.boolean(),
    workspace: z.string().nullable(),
    budgetLimit: nonNegative,
    /** Recuerdos guardados en la memoria persistente. */
    memoryCount: nonNegative.default(0),
  }),
  msg("engine.error", { code: z.string(), message: z.string() }),
] as const;

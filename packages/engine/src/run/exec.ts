import type { Ctx } from "./context.js";
import type { ProviderEvent, RoleRequest } from "../provider/types.js";

/** Resultado de una corrida de rol ya validado contra el esquema. */
export type Outcome =
  | { ok: true; data: unknown }
  | { ok: false; invalid: boolean; message: string };

const INVALID_CODES = ["error_max_structured_output_retries", "error_max_turns"];

type Result = Extract<ProviderEvent, { kind: "result" }>;

/**
 * Corre un rol: espera la puerta (pausa/presupuesto), traduce los eventos del proveedor
 * a eventos de agente, suma el costo y valida la salida con el esquema del rol.
 * Una salida inválida es `invalid` (cuenta como rechazo); un fallo del proveedor es fatal.
 * @param ctx Contexto de la corrida.
 * @param agentId Agente que ejecuta.
 * @param req Pedido sin `maxBudgetUsd` (se calcula acá, tras la espera).
 */
export async function execRole(ctx: Ctx, agentId: string, req: Omit<RoleRequest, "maxBudgetUsd">): Promise<Outcome> {
  const { agents, emit } = ctx;
  await ctx.gate.wait(() => agents.status(agentId, "pausado"), () => agents.status(agentId, "esperando"));
  if (!req.cwd) return { ok: false, invalid: false, message: "no_workspace" };
  agents.status(agentId, "pensando");
  let result: Result | null = null;
  let failure: { code: string; message: string } | null = null;
  try {
    for await (const ev of ctx.provider.run({ ...req, maxBudgetUsd: ctx.budget.remaining() }, ctx.signal)) {
      if (ev.kind === "tool") {
        agents.status(agentId, "trabajando");
        emit("agent.tool", { id: agentId, herramienta: ev.name, detalle: ev.detail });
      } else if (ev.kind === "text") emit("agent.output", { id: agentId, texto: ev.delta });
      else if (ev.kind === "result") result = ev;
      else {
        failure = ev;
        ctx.budget.add(ev.costUsd ?? 0);
      }
    }
  } catch (error) {
    failure = { code: "provider_exception", message: error instanceof Error ? error.message : String(error) };
  }
  if (result) {
    agents.addUsage(agentId, result.inputTokens, result.outputTokens, result.costUsd);
    ctx.budget.add(result.costUsd);
    const parsed = req.schema.safeParse(result.output);
    if (parsed.success) return { ok: true, data: parsed.data };
    return { ok: false, invalid: true, message: parsed.error.issues[0]?.message ?? "esquema" };
  }
  const f = failure ?? { code: "sin_resultado", message: "El proveedor no devolvió resultado" };
  return { ok: false, invalid: INVALID_CODES.includes(f.code), message: `${f.code}: ${f.message}` };
}

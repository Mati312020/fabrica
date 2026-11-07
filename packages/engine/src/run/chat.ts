import { ROLES } from "../roles/roles.js";
import type { OrchestratorOut, ResearchOut } from "../roles/schemas.js";
import { ensureCore, proposeBranch } from "./branches.js";
import type { Ctx } from "./context.js";
import { ORCHESTRATOR_ID } from "./agents.js";
import { execRole } from "./exec.js";
import { planFlow } from "./plan.js";
import { runTask } from "./task.js";

const MAX_FINDINGS = 10;

function context(ctx: Ctx): string {
  const lines = [`Ramas existentes: ${[...ctx.branches].join(", ") || "ninguna"}`];
  if (ctx.findings.length) lines.push(`Hallazgos aprobados: ${ctx.findings.length}`);
  if (ctx.pendingPlan) lines.push("Hay un plan esperando la aprobación del usuario.");
  if (ctx.done.size) lines.push(`Bloques ensamblados: ${ctx.done.size}`);
  return lines.join("\n");
}

async function research(ctx: Ctx, resumen: string): Promise<void> {
  const rama = ensureCore(ctx, "investigacion");
  const result = await runTask(ctx, {
    id: ctx.nextId("inv"), rama, role: "investigacion", model: "haiku", resumen,
    build: (motivos) =>
      [`Investigá: ${resumen}`, ...motivos.map((m) => `Motivo de rechazo previo: ${m}`)].join("\n"),
  });
  if (result.status === "ok") ctx.findings = [...ctx.findings, (result.output as ResearchOut).hallazgos].slice(-MAX_FINDINGS);
}

/**
 * Atiende un mensaje del usuario: corre al orquestador, crea las ramas que propone,
 * lanza las investigaciones y, si corresponde, la planificación.
 * @param ctx Contexto de la corrida.
 * @param texto Mensaje del usuario.
 */
export async function handleChat(ctx: Ctx, texto: string): Promise<void> {
  ctx.userMessages.push(texto);
  ctx.agents.ensureOrchestrator();
  const def = ROLES.orquestador;
  const out = await execRole(ctx, ORCHESTRATOR_ID, {
    role: "orquestador", model: def.model, system: def.system, tools: def.tools, schema: def.schema,
    prompt: `${context(ctx)}\n\nMensaje del usuario:\n${texto}`,
    cwd: ctx.state.workspace ?? "", agentId: ORCHESTRATOR_ID, taskId: ctx.nextId("chat"), attempt: 1,
  });
  ctx.agents.status(ORCHESTRATOR_ID, out.ok ? "terminado" : "error");
  if (!out.ok) {
    ctx.emit("engine.error", { code: out.invalid ? "salida_invalida" : "provider_error", message: out.message });
    return ctx.say("sistema", `El orquestador no pudo responder: ${out.message}`);
  }
  const plan = out.data as OrchestratorOut;
  ctx.say("orquestador", plan.respuesta);
  for (const rama of plan.ramas) {
    if (!proposeBranch(ctx, rama.tipo, rama.nombre)) {
      ctx.say("sistema", `Se alcanzó el 80% del presupuesto: no se crean ramas nuevas ("${rama.nombre}" omitida).`);
    }
  }
  await Promise.all(plan.investigaciones.map((i) => research(ctx, i.resumen)));
  if (plan.pedirPlan) await planFlow(ctx);
}

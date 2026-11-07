import type { FabricaCommand } from "@fabrica/events";
import type { Emit } from "../emit.js";
import type { ModelProvider } from "../provider/types.js";
import type { EngineState } from "../state.js";
import { handleChat } from "./chat.js";
import { codePlan } from "./coding.js";
import { createCtx, type Ctx } from "./context.js";
import { planFlow } from "./plan.js";

/** Dependencias del controlador de corridas. */
export interface ControllerDeps {
  emit: Emit;
  provider: ModelProvider;
  state: EngineState;
}

/** Controlador: traduce comandos de la UI en corridas del motor. */
export interface Controller {
  handle(command: FabricaCommand): void;
  /** Emite `engine.status` con el estado actual a todos los clientes. */
  emitStatus(): void;
  shutdown(): void;
}

/**
 * Crea el controlador.
 * @param deps Publicador, proveedor y estado.
 */
export function createController(deps: ControllerDeps): Controller {
  const abort = new AbortController();
  const ctx = createCtx({ ...deps, signal: abort.signal });
  const { emit, state } = deps;
  const emitStatus = () =>
    emit("engine.status", {
      apiKeyConfigured: state.hasApiKey(), paused: state.paused,
      workspace: state.workspace, budgetLimit: ctx.budget.limit(),
    });
  const background = (job: Promise<void>) =>
    void job.catch((e: unknown) => emit("engine.error", { code: "run_failed", message: String(e) }));

  function chat(texto: string): void {
    emit("chat.message", { rol: "usuario", texto });
    const missing = !state.workspace ? "no_workspace" : !state.hasApiKey() ? "no_api_key" : null;
    if (missing === "no_workspace") {
      emit("engine.error", { code: missing, message: "Falta elegir la carpeta del proyecto" });
      return ctx.say("sistema", "Elegí la carpeta del proyecto (arriba, en la barra) para que los agentes sepan dónde trabajar.");
    }
    if (missing === "no_api_key") {
      emit("engine.error", { code: missing, message: "Falta la API key" });
      return ctx.say("sistema", "Falta la API key de Anthropic: cargala en Ajustes para que los agentes puedan responder.");
    }
    background(handleChat(ctx, texto));
  }

  function resolve(key: string, value: unknown): void {
    ctx.decisions.get(key)?.(value);
    ctx.decisions.delete(key);
  }

  function handle(command: FabricaCommand): void {
    switch (command.type) {
      case "chat.send": return chat(command.data.texto);
      case "plan.approve": return approvePlan(ctx, command.data.planId, background);
      case "plan.reject": return rejectPlan(ctx, command.data.planId, command.data.comentario ?? "", background);
      case "block.approve": return resolve(`block:${command.data.blockId}`, { approve: true });
      case "block.reject":
        return resolve(`block:${command.data.blockId}`, { approve: false, comentario: command.data.comentario });
      case "run.answer": return resolve(command.data.taskId, command.data.decision);
      case "budget.setLimit":
        ctx.budget.setLimit(command.data.usd);
        return emitStatus();
      case "budget.useReserve": return ctx.budget.useReserve();
      case "run.pause":
      case "run.resume":
        state.paused = command.type === "run.pause";
        ctx.gate.poke();
        return emitStatus();
      case "hello":
        return emit("engine.error", { code: "bad_command", message: "hello ya fue enviado" });
      default:
        return emit("engine.error", { code: "not_implemented", message: `${command.type} llega en una fase posterior` });
    }
  }

  return { handle, emitStatus, shutdown: () => abort.abort() };
}

function approvePlan(ctx: Ctx, planId: string, background: (job: Promise<void>) => void): void {
  if (ctx.pendingPlan?.id !== planId) return;
  const { data } = ctx.pendingPlan;
  ctx.pendingPlan = null;
  background(codePlan(ctx, data));
}

function rejectPlan(ctx: Ctx, planId: string, comentario: string, background: (job: Promise<void>) => void): void {
  if (ctx.pendingPlan?.id !== planId) return;
  const { data } = ctx.pendingPlan;
  ctx.pendingPlan = null;
  background(planFlow(ctx, data.bloques, comentario));
}

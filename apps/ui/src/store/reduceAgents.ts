import type { FabricaEvent } from "@fabrica/events";
import { light, patchAgent } from "./fx";
import type { DomainState } from "./state";
import type { AgentInfo, BlockInfo } from "./types";

const MAX_TEXT = 4000;

const blank = (id: string, rama: string, at: string, order: number) => ({
  id, rama, order, estado: "esperando" as const, pct: null, herramienta: null, tarea: null,
  taskId: null, entrada: 0, salida: 0, costo: 0, texto: "", errores: 0, escalado: false,
  startedAt: null, lastAt: at,
});

function building(blocks: DomainState["blocks"], id: string | undefined): DomainState["blocks"] {
  const block: BlockInfo | undefined = id ? blocks[id] : undefined;
  if (!block || block.estado === "ensamblado" || block.estado === "aprobacion") return blocks;
  return { ...blocks, [block.id]: { ...block, estado: "construyendo" } };
}

function approvePlan(state: DomainState): Pick<DomainState, "plan" | "blocks"> {
  if (!state.plan) return { plan: null, blocks: state.blocks };
  const blocks = Object.fromEntries(
    Object.entries(state.blocks).map(([k, b]) => [k, b.estado === "propuesto" ? { ...b, estado: "pendiente" as const } : b]),
  );
  return { plan: { ...state.plan, aprobado: true }, blocks };
}

function assign(state: DomainState, data: Extract<FabricaEvent, { type: "task.assigned" }>["data"], at: string): DomainState {
  const { taskId, de, a, resumen, blockId } = data;
  const task = { taskId, de, a, resumen, estado: "asignada" as const, rechazos: state.tasks[taskId]?.rechazos ?? 0 };
  const next = {
    ...state,
    tasks: { ...state.tasks, [taskId]: task },
    blocked: state.blocked.filter((b) => b.taskId !== taskId),
    blocks: building(state.blocks, blockId),
  };
  const agent = state.agents[a];
  if (!agent) return next;
  const patched = patchAgent(next, a, at, { tarea: resumen, taskId, pct: null, texto: "", herramienta: null });
  return light(patched, [`dispatch:${agent.rama}`, `task:${a}`], agent.modelo);
}

/**
 * Reduce los eventos de ramas, agentes y tareas. Los demás eventos pasan sin cambios.
 * @param state Estado con `seq` ya actualizado.
 * @param event Evento del motor.
 */
export function reduceAgents(state: DomainState, event: FabricaEvent): DomainState {
  const at = event.at;
  switch (event.type) {
    case "branch.created": {
      const { id, tipo, nombre } = event.data;
      if (state.branches.some((b) => b.id === id)) return state;
      const approved = tipo === "codificacion" ? approvePlan(state) : {};
      return { ...state, ...approved, branches: [...state.branches, { id, tipo, nombre }] };
    }
    case "agent.spawned": {
      const { id, rama, modelo, escaladoDesde } = event.data;
      const info: AgentInfo = { ...blank(id, rama, at, Object.keys(state.agents).length), modelo, escaladoDesde: escaladoDesde ?? null };
      return { ...state, agents: { ...state.agents, [id]: info } };
    }
    case "task.assigned":
      return assign(state, event.data, at);
    case "agent.status": {
      const agent = state.agents[event.data.id];
      const startedAt = agent?.startedAt ?? (event.data.estado === "esperando" ? null : at);
      return patchAgent(state, event.data.id, at, { estado: event.data.estado, herramienta: null, startedAt });
    }
    case "agent.progress":
      return patchAgent(state, event.data.id, at, { pct: event.data.pct });
    case "agent.tool":
      return patchAgent(state, event.data.id, at, { herramienta: { nombre: event.data.herramienta, detalle: event.data.detalle } });
    case "agent.tokens":
      return patchAgent(state, event.data.id, at, { entrada: event.data.entrada, salida: event.data.salida, costo: event.data.costo });
    case "agent.output": {
      const texto = (state.agents[event.data.id]?.texto ?? "") + event.data.texto;
      return patchAgent(state, event.data.id, at, { texto: texto.slice(-MAX_TEXT), herramienta: null });
    }
    default:
      return state;
  }
}

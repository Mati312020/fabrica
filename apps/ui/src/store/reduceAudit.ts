import type { FabricaEvent } from "@fabrica/events";
import { light, patchAgent } from "./fx";
import type { DomainState } from "./state";

const MAX_HISTORY = 30;

function verdictOf(state: DomainState, data: Extract<FabricaEvent, { type: "audit.result" }>["data"]): DomainState {
  const { taskId, ok, motivo } = data;
  const task = state.tasks[taskId];
  const verdict = { seq: state.seq, taskId, agentId: task?.a ?? "", ok, motivo };
  const audit = {
    llamadas: state.audit.llamadas + 1,
    veredicto: verdict,
    historial: [...state.audit.historial, verdict].slice(-MAX_HISTORY),
  };
  if (!task) return { ...state, audit };
  const tasks = {
    ...state.tasks,
    [taskId]: { ...task, rechazos: task.rechazos + (ok ? 0 : 1), estado: ok ? ("ok" as const) : ("rechazada" as const) },
  };
  return { ...state, audit, tasks };
}

/**
 * Reduce los eventos de auditoría, escalamiento y bloqueo de tareas.
 * @param state Estado con `seq` ya actualizado.
 * @param event Evento del motor.
 */
export function reduceAudit(state: DomainState, event: FabricaEvent): DomainState {
  switch (event.type) {
    case "task.toAudit": {
      const task = state.tasks[event.data.taskId];
      const agent = task ? state.agents[task.a] : undefined;
      if (!task || !agent) return state;
      const tasks = { ...state.tasks, [task.taskId]: { ...task, estado: "en_auditoria" as const } };
      return light({ ...state, tasks }, [`audit:${agent.rama}`], agent.modelo);
    }
    case "audit.result": {
      const task = state.tasks[event.data.taskId];
      const next = verdictOf(state, event.data);
      const errores = (task ? state.agents[task.a]?.errores ?? 0 : 0) + 1;
      const withErrors = task && !event.data.ok ? patchAgent(next, task.a, event.at, { errores }) : next;
      return light(withErrors, ["return"], event.data.ok ? "ok" : "err");
    }
    case "audit.browserReport": {
      const report = { seq: state.seq, ...event.data };
      return { ...state, browserReports: { ...state.browserReports, [report.taskId]: report } };
    }
    case "task.escalated": {
      const task = state.tasks[event.data.taskId];
      return task ? patchAgent(state, task.a, event.at, { escalado: true }) : state;
    }
    case "task.blocked": {
      const { taskId, motivo } = event.data;
      return { ...state, blocked: [...state.blocked, { seq: state.seq, taskId, motivo }] };
    }
    default:
      return state;
  }
}

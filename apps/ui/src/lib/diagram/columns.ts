import { ACTIVE_STATES } from "../../store/selectors";
import type { DomainState } from "../../store/state";
import type { AgentInfo } from "../../store/types";
import type { ColumnInput } from "./layout";

/** Id fijo del agente orquestador. */
export const ORCHESTRATOR = "orquestador";
/** Rama (e id de tipo) donde viven los auditores: se dibuja como Memoria·Auditoría. */
export const AUDIT_BRANCH = "auditoria";

/** Columna del diagrama con el nombre visible de su rama. */
export interface Column extends ColumnInput {
  nombre: string;
}

/**
 * Columnas del diagrama: una por rama (sin la de auditoría) y los agentes de cada una.
 * Un agente de una rama que no anunció `branch.created` crea su columna igual.
 * @param state Ramas y agentes del estado de dominio.
 */
export function diagramColumns(state: Pick<DomainState, "branches" | "agents">): Column[] {
  const columns: Column[] = state.branches
    .filter((b) => b.id !== AUDIT_BRANCH && b.tipo !== AUDIT_BRANCH)
    .map((b) => ({ id: b.id, nombre: b.nombre, agents: [] }));
  const agents = Object.values(state.agents).sort((a, b) => a.order - b.order);
  for (const agent of agents) {
    if (agent.id === ORCHESTRATOR || agent.rama === AUDIT_BRANCH) continue;
    let column = columns.find((c) => c.id === agent.rama);
    if (!column) {
      column = { id: agent.rama, nombre: agent.rama, agents: [] };
      columns.push(column);
    }
    column.agents.push(agent.id);
  }
  return columns;
}

/**
 * Agentes de la rama de auditoría.
 * @param agents Agentes conocidos.
 */
export function auditors(agents: DomainState["agents"]): AgentInfo[] {
  return Object.values(agents).filter((a) => a.rama === AUDIT_BRANCH);
}

/**
 * Indica si algún agente de la lista está activo.
 * @param list Agentes a revisar.
 */
export function anyActive(list: AgentInfo[]): boolean {
  return list.some((a) => ACTIVE_STATES.includes(a.estado));
}

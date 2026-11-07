import type { Node } from "@xyflow/react";
import type { DomainState } from "../../store/state";
import { ORCHESTRATOR, anyActive, auditors, type Column } from "./columns";
import { D, type Layout } from "./layout";

/** Lo que el diagrama necesita del estado de dominio. */
export type GraphInput = Pick<DomainState, "branches" | "agents" | "edgeFx" | "audit" | "memory"> & {
  pending: number;
};

const node = (id: string, type: string, p: { x: number; y: number }, data: object, w: number, h: number): Node => ({
  id, type, position: p, data: data as Record<string, unknown>, width: w, height: h, draggable: false, selectable: false,
});

const dot = (p: { x: number; y: number }) => ({ x: p.x - 3.5, y: p.y - 3.5 });

/**
 * Nodos del diagrama con su posición y datos ya resueltos.
 * @param input Estado de dominio recortado.
 * @param columns Columnas del diagrama.
 * @param layout Posiciones calculadas.
 */
export function buildNodes(input: GraphInput, columns: Column[], layout: Layout): Node[] {
  const { agents, edgeFx } = input;
  const orch = agents[ORCHESTRATOR] ?? null;
  const judges = auditors(agents);
  const nodes: Node[] = [
    node("chat", "chat", layout.chat, { pending: input.pending, fx: edgeFx["chat"] }, D.chatW, D.chatH),
    node("orch", "agent", layout.orch, { agent: orch, orchestrator: true }, D.orchW, D.orchH),
    node("join:mid", "join", dot(layout.mid), { fx: undefined }, 7, 7),
    node("memo", "memory", layout.memoria, {
      llamadas: input.audit.llamadas, veredicto: input.audit.veredicto, auditores: judges.length, active: anyActive(judges),
      recuerdos: input.memory.count, savedSeq: input.memory.savedSeq,
    }, D.memoW, D.memoH),
  ];
  for (const column of columns) {
    const members = column.agents.map((id) => agents[id]).filter((a) => a !== undefined);
    nodes.push(
      node(`head:${column.id}`, "branch", layout.columns[column.id] ?? { x: 0, y: 0 }, { nombre: column.nombre, count: members.length, hot: anyActive(members) }, D.headerW, D.headerH),
      node(`join:${column.id}`, "join", dot(layout.joins[column.id] ?? { x: 0, y: 0 }), { fx: edgeFx[`audit:${column.id}`] }, 7, 7),
    );
    for (const agent of members) {
      nodes.push(node(`agent:${agent.id}`, "agent", layout.agents[agent.id] ?? { x: 0, y: 0 }, { agent, orchestrator: false }, D.agentW, D.agentH));
    }
  }
  return nodes;
}

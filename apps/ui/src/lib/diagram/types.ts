import type { AgentInfo, EdgeFx, Verdict } from "../../store/types";

/** Datos de un nodo de agente. `agent` es null para el orquestador antes de su primer evento. */
export type AgentNodeData = { agent: AgentInfo | null; orchestrator: boolean };
/** Datos del encabezado de una rama. */
export type BranchNodeData = { nombre: string; count: number; hot: boolean };
/** Datos del nodo de chat. */
export type ChatNodeData = { pending: number; fx: EdgeFx | undefined };
/** Datos de la unión de la línea de auditoría. */
export type JoinNodeData = { fx: EdgeFx | undefined };
/** Datos del nodo Memoria·Auditoría. */
export type MemoryNodeData = {
  llamadas: number;
  veredicto: Verdict | null;
  auditores: number;
  active: boolean;
  recuerdos: number;
  savedSeq: number;
};
/** Forma del cable. */
export type WireShape = "bezier" | "step" | "straight";
/** Datos de un cable. */
export type WireData = { shape: WireShape; fx: EdgeFx | undefined; arrow: boolean; reverse: boolean };

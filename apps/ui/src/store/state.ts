import type { MemoryState } from "./memoryTypes";
import type {
  AgentInfo,
  BlockInfo,
  BlockedTask,
  BranchInfo,
  BudgetPhase,
  ChatMessage,
  EdgeFx,
  LogEntry,
  PlanInfo,
  TaskInfo,
  Verdict,
} from "./types";

/** Estado de dominio: se construye solo con `applyEvent`. */
export interface DomainState {
  seq: number;
  engine: { version: string; protocol: number } | null;
  apiKeyConfigured: boolean;
  paused: boolean;
  workspace: string | null;
  budgetLimit: number;
  messages: ChatMessage[];
  log: LogEntry[];
  branches: BranchInfo[];
  agents: Record<string, AgentInfo>;
  tasks: Record<string, TaskInfo>;
  plan: PlanInfo | null;
  blocks: Record<string, BlockInfo>;
  blocked: BlockedTask[];
  audit: { llamadas: number; veredicto: Verdict | null; historial: Verdict[] };
  budget: { usado: number; limite: number } | null;
  budgetPhase: BudgetPhase;
  memory: MemoryState;
  /** Encendido de cables por clave lógica (`chat`, `dispatch:x`, `task:x`, `audit:x`, `return`). */
  edgeFx: Record<string, EdgeFx>;
}

/** Estado antes de recibir cualquier evento. */
export const initialState: DomainState = {
  seq: 0,
  engine: null,
  apiKeyConfigured: false,
  paused: false,
  workspace: null,
  budgetLimit: 0,
  messages: [],
  log: [],
  branches: [],
  agents: {},
  tasks: {},
  plan: null,
  blocks: {},
  blocked: [],
  audit: { llamadas: 0, veredicto: null, historial: [] },
  budget: null,
  budgetPhase: "normal",
  memory: { count: 0, items: [], content: null, savedSeq: 0 },
  edgeFx: {},
};

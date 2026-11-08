import { useCallback, useMemo } from "react";
import type { Mark } from "../lib/marks";
import { pendingCards, type PendingCard } from "../store/selectors";
import { useFabricaStore } from "../store/store";
import { useUi } from "../store/uiStore";
import type { SendCommand } from "./useEngine";

type Plan = Extract<PendingCard, { kind: "plan" }>;
type Block = Extract<PendingCard, { kind: "block" }>;
type Blocked = Extract<PendingCard, { kind: "blocked" }>;

/** Decisiones pendientes de la persona y las acciones que las resuelven. */
export function useApprovals(send: SendCommand) {
  const domain = useFabricaStore((s) => s.domain);
  const decided = useUi((s) => s.decided);
  const decide = useUi((s) => s.decide);
  const cards = useMemo(() => pendingCards(domain, decided), [domain, decided]);

  /** Marca la tarjeta como resuelta solo si el motor recibió el comando. */
  const done = useCallback((key: string, sent: boolean) => sent && decide(key), [decide]);

  return {
    cards,
    approvePlan: (c: Plan) => done(c.key, send("plan.approve", { planId: c.plan.planId })),
    rejectPlan: (c: Plan, comentario: string) =>
      done(c.key, send("plan.reject", { planId: c.plan.planId, ...(comentario ? { comentario } : {}) })),
    approveBlock: (c: Block) => done(c.key, send("block.approve", { blockId: c.block.id })),
    rejectBlock: (c: Block, comentario: string, marcas?: Mark[]) =>
      done(c.key, send("block.reject", { blockId: c.block.id, comentario, ...(marcas?.length ? { marcas } : {}) })),
    answer: (c: Blocked, decision: "reintentar" | "cancelar") =>
      done(c.key, send("run.answer", { taskId: c.blocked.taskId, decision })),
  };
}

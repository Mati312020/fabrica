import { MODELS, type ModelName } from "@fabrica/events";
import type { DomainState } from "./state";
import type { BlockInfo, BlockedTask, PlanInfo } from "./types";
import { cardKey } from "./uiStore";

/** Tarjeta de decisión pendiente en el chat. */
export type PendingCard =
  | { kind: "plan"; key: string; plan: PlanInfo }
  | { kind: "block"; key: string; block: BlockInfo }
  | { kind: "blocked"; key: string; blocked: BlockedTask };

/** Estados en que un agente cuenta como activo para los chips de modelo. */
export const ACTIVE_STATES = ["pensando", "trabajando", "en_auditoria"];

/**
 * Decisiones que esperan a la persona, derivadas solo del estado de dominio.
 * @param domain Estado de dominio.
 * @param decided Tarjetas que la persona ya resolvió.
 */
export function pendingCards(domain: DomainState, decided: Record<string, true>): PendingCard[] {
  const cards: PendingCard[] = [];
  const { plan } = domain;
  if (plan && !plan.aprobado && !decided[cardKey.plan(plan.planId)]) {
    cards.push({ kind: "plan", key: cardKey.plan(plan.planId), plan });
  }
  for (const block of Object.values(domain.blocks)) {
    const key = cardKey.block(block.id, block.approvalSeq);
    if (block.estado === "aprobacion" && !decided[key]) cards.push({ kind: "block", key, block });
  }
  for (const blocked of domain.blocked) {
    const key = cardKey.blocked(blocked.taskId, blocked.seq);
    if (!decided[key]) cards.push({ kind: "blocked", key, blocked });
  }
  return cards;
}

/**
 * Costo acumulado por modelo, sumando el costo informado por cada agente.
 * @param agents Agentes conocidos.
 */
export function costByModel(agents: DomainState["agents"]): Record<ModelName, number> {
  const total = { opus: 0, sonnet: 0, haiku: 0 };
  for (const agent of Object.values(agents)) total[agent.modelo] += agent.costo;
  return total;
}

/**
 * Cuántos agentes hay y cuántos están activos por modelo.
 * @param agents Agentes conocidos.
 */
export function modelCounts(agents: DomainState["agents"]) {
  const list = Object.values(agents);
  return MODELS.map((model) => {
    const own = list.filter((a) => a.modelo === model);
    return { model, total: own.length, active: own.filter((a) => ACTIVE_STATES.includes(a.estado)).length };
  });
}

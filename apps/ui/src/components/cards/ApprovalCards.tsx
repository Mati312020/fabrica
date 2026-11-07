import { useApprovals } from "../../hooks/useApprovals";
import type { SendCommand } from "../../hooks/useEngine";
import { BlockCard } from "./BlockCard";
import { BlockedCard } from "./BlockedCard";
import { PlanCard } from "./PlanCard";

/** Decisiones pendientes dentro del chat: plan, bloques visuales y tareas bloqueadas. */
export function ApprovalCards({ send }: { send: SendCommand }) {
  const a = useApprovals(send);
  return (
    <>
      {a.cards.map((card) => {
        if (card.kind === "plan") {
          return <PlanCard key={card.key} plan={card.plan} onApprove={() => a.approvePlan(card)} onReject={(c) => a.rejectPlan(card, c)} />;
        }
        if (card.kind === "block") {
          return <BlockCard key={card.key} block={card.block} onApprove={() => a.approveBlock(card)} onReject={(c) => a.rejectBlock(card, c)} />;
        }
        return <BlockedCard key={card.key} blocked={card.blocked} onAnswer={(d) => a.answer(card, d)} />;
      })}
    </>
  );
}

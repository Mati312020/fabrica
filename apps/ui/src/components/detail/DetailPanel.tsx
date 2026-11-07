import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useEscape } from "../../hooks/useEscape";
import { useFabricaStore } from "../../store/store";
import { useUi } from "../../store/uiStore";
import { AgentDetail } from "./AgentDetail";
import { AuditDetail } from "./AuditDetail";

/** Panel de detalle (tablero 05): se abre al hacer clic en un nodo; Esc o la cruz lo cierran. */
export function DetailPanel() {
  const { t } = useTranslation();
  const selected = useUi((s) => s.selected);
  const select = useUi((s) => s.select);
  const model = useFabricaStore((s) => (selected ? s.domain.agents[selected]?.modelo : undefined));
  useEscape(() => select(null), selected !== null);
  if (!selected) return null;
  const color = selected === "memoria" ? "var(--opus)" : `var(--${model ?? "opus"})`;
  return (
    <aside className="glass detail" style={{ "--m": color } as CSSProperties} aria-label={t("detail.title")}>
      {selected === "memoria" ? <AuditDetail /> : <AgentDetail id={selected} />}
    </aside>
  );
}

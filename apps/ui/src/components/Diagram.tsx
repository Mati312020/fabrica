import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useDiagramGraph } from "../hooks/useDiagramGraph";
import { useUi } from "../store/uiStore";
import { DetailPanel } from "./detail/DetailPanel";
import { DiagramCanvas } from "./diagram/DiagramCanvas";
import { EmptyState } from "./Panel";

/** Diagrama de agentes: vacío hasta el primer evento de ramas o agentes; clic en un nodo abre su detalle. */
export function Diagram({ send }: { send: SendCommand }) {
  const { t } = useTranslation();
  const graph = useDiagramGraph();
  const open = useUi((s) => s.selected !== null);
  return (
    <section aria-label={t("diagram.title")} className="relative flex min-h-0 min-w-0 flex-col">
      <span className="lbl px-1">{t("diagram.title")}</span>
      {graph ? (
        <div className={`flex min-h-0 flex-1 flex-col ${open ? "dim" : ""}`}>
          <DiagramCanvas graph={graph} />
        </div>
      ) : (
        <EmptyState>{t("diagram.empty")}</EmptyState>
      )}
      <DetailPanel send={send} />
    </section>
  );
}

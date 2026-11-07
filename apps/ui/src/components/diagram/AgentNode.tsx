import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useCountUp } from "../../hooks/useCountUp";
import { STATE_CLASS, cssColor } from "../../lib/agentView";
import type { AgentNodeData } from "../../lib/diagram/types";

/** Nodo de agente (tableros 01 y 04): el color y el brillo solo existen mientras hay trabajo. */
export function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const { t } = useTranslation();
  const agent = data.agent;
  const pct = useCountUp(agent?.pct ?? null);
  const estado = agent?.estado ?? "esperando";
  const model = agent?.modelo ?? "opus";
  const name = data.orchestrator ? t("diagram.orchestrator") : (agent?.id ?? "");
  const style = { "--m": agent ? cssColor(model) : "var(--idle)" } as CSSProperties;
  return (
    <div className={`ag ${STATE_CLASS[estado]}${agent?.escaladoDesde ? " enter" : ""}`} style={style}>
      <Handle id="l" type="target" position={Position.Left} />
      <Handle id="rr" type="target" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <div className="r1">
        <span><span className="mt">{agent ? model.toUpperCase() : "OPUS"}</span> · {name}</span>
        {pct !== null ? <span className="pct">{pct}%</span> : null}
        {agent && agent.errores > 0 && estado !== "terminado" ? <span className="eb">{t("diagram.errors", { n: agent.errores })}</span> : null}
      </div>
      <div className="r2">
        <span key={estado} className="word rise">{t(`agent.state.${estado}`)}</span>
        {agent?.herramienta ? (
          <span className="tool"><b>▸ {agent.herramienta.nombre}</b> {agent.herramienta.detalle}</span>
        ) : (
          <span className="task">{agent?.tarea ?? ""}</span>
        )}
        {agent?.escalado ? <span className="esc">{t("diagram.escalated")}</span> : null}
      </div>
      {pct !== null ? <div className="bar"><i style={{ width: `${pct}%` }} /></div> : null}
      {agent?.escaladoDesde ? <div className="tag">{t("diagram.escalatedFrom", { model: agent.escaladoDesde.toUpperCase() })}</div> : null}
    </div>
  );
}

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { BranchNodeData } from "../../lib/diagram/types";

/** Encabezado de una rama: se aclara solo mientras alguno de sus agentes trabaja. */
export function BranchNode({ data }: NodeProps<Node<BranchNodeData>>) {
  const { t } = useTranslation();
  return (
    <div className={data.hot ? "bh hot" : "bh"}>
      <Handle id="t" type="target" position={Position.Top} />
      <Handle id="b" type="source" position={Position.Bottom} style={{ left: 10 }} />
      <span>{data.nombre}</span>
      <small>{t("diagram.agentCount", { count: data.count })}</small>
    </div>
  );
}

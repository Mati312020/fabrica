import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { cssColor } from "../../lib/agentView";
import type { JoinNodeData } from "../../lib/diagram/types";

/** Unión de una rama con la línea de auditoría: se enciende al recibir su respuesta. */
export function JoinNode({ data }: NodeProps<Node<JoinNodeData>>) {
  const fx = data.fx;
  const style = fx ? ({ "--c": cssColor(fx.color), animationDelay: `${fx.step * 300}ms` } as CSSProperties) : undefined;
  return (
    <div key={fx?.seq ?? 0} className={fx ? "dot lit" : "dot"} style={style}>
      <Handle id="l" type="target" position={Position.Left} />
      <Handle id="t" type="target" position={Position.Top} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
    </div>
  );
}

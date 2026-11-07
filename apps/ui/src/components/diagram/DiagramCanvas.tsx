import { ReactFlow, ReactFlowProvider, type NodeMouseHandler } from "@xyflow/react";
import { useRef } from "react";
import { useAutoFit } from "../../hooks/useAutoFit";
import type { Graph } from "../../lib/diagram/graph";
import { useUi } from "../../store/uiStore";
import { AgentNode } from "./AgentNode";
import { BranchNode } from "./BranchNode";
import { ChatNode } from "./ChatNode";
import { JoinNode } from "./JoinNode";
import { MemoryNode } from "./MemoryNode";
import { WireEdge } from "./WireEdge";

const nodeTypes = { agent: AgentNode, branch: BranchNode, chat: ChatNode, join: JoinNode, memory: MemoryNode };
const edgeTypes = { wire: WireEdge };

/** Clic en un agente abre su detalle; clic en Memoria·Auditoría abre el de auditoría. */
const useNodeClick = (): NodeMouseHandler => {
  const select = useUi((s) => s.select);
  return (_event, node) => {
    const agent = (node.data as { agent?: { id: string } | null }).agent;
    if (node.type === "memory") select("memoria");
    else if (node.type === "agent" && agent) select(agent.id);
  };
};

function Flow({ graph }: { graph: Graph }) {
  const box = useRef<HTMLDivElement>(null);
  const onNodeClick = useNodeClick();
  useAutoFit(box, graph.shapeKey);
  return (
    <div ref={box} className="min-h-0 flex-1">
      <ReactFlow
        className="fabrica-flow"
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.06, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.2}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesFocusable={false}
        nodesFocusable={false}
      />
    </div>
  );
}

/** Lienzo de @xyflow/react con el layout determinista, encuadrado y sin zoom libre. */
export function DiagramCanvas({ graph }: { graph: Graph }) {
  return (
    <ReactFlowProvider>
      <Flow graph={graph} />
    </ReactFlowProvider>
  );
}

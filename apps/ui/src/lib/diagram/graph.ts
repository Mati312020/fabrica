import type { Edge, Node } from "@xyflow/react";
import { diagramColumns } from "./columns";
import { buildEdges } from "./edges";
import { layoutDiagram, type Layout } from "./layout";
import { buildNodes, type GraphInput } from "./nodes";

/** Resultado de armar el diagrama. */
export interface Graph {
  nodes: Node[];
  edges: Edge[];
  layout: Layout;
  /** Cambia solo cuando cambia la forma del diagrama (para volver a encuadrar). */
  shapeKey: string;
}

/**
 * Función pura: arma nodos, cables y posiciones del diagrama a partir del estado de dominio.
 * @param input Ramas, agentes, encendidos de cables y auditoría.
 */
export function buildGraph(input: GraphInput): Graph {
  const columns = diagramColumns(input);
  const layout = layoutDiagram(columns);
  const shapeKey = columns.map((c) => `${c.id}:${c.agents.length}`).join("|");
  return {
    nodes: buildNodes(input, columns, layout),
    edges: buildEdges(input.edgeFx, columns, layout),
    layout,
    shapeKey,
  };
}

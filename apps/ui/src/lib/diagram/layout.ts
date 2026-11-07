/** Medidas del diagrama, copiadas del tablero 01 (px del lienzo). */
export const D = {
  colX0: 40,
  colStep: 353,
  headerW: 290,
  headerH: 28,
  headerY: 120,
  agentDX: 22,
  agentW: 264,
  agentH: 64,
  agentY0: 156,
  rowStep: 72,
  orchW: 250,
  orchH: 64,
  orchY: 16,
  chatW: 132,
  chatH: 44,
  chatGap: 281,
  chatDY: 10,
  railDX: 10,
  memoW: 460,
  memoH: 112,
  memoGap: 20,
  busGap: 20,
  minRows: 2,
} as const;

/** Columna de una rama con los ids de sus agentes en orden de aparición. */
export interface ColumnInput {
  id: string;
  agents: string[];
}

/** Posición de la esquina superior izquierda de un nodo. */
export interface Point {
  x: number;
  y: number;
}

/** Posiciones calculadas de todos los nodos. */
export interface Layout {
  center: number;
  auditY: number;
  columns: Record<string, Point>;
  agents: Record<string, Point>;
  joins: Record<string, Point>;
  mid: Point;
  orch: Point;
  chat: Point;
  memoria: Point;
}

/**
 * Layout determinista del diagrama: mismas ramas y agentes, mismas posiciones.
 * Orquestador arriba al centro con el chat a la izquierda, una columna por rama, agentes apilados,
 * línea de auditoría con una unión por rama y Memoria·Auditoría debajo.
 * @param columns Ramas (sin la de auditoría) en orden de creación.
 */
export function layoutDiagram(columns: ColumnInput[]): Layout {
  const count = Math.max(1, columns.length);
  const center = D.colX0 + ((count - 1) * D.colStep + D.headerW) / 2;
  const rows = Math.max(D.minRows, ...columns.map((c) => c.agents.length));
  const auditY = D.agentY0 + rows * D.rowStep + D.busGap;
  const out: Layout = {
    center,
    auditY,
    columns: {},
    agents: {},
    joins: {},
    mid: { x: center, y: auditY },
    orch: { x: center - D.orchW / 2, y: D.orchY },
    chat: { x: center - D.orchW / 2 - D.chatGap, y: D.orchY + D.chatDY },
    memoria: { x: center - D.memoW / 2, y: auditY + D.memoGap },
  };
  columns.forEach((column, index) => {
    const x = D.colX0 + index * D.colStep;
    out.columns[column.id] = { x, y: D.headerY };
    out.joins[column.id] = { x: x + D.railDX, y: auditY };
    column.agents.forEach((id, row) => {
      out.agents[id] = { x: x + D.agentDX, y: D.agentY0 + row * D.rowStep };
    });
  });
  return out;
}

/** Tramo de la línea de auditoría entre dos uniones. */
export interface BusSegment {
  id: string;
  from: string;
  to: string;
}

/**
 * Tramos de la línea de auditoría: las uniones de las ramas y la central, ordenadas por x.
 * @param layout Layout calculado.
 */
export function busSegments(layout: Layout): BusSegment[] {
  const points = [
    ...Object.entries(layout.joins).map(([id, p]) => ({ id: `join:${id}`, x: p.x })),
    { id: "join:mid", x: layout.mid.x },
  ].sort((a, b) => a.x - b.x);
  return points.slice(1).map((p, i) => {
    const from = points[i]?.id ?? "";
    return { id: `bus:${from}>${p.id}`, from, to: p.id };
  });
}

/**
 * Ids de los tramos de la línea de auditoría que recorre la respuesta de una rama hasta el centro.
 * @param layout Layout calculado.
 * @param branchId Rama de origen.
 */
export function busRoute(layout: Layout, branchId: string): string[] {
  const join = layout.joins[branchId];
  if (!join) return [];
  const [lo, hi] = [Math.min(join.x, layout.mid.x), Math.max(join.x, layout.mid.x)];
  const xOf = (id: string) => (id === "join:mid" ? layout.mid.x : (layout.joins[id.slice(5)]?.x ?? NaN));
  return busSegments(layout)
    .filter((s) => Math.min(xOf(s.from), xOf(s.to)) >= lo && Math.max(xOf(s.from), xOf(s.to)) <= hi)
    .map((s) => s.id);
}

import type { Edge, MarkerType } from "@xyflow/react";
import type { DomainState } from "../../store/state";
import type { EdgeFx } from "../../store/types";
import type { Column } from "./columns";
import { busRoute, busSegments, type Layout } from "./layout";
import type { WireShape } from "./types";

type FxMap = DomainState["edgeFx"];

/**
 * El encendido más reciente entre varias claves lógicas.
 * @param fx Encendidos por clave.
 * @param keys Claves a comparar.
 */
export function latestFx(fx: FxMap, keys: string[]): EdgeFx | undefined {
  return keys.map((k) => fx[k]).reduce<EdgeFx | undefined>((best, f) => (f && (!best || f.seq > best.seq) ? f : best), undefined);
}

interface WireOpts {
  arrow?: boolean;
  reverse?: boolean;
}

const wire = (id: string, source: string, target: string, shape: WireShape, fx: EdgeFx | undefined, h: Partial<Edge> = {}, o: WireOpts = {}): Edge => ({
  id, source, target, type: "wire", selectable: false, focusable: false,
  data: { shape, fx, arrow: o.arrow ?? false, reverse: o.reverse ?? false },
  ...(o.arrow ? { markerEnd: { type: "arrowclosed" as MarkerType, color: "var(--line)", width: 7, height: 7 } } : {}),
  ...h,
});

/**
 * Cables del diagrama; cada uno trae el último encendido que le corresponde.
 * @param fx Encendidos del estado de dominio.
 * @param columns Columnas del diagrama.
 * @param layout Posiciones calculadas.
 */
export function buildEdges(fx: FxMap, columns: Column[], layout: Layout): Edge[] {
  const allAudit = columns.map((c) => `audit:${c.id}`);
  const edges: Edge[] = [
    wire("chat>orch", "chat", "orch", "bezier", fx["chat"], { sourceHandle: "r", targetHandle: "l" }, { arrow: true }),
    wire("join:mid>memo", "join:mid", "memo", "straight", latestFx(fx, allAudit), { sourceHandle: "b", targetHandle: "t" }),
    wire("memo>orch", "memo", "orch", "bezier", fx["return"], { sourceHandle: "r", targetHandle: "rr" }, { arrow: true }),
  ];
  for (const column of columns) {
    const head = `head:${column.id}`;
    edges.push(
      wire(`orch>${head}`, "orch", head, "bezier", fx[`dispatch:${column.id}`], { sourceHandle: "b", targetHandle: "t" }),
      wire(`rail:${column.id}`, head, `join:${column.id}`, "straight", fx[`audit:${column.id}`], { sourceHandle: "b", targetHandle: "t" }),
    );
    for (const id of column.agents) {
      edges.push(wire(`${head}>agent:${id}`, head, `agent:${id}`, "step", fx[`task:${id}`], { sourceHandle: "b", targetHandle: "l" }));
    }
  }
  for (const seg of busSegments(layout)) {
    const through = columns.filter((c) => busRoute(layout, c.id).includes(seg.id)).map((c) => `audit:${c.id}`);
    const reverse = seg.from === "join:mid" || (layout.joins[seg.from.slice(5)]?.x ?? 0) >= layout.mid.x;
    edges.push(wire(seg.id, seg.from, seg.to, "straight", latestFx(fx, through), { sourceHandle: "r", targetHandle: "l" }, { reverse }));
  }
  return edges;
}

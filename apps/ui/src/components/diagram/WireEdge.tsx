import type { Edge, EdgeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { cssColor } from "../../lib/agentView";
import type { WireData } from "../../lib/diagram/types";
import { fuseTiming, wirePath } from "../../lib/diagram/wire";

const TRAVEL_SHARE = 0.6;

/** Cable punteado; al llegar un evento se enciende con una mecha en el color del modelo destino. */
export function WireEdge(props: EdgeProps<Edge<WireData>>) {
  const { data, markerEnd } = props;
  if (!data) return null;
  const fx = data.fx;
  const lit = fx ? wirePath(data.shape, props, data.reverse) : "";
  const timing = fuseTiming(props, fx?.step ?? 0);
  const style = fx
    ? ({
        "--c": cssColor(fx.color),
        "--travel": `${timing.travel / TRAVEL_SHARE}ms`,
        "--delay": `${timing.delay}ms`,
        stroke: cssColor(fx.color),
      } as CSSProperties)
    : undefined;
  return (
    <g>
      <path className="wire-base" d={wirePath(data.shape, props)} markerEnd={markerEnd} />
      {fx ? (
        <g key={fx.seq}>
          <path className="wire-fuse" pathLength={100} d={lit} style={style} />
          <path
            className="wire-tip"
            d="M-6 -4 L1 0 L-6 4z"
            style={{ ...style, fill: cssColor(fx.color), offsetPath: `path("${lit}")` }}
          />
        </g>
      ) : null}
    </g>
  );
}

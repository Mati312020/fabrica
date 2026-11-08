import type { CSSProperties } from "react";
import { isoBounds, isoFaces, type IsoCell } from "../lib/montaje";

/** Props de {@link IsoStack}. */
interface IsoStackProps {
  cells: IsoCell[];
  colors: Record<string, string>;
  names: Record<string, string>;
  /** Ids recién ensamblados: llevan la animación de encastre (gramática 09). */
  fresh: Set<string>;
}

/** Conjunto ensamblado en SVG isométrico: cubos con tres caras del color de su familia, orden del pintor. */
export function IsoStack({ cells, colors, names, fresh }: IsoStackProps) {
  const box = isoBounds(cells);
  if (cells.length === 0) return null;
  return (
    <svg
      className="iso"
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      style={{ width: "100%", maxHeight: 220 }}
      role="img"
      aria-label={cells.map((c) => names[c.id] ?? c.id).join(", ")}
    >
      {cells.map((cell) => {
        const faces = isoFaces(cell.x, cell.y);
        const style = {
          "--c": colors[cell.id] ?? "var(--idle)",
          "--dx": "0px",
          "--dy": `${-(cell.y - box.y + 80)}px`,
        } as CSSProperties;
        return (
          <g key={cell.id} className={fresh.has(cell.id) ? "iso-cube iso-in" : "iso-cube"} style={style}>
            <title>{names[cell.id] ?? cell.id}</title>
            <polygon className="l" points={faces.left} />
            <polygon className="r" points={faces.right} />
            <polygon className="t" points={faces.top} />
          </g>
        );
      })}
    </svg>
  );
}

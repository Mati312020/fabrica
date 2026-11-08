/** Datos mínimos de un bloque para el montaje. */
export interface MontajeBlock {
  id: string;
  dependeDe: string[];
}

/** Posición de un cubo ensamblado: celda de la grilla y punto de pantalla (esquina superior de la tapa). */
export interface IsoCell {
  id: string;
  /** Nivel: 1 + el mayor nivel de sus dependencias. */
  level: number;
  /** Columna dentro de la grilla. */
  col: number;
  x: number;
  y: number;
}

/** Geometría del cubo isométrico: media anchura, media altura de la tapa y alto de las caras. */
export const ISO = { hw: 16, hh: 9, h: 18 } as const;

/**
 * Nivel de cada bloque: 1 + máximo nivel de sus dependencias presentes. Un ciclo se corta.
 * @param blocks Bloques del montaje.
 */
export function blockLevels(blocks: MontajeBlock[]): Record<string, number> {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const memo: Record<string, number> = {};
  const visit = (id: string, path: Set<string>): number => {
    const known = memo[id];
    if (known !== undefined) return known;
    const block = byId.get(id);
    if (!block || path.has(id)) return 0;
    const next = new Set(path).add(id);
    return (memo[id] = 1 + Math.max(0, ...block.dependeDe.map((d) => visit(d, next))));
  };
  for (const b of blocks) visit(b.id, new Set());
  return memo;
}

/**
 * Distribuye los cubos: cada nivel queda sobre el anterior, en la columna de su primera
 * dependencia si está libre (si no, en la siguiente libre). Se devuelven en orden del
 * pintor: de atrás hacia adelante (columna creciente) y de abajo hacia arriba.
 * @param blocks Bloques ensamblados, en orden de plan.
 */
export function layoutMontaje(blocks: MontajeBlock[]): IsoCell[] {
  const levels = blockLevels(blocks);
  const cols: Record<string, number> = {};
  const taken = new Set<string>();
  const ordered = [...blocks].sort((a, b) => (levels[a.id] ?? 1) - (levels[b.id] ?? 1));
  for (const block of ordered) {
    const level = levels[block.id] ?? 1;
    let col = block.dependeDe.map((d) => cols[d]).find((c) => c !== undefined) ?? 0;
    while (taken.has(`${col}:${level}`)) col += 1;
    taken.add(`${col}:${level}`);
    cols[block.id] = col;
  }
  return blocks
    .map((b) => {
      const level = levels[b.id] ?? 1;
      const col = cols[b.id] ?? 0;
      return { id: b.id, level, col, x: col * ISO.hw, y: col * ISO.hh - (level - 1) * ISO.h };
    })
    .sort((a, b) => a.col - b.col || a.level - b.level);
}

/**
 * Caja que contiene todos los cubos, con un margen.
 * @param cells Celdas ya distribuidas.
 */
export function isoBounds(cells: IsoCell[]) {
  const pad = 4;
  if (cells.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const x = Math.min(...xs) - ISO.hw - pad;
  const y = Math.min(...ys) - pad;
  return {
    x,
    y,
    w: Math.max(...xs) + ISO.hw + pad - x,
    h: Math.max(...ys) + 2 * ISO.hh + ISO.h + pad - y,
  };
}

/**
 * Puntos SVG de las tres caras de un cubo cuya esquina superior está en (x, y).
 * @param x Esquina superior de la tapa.
 * @param y Esquina superior de la tapa.
 */
export function isoFaces(x: number, y: number) {
  const { hw, hh, h } = ISO;
  return {
    top: `${x},${y} ${x + hw},${y + hh} ${x},${y + 2 * hh} ${x - hw},${y + hh}`,
    left: `${x - hw},${y + hh} ${x},${y + 2 * hh} ${x},${y + 2 * hh + h} ${x - hw},${y + hh + h}`,
    right: `${x},${y + 2 * hh} ${x + hw},${y + hh} ${x + hw},${y + hh + h} ${x},${y + 2 * hh + h}`,
  };
}

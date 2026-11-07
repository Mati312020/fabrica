const HEIGHT = 36;

/**
 * Caras del cubo isométrico del tablero 01, llenas hasta `pct` de su altura.
 * @param pct Avance de 0 a 100 (se recorta al rango).
 * @returns Puntos SVG de la cara izquierda, la derecha y la tapa.
 */
export function cubePoints(pct: number) {
  const clamped = Math.min(100, Math.max(0, pct));
  const d = HEIGHT - (HEIGHT * clamped) / 100;
  return {
    left: `1,${17 + d} 32,${33 + d} 32,69 1,53`,
    right: `32,${33 + d} 63,${17 + d} 63,53 32,69`,
    top: `32,${1 + d} 63,${17 + d} 32,${33 + d} 1,${17 + d}`,
  };
}

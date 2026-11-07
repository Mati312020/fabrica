/** Datos mínimos de un bloque del plan. */
export interface PlanBlockLike {
  id: string;
  dependeDe: string[];
  familia: string;
}

const FAMILY_TOKENS = ["--famA", "--famB", "--famC", "--famD"];
const SHADES = [100, 78, 55, 40];

/**
 * Cantidad de niveles de dependencias (la cadena más larga). Un ciclo no cuelga: se corta.
 * @param blocks Bloques del plan.
 */
export function planLevels(blocks: PlanBlockLike[]): number {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const memo = new Map<string, number>();
  const depth = (id: string, seen: Set<string>): number => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    const block = byId.get(id);
    if (!block || seen.has(id)) return 0;
    const next = new Set(seen).add(id);
    const value = 1 + Math.max(0, ...block.dependeDe.map((d) => depth(d, next)));
    memo.set(id, value);
    return value;
  };
  return Math.max(0, ...blocks.map((b) => depth(b.id, new Set())));
}

/**
 * Colores por bloque: una familia = un color base; dentro de la familia, tonos más claros.
 * @param blocks Bloques en orden de aparición.
 * @returns Mapa id de bloque a valor CSS de color.
 */
export function blockColors(blocks: PlanBlockLike[]): Record<string, string> {
  const families: string[] = [];
  const seen: Record<string, number> = {};
  const out: Record<string, string> = {};
  for (const block of blocks) {
    if (!families.includes(block.familia)) families.push(block.familia);
    const token = FAMILY_TOKENS[families.indexOf(block.familia) % FAMILY_TOKENS.length] ?? "--famA";
    const index = seen[block.familia] ?? 0;
    seen[block.familia] = index + 1;
    const shade = SHADES[Math.min(index, SHADES.length - 1)] ?? 100;
    out[block.id] = shade === 100 ? `var(${token})` : `color-mix(in oklch, var(${token}) ${shade}%, var(--mixT))`;
  }
  return out;
}

/**
 * Resumen del plan para la tarjeta: bloques, familias y niveles.
 * @param blocks Bloques del plan.
 */
export function planStats(blocks: PlanBlockLike[]) {
  return {
    bloques: blocks.length,
    familias: new Set(blocks.map((b) => b.familia)).size,
    niveles: planLevels(blocks),
  };
}

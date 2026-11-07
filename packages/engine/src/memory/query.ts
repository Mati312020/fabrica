const MIN_LEN = 4;
const MAX_TERMS = 12;

/**
 * Convierte texto libre en una consulta FTS5 segura: términos entre comillas, con prefijo, unidos con OR.
 * @param texto Texto cualquiera (nunca se interpola sin pasar por acá).
 * @returns La consulta, o null si no quedan términos útiles.
 */
export function ftsQuery(texto: string): string | null {
  const words = texto.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = [...new Set(words.filter((w) => w.length >= MIN_LEN))].slice(0, MAX_TERMS);
  return terms.length ? terms.map((t) => `"${t}"*`).join(" OR ") : null;
}

import type { MemoryInput } from "./types.js";

/** Límites de un recuerdo (spec Fase 3). */
export const LIMITS = { tituloMin: 3, tituloMax: 120, contenidoMax: 2000, etiquetasMax: 8, porAuditoria: 3 };

/** Patrones de secretos que nunca se guardan. */
export const SECRET_PATTERNS: readonly { name: string; test: RegExp }[] = [
  { name: "sk-ant-", test: /sk-ant-/ },
  { name: "ghp_", test: /ghp_/ },
  { name: "github_pat_", test: /github_pat_/ },
  { name: "AKIA", test: /AKIA/ },
  { name: "-----BEGIN", test: /-----BEGIN/ },
  { name: "password=", test: /password\s*=/i },
  { name: "token_largo", test: /[A-Za-z0-9+/=]{32,}/ },
];

/** Aprendizaje tal como lo propone el auditor (sin validar). */
export interface Learning {
  titulo: string;
  contenido: string;
  etiquetas: string[];
}

/** Resultado de validar: el recuerdo normalizado o el motivo del rechazo (sin repetir el contenido). */
export type Validation = { ok: true; value: Pick<MemoryInput, "titulo" | "contenido" | "etiquetas"> } | { ok: false; reason: string };

/**
 * Valida y normaliza un aprendizaje antes de guardarlo.
 * @param item Propuesta del auditor.
 */
export function validateLearning(item: Learning): Validation {
  const titulo = item.titulo.trim();
  const contenido = item.contenido.trim();
  const etiquetas = item.etiquetas.map((t) => t.trim()).filter(Boolean);
  if (titulo.length < LIMITS.tituloMin || titulo.length > LIMITS.tituloMax) return { ok: false, reason: "titulo_fuera_de_rango" };
  if (contenido.length === 0 || contenido.length > LIMITS.contenidoMax) return { ok: false, reason: "contenido_fuera_de_rango" };
  if (etiquetas.length > LIMITS.etiquetasMax) return { ok: false, reason: "demasiadas_etiquetas" };
  for (const text of [titulo, contenido, ...etiquetas]) {
    const hit = SECRET_PATTERNS.find((p) => p.test.test(text));
    if (hit) return { ok: false, reason: `secreto:${hit.name}` };
  }
  return { ok: true, value: { titulo, contenido, etiquetas } };
}

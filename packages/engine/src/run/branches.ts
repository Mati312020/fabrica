import type { Ctx } from "./context.js";

/** Nombres visibles de las ramas que el motor crea por su cuenta. */
export const CORE_BRANCHES: Record<string, string> = {
  investigacion: "Investigación",
  planificacion: "Planificación",
  codificacion: "Codificación",
  auditoria: "Memoria · Auditoría",
};

/**
 * Crea la rama si no existe y emite `branch.created`.
 * @returns El id de la rama.
 */
export function ensureBranch(ctx: Ctx, tipo: string, nombre: string): string {
  if (!ctx.branches.has(tipo)) {
    ctx.branches.add(tipo);
    ctx.emit("branch.created", { id: tipo, tipo, nombre });
  }
  return tipo;
}

/** Ramas imprescindibles del motor (investigación, planificación, codificación, auditoría). */
export function ensureCore(ctx: Ctx, tipo: keyof typeof CORE_BRANCHES): string {
  return ensureBranch(ctx, tipo, CORE_BRANCHES[tipo] ?? tipo);
}

/**
 * Ramas propuestas por el orquestador: desde el 80% del presupuesto no se crean ramas nuevas.
 * @returns El id de la rama, o null si no se pudo crear por presupuesto.
 */
export function proposeBranch(ctx: Ctx, tipo: string, nombre: string): string | null {
  const slug = tipo.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return null;
  if (!ctx.branches.has(slug) && ctx.budget.noNewBranches()) return null;
  return ensureBranch(ctx, slug, nombre);
}

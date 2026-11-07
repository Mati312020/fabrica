import path from "node:path";

/** Veredicto del confinamiento. */
export type Verdict = { ok: true } | { ok: false; message: string };

const PATH_FIELDS = ["file_path", "path", "notebook_path"] as const;
const GLOB_FIELDS = ["pattern", "glob"] as const;
const GLOB_TOOLS = ["Glob"];
const NEVER = ["Bash", "BashOutput", "KillShell"];
const INTERNAL = ["StructuredOutput"];

/**
 * Indica si `target` (relativo o absoluto) queda dentro de `root`.
 * Cubre `..`, rutas absolutas, otra unidad y prefijos parecidos (`/proy` vs `/proy-x`).
 * @param root Carpeta del proyecto.
 * @param target Ruta pedida por el modelo.
 */
export function isInside(root: string, target: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(root, target));
  const escapes = rel === ".." || rel.startsWith(`..${path.sep}`);
  return !escapes && !path.isAbsolute(rel);
}

function globPrefix(pattern: string): string {
  const cut = pattern.search(/[*?[{]/);
  return cut === -1 ? pattern : pattern.slice(0, cut);
}

function globAllowed(root: string, pattern: string): boolean {
  if (pattern.split(/[\\/]/).includes("..")) return false;
  return !path.isAbsolute(pattern) || isInside(root, globPrefix(pattern) || path.sep);
}

/**
 * Decide si una herramienta puede ejecutarse: debe estar en la lista del rol,
 * nunca puede ser Bash y toda ruta que reciba debe quedar dentro de la carpeta del proyecto.
 * @param allowed Herramientas del rol.
 * @param root Carpeta del proyecto.
 * @param tool Nombre de la herramienta que pide el modelo.
 * @param input Argumentos de la herramienta.
 */
export function checkToolUse(
  allowed: readonly string[],
  root: string,
  tool: string,
  input: Record<string, unknown>,
): Verdict {
  if (NEVER.includes(tool)) return { ok: false, message: `${tool} está prohibida` };
  if (INTERNAL.includes(tool)) return { ok: true };
  if (!allowed.includes(tool)) return { ok: false, message: `${tool} no está permitida para este rol` };
  for (const field of PATH_FIELDS) {
    const value = input[field];
    if (typeof value === "string" && !isInside(root, value)) {
      return { ok: false, message: `La ruta ${value} queda fuera de la carpeta del proyecto` };
    }
  }
  for (const field of GLOB_FIELDS) {
    const value = input[field];
    const isGlob = field === "glob" || GLOB_TOOLS.includes(tool);
    if (isGlob && typeof value === "string" && !globAllowed(root, value)) {
      return { ok: false, message: `El patrón ${value} sale de la carpeta del proyecto` };
    }
  }
  return { ok: true };
}

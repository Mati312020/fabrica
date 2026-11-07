import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "./db.js";
import { createMemoryRepo, type MemoryRepo } from "./repo.js";

/** Contenedor de la base de memoria: puede estar cerrada hasta que el desktop mande la ruta. */
export interface MemoryStore {
  /**
   * Abre la base. Rechaza rutas dentro de la carpeta del proyecto.
   * @returns null si abrió; si no, el código del problema.
   */
  open(file: string, workspace: string | null): "inside_workspace" | "open_failed" | null;
  close(): void;
  /** Repositorio, o null si todavía no hay base abierta. */
  repo(): MemoryRepo | null;
  /** True si la base abierta quedó dentro de `workspace`. */
  insideWorkspace(workspace: string | null): boolean;
}

/**
 * Indica si `file` está dentro de `dir`.
 * @param dir Carpeta del proyecto.
 * @param file Archivo candidato.
 */
export function isInside(dir: string, file: string): boolean {
  const rel = path.relative(path.resolve(dir), path.resolve(file));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Crea un contenedor vacío. */
export function createMemoryStore(): MemoryStore {
  let db: DatabaseSync | null = null;
  let repo: MemoryRepo | null = null;
  let file: string | null = null;
  const close = () => {
    db?.close();
    db = null;
    repo = null;
    file = null;
  };
  return {
    open(target, workspace) {
      close();
      if (target !== ":memory:" && workspace && isInside(workspace, target)) return "inside_workspace";
      try {
        db = openDatabase(target);
      } catch {
        return "open_failed";
      }
      repo = createMemoryRepo(db);
      file = target;
      return null;
    },
    close,
    repo: () => repo,
    insideWorkspace: (workspace) => Boolean(workspace && file && file !== ":memory:" && isInside(workspace, file)),
  };
}

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { ftsQuery } from "./query.js";
import type { Memory, MemoryInput, MemorySummary, SaveResult } from "./types.js";

/** Acceso a los recuerdos. Todas las consultas llevan parámetros. */
export interface MemoryRepo {
  /** Guarda; si el título ya existe (sin distinguir mayúsculas) actualiza ese recuerdo. */
  save(input: MemoryInput): SaveResult;
  /** Más recientes primero. */
  list(limit?: number): MemorySummary[];
  get(id: string): Memory | null;
  /** @returns El recuerdo borrado, o null si no existía. */
  remove(id: string): Memory | null;
  /** Búsqueda de texto completo (FTS5), la más relevante primero. */
  search(texto: string, limite: number): Memory[];
  count(): number;
}

type Row = Omit<Memory, "etiquetas"> & { etiquetas: string };

const toMemory = ({ etiquetas, id, titulo, contenido, proyecto, agente, tarea, creado, actualizado }: Row): Memory => ({
  id, titulo, contenido, etiquetas: JSON.parse(etiquetas) as string[], proyecto, agente, tarea, creado, actualizado,
});
const ftsText = (m: Pick<Memory, "etiquetas">) => m.etiquetas.join(" ");

/**
 * Crea el repositorio sobre una base ya migrada.
 * @param db Base abierta.
 */
export function createMemoryRepo(db: DatabaseSync): MemoryRepo {
  const byId = db.prepare("SELECT rowid AS rid, * FROM recuerdos WHERE id = ?");
  const byTitle = db.prepare("SELECT id, rowid AS rid FROM recuerdos WHERE lower(titulo) = lower(?)");
  const dropFts = db.prepare("DELETE FROM recuerdos_fts WHERE rowid = ?");
  const addFts = db.prepare("INSERT INTO recuerdos_fts (rowid, titulo, contenido, etiquetas) VALUES (?, ?, ?, ?)");
  const insert = db.prepare(
    "INSERT INTO recuerdos (id, titulo, contenido, etiquetas, proyecto, agente, tarea, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const update = db.prepare(
    "UPDATE recuerdos SET contenido = ?, etiquetas = ?, proyecto = ?, agente = ?, tarea = ?, actualizado = ? WHERE id = ?",
  );
  const tx = <T>(job: () => T): T => {
    db.exec("BEGIN");
    try {
      const out = job();
      db.exec("COMMIT");
      return out;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  return {
    save(m) {
      const now = new Date().toISOString();
      const tags = JSON.stringify(m.etiquetas);
      return tx(() => {
        const found = byTitle.get(m.titulo) as { id: string; rid: number | bigint } | undefined;
        if (found) {
          update.run(m.contenido, tags, m.proyecto, m.agente, m.tarea, now, found.id);
          dropFts.run(found.rid);
          addFts.run(found.rid, m.titulo, m.contenido, ftsText(m));
          return { id: found.id, created: false };
        }
        const id = randomUUID();
        const res = insert.run(id, m.titulo, m.contenido, tags, m.proyecto, m.agente, m.tarea, now, now);
        addFts.run(res.lastInsertRowid, m.titulo, m.contenido, ftsText(m));
        return { id, created: true };
      });
    },
    list(limit = 500) {
      const rows = db
        .prepare("SELECT id, titulo, etiquetas, proyecto, actualizado FROM recuerdos ORDER BY actualizado DESC, rowid DESC LIMIT ?")
        .all(limit) as Pick<Row, "id" | "titulo" | "etiquetas" | "proyecto" | "actualizado">[];
      return rows.map((r) => ({ ...r, etiquetas: JSON.parse(r.etiquetas) as string[] }));
    },
    get(id) {
      const row = byId.get(id) as (Row & { rid: number | bigint }) | undefined;
      return row ? toMemory(row) : null;
    },
    remove(id) {
      return tx(() => {
        const row = byId.get(id) as (Row & { rid: number | bigint }) | undefined;
        if (!row) return null;
        dropFts.run(row.rid);
        db.prepare("DELETE FROM recuerdos WHERE id = ?").run(id);
        return toMemory(row);
      });
    },
    search(texto, limite) {
      const query = ftsQuery(texto);
      if (!query || limite <= 0) return [];
      const rows = db
        .prepare(
          "SELECT r.* FROM recuerdos_fts f JOIN recuerdos r ON r.rowid = f.rowid WHERE recuerdos_fts MATCH ? ORDER BY bm25(recuerdos_fts) LIMIT ?",
        )
        .all(query, limite) as Row[];
      return rows.map(toMemory);
    },
    count: () => (db.prepare("SELECT COUNT(*) AS n FROM recuerdos").get() as { n: number }).n,
  };
}

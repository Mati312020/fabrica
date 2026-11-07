import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

/** Versión actual del esquema (`PRAGMA user_version`). */
export const SCHEMA_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS recuerdos (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, contenido TEXT NOT NULL, etiquetas TEXT NOT NULL,
  proyecto TEXT NOT NULL, agente TEXT NOT NULL, tarea TEXT NOT NULL, creado TEXT NOT NULL, actualizado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS recuerdos_titulo ON recuerdos (lower(titulo));
CREATE VIRTUAL TABLE IF NOT EXISTS recuerdos_fts USING fts5(
  titulo, contenido, etiquetas, tokenize = 'unicode61 remove_diacritics 2'
);`;

/**
 * Lleva el esquema a la última versión. Se puede llamar las veces que haga falta.
 * @param db Base abierta.
 */
export function migrate(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number } | undefined;
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) return;
  db.exec(SCHEMA_V1);
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

/**
 * Abre (y crea si falta) la base de memoria y la migra.
 * @param file Ruta del archivo, o `:memory:` en tests.
 */
export function openDatabase(file: string): DatabaseSync {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  migrate(db);
  return db;
}

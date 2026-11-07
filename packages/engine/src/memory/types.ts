/** Recuerdo completo tal como vive en la base. */
export interface Memory {
  id: string;
  titulo: string;
  contenido: string;
  etiquetas: string[];
  proyecto: string;
  agente: string;
  tarea: string;
  creado: string;
  actualizado: string;
}

/** Lo que se pasa a `save`: el repositorio pone id y fechas. */
export type MemoryInput = Pick<Memory, "titulo" | "contenido" | "etiquetas" | "proyecto" | "agente" | "tarea">;

/** Fila resumida para listados. */
export type MemorySummary = Pick<Memory, "id" | "titulo" | "etiquetas" | "proyecto" | "actualizado">;

/** Resultado de `save`: si el título ya existía se actualiza ese recuerdo. */
export interface SaveResult {
  id: string;
  created: boolean;
}

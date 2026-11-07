/** Recuerdo en el listado de la memoria. */
export interface MemoryItem {
  id: string;
  titulo: string;
  etiquetas: string[];
  proyecto: string;
  actualizado: string;
}

/** Recuerdo abierto para leer, con su origen. */
export interface MemoryContent extends MemoryItem {
  contenido: string;
  agente: string;
  tarea: string;
  creado: string;
}

/** Memoria persistente tal como la cuentan los eventos. */
export interface MemoryState {
  count: number;
  items: MemoryItem[];
  content: MemoryContent | null;
  /** Número de evento del último `memory.saved` (reinicia la animación del contador). */
  savedSeq: number;
}

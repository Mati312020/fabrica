import type { MemoryItem } from "../store/memoryTypes";

/**
 * Filtra recuerdos por texto (título, etiquetas y proyecto), sin distinguir mayúsculas.
 * Mantiene el orden recibido (los más recientes primero).
 * @param items Listado completo.
 * @param text Texto del filtro; vacío = todos.
 */
export function filterMemories(items: MemoryItem[], text: string): MemoryItem[] {
  const needle = text.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((i) => [i.titulo, i.proyecto, ...i.etiquetas].join(" ").toLowerCase().includes(needle));
}

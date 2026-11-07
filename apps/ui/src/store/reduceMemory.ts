import type { FabricaEvent } from "@fabrica/events";
import type { DomainState } from "./state";

/**
 * Reduce los eventos de la memoria persistente: listado, conteo y el recuerdo abierto.
 * `engine.status` también trae el conteo; el resto de los eventos pasa sin cambios.
 * @param state Estado con `seq` ya actualizado.
 * @param event Evento del motor.
 */
export function reduceMemory(state: DomainState, event: FabricaEvent): DomainState {
  const { memory } = state;
  switch (event.type) {
    case "engine.status":
      return { ...state, memory: { ...memory, count: event.data.memoryCount } };
    case "memory.snapshot": {
      const { items } = event.data;
      const open = memory.content && items.some((i) => i.id === memory.content?.id) ? memory.content : null;
      return { ...state, memory: { ...memory, items, count: items.length, content: open } };
    }
    case "memory.saved":
      return { ...state, memory: { ...memory, count: memory.count + 1, savedSeq: state.seq } };
    case "memory.deleted": {
      const { id } = event.data;
      const items = memory.items.filter((i) => i.id !== id);
      const content = memory.content?.id === id ? null : memory.content;
      return { ...state, memory: { ...memory, items, content, count: Math.max(0, memory.count - 1) } };
    }
    case "memory.content":
      return { ...state, memory: { ...memory, content: event.data } };
    default:
      return state;
  }
}

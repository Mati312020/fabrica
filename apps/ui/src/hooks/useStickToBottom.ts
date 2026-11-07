import { useEffect, useRef } from "react";

/**
 * Mantiene un contenedor con scroll pegado al final cuando cambia `dependency`.
 * @param dependency Valor que cambia cuando entra contenido nuevo.
 */
export function useStickToBottom<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dependency]);
  return ref;
}

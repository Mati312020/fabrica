import { useEffect } from "react";

/**
 * Llama a `onEscape` cuando se aprieta Esc mientras `active` sea verdadero.
 * @param onEscape Acción a ejecutar.
 * @param active Si el atajo está habilitado.
 */
export function useEscape(onEscape: () => void, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape, active]);
}

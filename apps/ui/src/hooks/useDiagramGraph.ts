import { useMemo } from "react";
import { buildGraph, type Graph } from "../lib/diagram/graph";
import { pendingCards } from "../store/selectors";
import { useFabricaStore } from "../store/store";
import { useUi } from "../store/uiStore";

/**
 * Arma el diagrama a partir del estado de dominio.
 * @returns null mientras no haya ramas ni agentes (se muestra el estado vacío).
 */
export function useDiagramGraph(): Graph | null {
  const domain = useFabricaStore((s) => s.domain);
  const decided = useUi((s) => s.decided);
  return useMemo(() => {
    if (domain.branches.length === 0 && Object.keys(domain.agents).length === 0) return null;
    const pending = pendingCards(domain, decided).length;
    return buildGraph({ ...domain, pending });
  }, [domain, decided]);
}

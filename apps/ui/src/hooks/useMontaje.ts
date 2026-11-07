import { useMemo } from "react";
import { blockColors } from "../lib/plan";
import { useFabricaStore } from "../store/store";

/** Bloques del montaje (solo con el plan aprobado), separados en construcción y ensamblados. */
export function useMontaje() {
  const plan = useFabricaStore((s) => s.domain.plan);
  const blocks = useFabricaStore((s) => s.domain.blocks);
  return useMemo(() => {
    if (!plan?.aprobado) return { building: [], assembled: [], total: 0, colors: {} as Record<string, string> };
    const all = plan.bloques.flatMap((b) => (blocks[b.id] ? [blocks[b.id]!] : []));
    return {
      building: all.filter((b) => b.estado !== "ensamblado"),
      assembled: all.filter((b) => b.estado === "ensamblado"),
      total: all.length,
      colors: blockColors(plan.bloques),
    };
  }, [plan, blocks]);
}

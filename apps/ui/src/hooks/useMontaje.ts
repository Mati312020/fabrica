import { useMemo, useState } from "react";
import { layoutMontaje } from "../lib/montaje";
import { blockColors } from "../lib/plan";
import { useFabricaStore } from "../store/store";

/** Bloques del montaje (solo con el plan aprobado): en construcción, ensamblados y su layout isométrico. */
export function useMontaje() {
  const plan = useFabricaStore((s) => s.domain.plan);
  const blocks = useFabricaStore((s) => s.domain.blocks);
  /** Los ya ensamblados al montarse no se animan; los que lleguen después, sí. */
  const [baseline] = useState(() => useFabricaStore.getState().domain.seq);
  return useMemo(() => {
    if (!plan?.aprobado) {
      return { building: [], assembled: [], total: 0, colors: {} as Record<string, string>, cells: [], names: {} as Record<string, string>, fresh: new Set<string>() };
    }
    const all = plan.bloques.flatMap((b) => (blocks[b.id] ? [blocks[b.id]!] : []));
    const assembled = all.filter((b) => b.estado === "ensamblado");
    return {
      building: all.filter((b) => b.estado !== "ensamblado"),
      assembled,
      total: all.length,
      colors: blockColors(plan.bloques),
      cells: layoutMontaje(assembled),
      names: Object.fromEntries(assembled.map((b) => [b.id, b.nombre])),
      fresh: new Set(assembled.filter((b) => b.assembledSeq > baseline).map((b) => b.id)),
    };
  }, [plan, blocks, baseline]);
}

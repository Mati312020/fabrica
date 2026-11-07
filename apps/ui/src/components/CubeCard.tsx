import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useCountUp } from "../hooks/useCountUp";
import { cubePoints } from "../lib/cube";
import type { BlockInfo } from "../store/types";

/** Props de {@link CubeCard}. */
interface CubeCardProps {
  block: BlockInfo;
  color: string;
}

/** Bloque en construcción: cubo que se llena con el avance, color de su familia y estado. */
export function CubeCard({ block, color }: CubeCardProps) {
  const { t } = useTranslation();
  const pct = useCountUp(block.pct) ?? 0;
  const faces = cubePoints(pct);
  const on = block.estado === "construyendo" || block.estado === "aprobacion";
  return (
    <div className={on ? "cube on" : "cube"} style={{ "--f": color } as CSSProperties}>
      <svg width="64" height="70" viewBox="0 0 64 70" aria-hidden="true">
        <polygon points={faces.left} fill="currentColor" fillOpacity=".55" />
        <polygon points={faces.right} fill="currentColor" fillOpacity=".32" />
        <polygon points={faces.top} fill="currentColor" fillOpacity=".8" />
        <path d="M32 1 63 17 32 33 1 17Z M1 17v36l31 16 31-16V17 M32 33v36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className="mono max-w-full truncate text-[11.5px] text-tx2">{block.nombre}</span>
      <span className="pc">{pct}%</span>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <span className="mono text-[9.5px] tracking-[.06em] text-tx3">{t(`assembly.state.${block.estado}`)}</span>
    </div>
  );
}

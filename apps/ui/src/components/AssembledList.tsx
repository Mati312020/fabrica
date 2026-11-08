import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { BlockInfo } from "../store/types";

/** Props de {@link AssembledList}. */
interface AssembledListProps {
  blocks: BlockInfo[];
  colors: Record<string, string>;
}

/** Lista de bloques ensamblados, con el hash corto del commit si lo hubo. */
export function AssembledList({ blocks, colors }: AssembledListProps) {
  const { t } = useTranslation();
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {blocks.map((b) => (
        <li
          key={b.id}
          style={{ "--f": colors[b.id] ?? "var(--idle)" } as CSSProperties}
          className="mono flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-tx2"
        >
          <span className="sq m-0" style={{ background: "var(--f)" }} />
          {b.nombre}
          {b.hash ? <span className="text-[10.5px] text-tx3" title={t("assembly.commit", { hash: b.hash })}>#{b.hash.slice(0, 7)}</span> : null}
          <span className="ml-auto text-ok">✓</span>
        </li>
      ))}
    </ul>
  );
}

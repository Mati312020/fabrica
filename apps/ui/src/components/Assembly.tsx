import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useMontaje } from "../hooks/useMontaje";
import { CubeCard } from "./CubeCard";
import { EmptyState, Panel, PanelHeader } from "./Panel";

/** Panel de montaje: bloques en construcción arriba y los ensamblados abajo; vacío hasta aprobar un plan. */
export function Assembly() {
  const { t } = useTranslation();
  const { building, assembled, total, colors } = useMontaje();
  const aside = total > 0 ? t("assembly.count", { done: assembled.length, total }) : undefined;
  return (
    <Panel label={t("assembly.title")} className="row-span-2 gap-3 overflow-y-auto p-4">
      <PanelHeader title={t("assembly.title")} {...(aside ? { aside } : {})} />
      {total === 0 ? <EmptyState>{t("assembly.empty")}</EmptyState> : null}
      {building.length > 0 ? (
        <>
          <span className="lbl">{t("assembly.building", { count: building.length })}</span>
          <div className="grid grid-cols-2 gap-2.5">
            {building.map((b) => <CubeCard key={b.id} block={b} color={colors[b.id] ?? "var(--idle)"} />)}
          </div>
        </>
      ) : null}
      {assembled.length > 0 ? (
        <>
          <span className="lbl mt-1">{t("assembly.assembled")}</span>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {assembled.map((b) => (
              <li
                key={b.id}
                style={{ "--f": colors[b.id] ?? "var(--idle)" } as CSSProperties}
                className="snap mono flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-tx2"
              >
                <span className="sq m-0" style={{ background: "var(--f)" }} />
                {b.nombre}
                <span className="ml-auto text-ok">✓</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  );
}

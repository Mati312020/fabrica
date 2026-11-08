import { useTranslation } from "react-i18next";
import { useMontaje } from "../hooks/useMontaje";
import { AssembledList } from "./AssembledList";
import { CubeCard } from "./CubeCard";
import { IsoStack } from "./IsoStack";
import { EmptyState, Panel, PanelHeader } from "./Panel";

/** Panel de montaje: bloques en construcción arriba y los ensamblados abajo; vacío hasta aprobar un plan. */
export function Assembly() {
  const { t } = useTranslation();
  const { building, assembled, total, colors, cells, names, fresh } = useMontaje();
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
          <IsoStack cells={cells} colors={colors} names={names} fresh={fresh} />
          <AssembledList blocks={assembled} colors={colors} />
        </>
      ) : null}
    </Panel>
  );
}

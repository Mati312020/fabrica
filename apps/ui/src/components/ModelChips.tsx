import type { ModelName } from "@fabrica/events";
import { useMemo, type CSSProperties } from "react";
import { modelCounts } from "../store/selectors";
import { useFabricaStore } from "../store/store";

const COLOR: Record<ModelName, string> = {
  opus: "var(--opus)",
  sonnet: "var(--sonnet)",
  haiku: "var(--haiku)",
};

/** Cuántos agentes hay y cuántos activos por modelo, solo a partir de eventos. */
function useModelCounts() {
  const agents = useFabricaStore((s) => s.domain.agents);
  return useMemo(() => modelCounts(agents), [agents]);
}

/** Chips Opus/Sonnet/Haiku: grises hasta que haya agentes activos de ese modelo. */
export function ModelChips() {
  const counts = useModelCounts();
  return (
    <div className="ml-auto flex gap-2">
      {counts.map(({ model, total, active }) => {
        const on = active > 0;
        const tone = on ? "border-[var(--m)] bg-[color-mix(in_srgb,var(--m)_10%,transparent)] text-[var(--m)]" : "border-line text-tx3";
        return (
          <div
            key={model}
            style={{ "--m": COLOR[model] } as CSSProperties}
            className={`flex h-7 items-center gap-2 rounded-full border px-[11px] font-mono text-[11px] transition-colors duration-200 ease-out ${tone}`}
          >
            <i className={`size-[7px] rounded-full ${on ? "bg-[var(--m)]" : "bg-idle"}`} />
            <span>{model.toUpperCase()}</span>
            {total > 0 ? <span>{`${active}/${total}`}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

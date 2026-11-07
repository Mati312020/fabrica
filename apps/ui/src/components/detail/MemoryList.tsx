import { useState } from "react";
import { useTranslation } from "react-i18next";
import { filterMemories } from "../../lib/memoryFilter";
import { useFabricaStore } from "../../store/store";
import type { SendCommand } from "../../hooks/useEngine";
import { MemoryOpen } from "./MemoryOpen";

/** Lo aprendido (tablero 05): títulos más recientes primero, filtro local y lectura/borrado de cada recuerdo. */
export function MemoryList({ send }: { send: SendCommand }) {
  const { t, i18n } = useTranslation();
  const memory = useFabricaStore((s) => s.domain.memory);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = filterMemories(memory.items, filter);
  const open = (id: string) => {
    setOpenId(id);
    send("memory.read", { id });
  };
  const when = (iso: string) => new Date(iso).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" });
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="lbl">{t("memory.learned", { count: memory.count })}</span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label={t("memory.search")}
          placeholder={t("memory.search")}
          className="mono ml-auto h-7 w-[180px] rounded-[5px] border border-line bg-transparent px-2 text-[11px] text-tx placeholder:text-tx3"
        />
      </div>
      {shown.length === 0 ? (
        <p className="mono m-0 py-3 text-[11.5px] text-tx3">{t(memory.items.length === 0 ? "memory.empty" : "memory.noMatch")}</p>
      ) : null}
      <ul className="m-0 flex min-h-0 list-none flex-col overflow-y-auto p-0">
        {shown.map((item) => (
          <li key={item.id} className="flex flex-col border-b border-border py-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`min-w-0 flex-1 truncate text-[13px] ${openId === item.id ? "text-[var(--m)]" : "text-tx"}`}>{item.titulo}</span>
              <small className="mono whitespace-nowrap text-[10.5px] text-tx3">{when(item.actualizado)}</small>
              <button
                type="button"
                className="btn"
                aria-expanded={openId === item.id}
                onClick={() => (openId === item.id ? setOpenId(null) : open(item.id))}
              >
                {t(openId === item.id ? "memory.close" : "memory.read")}
              </button>
            </div>
            {openId === item.id ? (
              <MemoryOpen
                content={memory.content?.id === item.id ? memory.content : null}
                onClose={() => setOpenId(null)}
                onDelete={() => {
                  send("memory.delete", { id: item.id });
                  setOpenId(null);
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

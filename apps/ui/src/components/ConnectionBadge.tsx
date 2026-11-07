import { useTranslation } from "react-i18next";
import type { ConnectionStatus } from "../lib/engineClient";
import { useAlfaStore } from "../store/store";

const DOT: Record<ConnectionStatus, string> = {
  conectado: "bg-ok",
  conectando: "bg-warn",
  desconectado: "bg-err",
};

/** Indicador de conexión con el motor: conectando, conectado, desconectado. */
export function ConnectionBadge() {
  const { t } = useTranslation();
  const status = useAlfaStore((s) => s.connection);
  return (
    <div role="status" className="flex items-center gap-2 font-mono text-[11px] text-tx2">
      <i className={`size-[7px] rounded-full ${DOT[status]}`} />
      <span>{t(`connection.${status}`)}</span>
    </div>
  );
}

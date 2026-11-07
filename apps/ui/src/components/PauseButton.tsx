import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useAlfaStore } from "../store/store";

/** Props de {@link PauseButton}. */
interface PauseButtonProps {
  send: SendCommand;
}

/** Pausar / Reanudar: manda `run.pause` o `run.resume` según el estado que informa el motor. */
export function PauseButton({ send }: PauseButtonProps) {
  const { t } = useTranslation();
  const paused = useAlfaStore((s) => s.domain.paused);
  const connected = useAlfaStore((s) => s.connection === "conectado");
  const toggle = () => send(paused ? "run.resume" : "run.pause", {});
  return (
    <button
      type="button"
      disabled={!connected}
      onClick={toggle}
      className="inline-flex h-[30px] cursor-pointer items-center gap-[7px] rounded-md border border-line bg-transparent px-3 font-mono text-[11.5px] text-tx"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {paused ? (
          <path d="M3 2v8l7-4z" fill="currentColor" />
        ) : (
          <path d="M2.5 2h2.4v8H2.5zM7.1 2h2.4v8H7.1z" fill="currentColor" />
        )}
      </svg>
      <span>{paused ? t("topbar.resume") : t("topbar.pause")}</span>
    </button>
  );
}

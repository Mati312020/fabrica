import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useAlfaStore } from "../store/store";
import { ConnectionBadge } from "./ConnectionBadge";
import { LanguageSwitch } from "./LanguageSwitch";
import { ModelChips } from "./ModelChips";
import { PauseButton } from "./PauseButton";
import { ThemeSwitch } from "./ThemeSwitch";

/** Props de {@link TopBar}. */
interface TopBarProps {
  send: SendCommand;
  onOpenSettings(): void;
}

const Sep = () => <div className="h-[22px] w-px bg-line" />;

/** Barra superior: marca, proyecto, chips de modelo y controles. */
export function TopBar({ send, onOpenSettings }: TopBarProps) {
  const { t } = useTranslation();
  const engine = useAlfaStore((s) => s.domain.engine);
  const engineLine = engine
    ? t("topbar.engine", { version: engine.version, protocol: engine.protocol })
    : t("topbar.engineWaiting");
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-border bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-4">
      <div className="flex items-center gap-2.5 font-mono text-[17px] font-bold tracking-[.02em]">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2 18 6.5v7L10 18 2 13.5v-7Z M10 2v16M2 6.5l8 4.5 8-4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span>Alfa</span>
      </div>
      <Sep />
      <div className="flex flex-col gap-px font-mono">
        <b className="text-[12.5px] font-medium">{t("topbar.noProject")}</b>
        <span className="whitespace-nowrap text-[10.5px] text-tx3">{engineLine}</span>
      </div>
      <ModelChips />
      <Sep />
      <PauseButton send={send} />
      <ThemeSwitch />
      <LanguageSwitch />
      <button
        type="button"
        onClick={onOpenSettings}
        className="h-[30px] cursor-pointer rounded-md border border-line bg-transparent px-3 font-mono text-[11.5px] text-tx"
      >
        {t("topbar.settings")}
      </button>
      <ConnectionBadge />
    </header>
  );
}

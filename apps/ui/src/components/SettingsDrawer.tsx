import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { ApiKeySection } from "./ApiKeySection";
import { CommitSwitch } from "./CommitSwitch";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeSwitch } from "./ThemeSwitch";

/** Props de {@link SettingsDrawer}. */
interface SettingsDrawerProps {
  onClose(): void;
  send: SendCommand;
}

/** Panel lateral de ajustes: API key, tema e idioma. Se cierra con Esc o clic afuera. */
export function SettingsDrawer({ onClose, send }: SettingsDrawerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.title")}
        onClick={(e) => e.stopPropagation()}
        className="glass drawer flex h-full w-[380px] flex-col gap-6 rounded-r-none p-5"
      >
        <div className="flex items-center justify-between">
          <span className="lbl text-tx2!">{t("settings.title")}</span>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="h-7 cursor-pointer rounded-md border border-line bg-transparent px-2.5 font-mono text-[11px] text-tx"
          >
            {t("settings.close")}
          </button>
        </div>
        <ApiKeySection />
        <CommitSwitch send={send} />
        <div className="flex items-center justify-between">
          <span className="lbl">{t("topbar.theme")}</span>
          <ThemeSwitch />
        </div>
        <div className="flex items-center justify-between">
          <span className="lbl">{t("topbar.language")}</span>
          <LanguageSwitch />
        </div>
      </aside>
    </div>
  );
}

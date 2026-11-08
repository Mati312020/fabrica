import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useEngineConfig } from "../hooks/useEngineConfig";
import { SegmentedControl } from "./SegmentedControl";

const inputClass =
  "h-[30px] min-w-0 rounded-md border border-line bg-transparent px-2.5 font-mono text-xs text-tx placeholder:text-tx3";

/** Ajuste del motor: local (por defecto) o remoto con URL wss:// y token. El token nunca se muestra. */
export function EngineSection() {
  const { t } = useTranslation();
  const e = useEngineConfig();
  const [mode, setMode] = useState<"local" | "remote" | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState("");
  if (!e.available || !e.config) return null;
  const current = mode ?? e.config.mode;
  const shownUrl = url ?? e.config.url ?? "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void e.apply(current === "local" ? { mode: "local" } : { mode: "remote", url: shownUrl.trim(), ...(token ? { token } : {}) });
  };
  const options = [
    { value: "local" as const, label: t("engine.local") },
    { value: "remote" as const, label: t("engine.remote") },
  ];
  const unchanged = current === "local" && e.config.mode === "local";
  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="lbl text-tx2!">{t("engine.title")}</span>
        <SegmentedControl<"local" | "remote"> label={t("engine.title")} options={options} value={current} onChange={setMode} />
      </div>
      <p className="m-0 text-[12px] leading-relaxed text-tx3">{t(current === "local" ? "engine.localHelp" : "engine.remoteHelp")}</p>
      {current === "remote" ? (
        <>
          <input value={shownUrl} onChange={(ev) => setUrl(ev.target.value)} placeholder="wss://motor.example.com" aria-label={t("engine.url")} spellCheck={false} className={inputClass} />
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(ev) => setToken(ev.target.value)}
            aria-label={t("engine.token")}
            spellCheck={false}
            className={inputClass}
            placeholder={e.config.tokenConfigured ? t("engine.tokenSaved") : t("engine.tokenPlaceholder")}
          />
        </>
      ) : null}
      <button type="submit" disabled={e.busy || e.restarting || unchanged} className="h-[30px] cursor-pointer rounded-md border border-line bg-transparent px-3 font-mono text-[11.5px] text-tx">
        {t("engine.apply")}
      </button>
      {e.restarting ? <p className="m-0 text-[12px] text-ok">{t("engine.restarting")}</p> : null}
      {e.error ? <p className="m-0 text-[12px] text-err">{t(`engine.errors.${e.error}`)}</p> : null}
    </form>
  );
}

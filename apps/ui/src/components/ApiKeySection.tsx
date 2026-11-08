import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useApiKey } from "../hooks/useApiKey";

const buttonClass =
  "h-[30px] cursor-pointer rounded-md border border-line bg-transparent px-3 font-mono text-[11.5px] text-tx";

/** Ajuste de la API key: input password, Guardar, Borrar y estado. La key nunca se muestra. */
export function ApiKeySection() {
  const { t } = useTranslation();
  const { available, remote, configured, error, busy, save, clear } = useApiKey();
  const [value, setValue] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save(value)) setValue("");
  };

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="lbl text-tx2!">{t("settings.apiKey")}</span>
        <span className={`mono text-[11px] ${configured ? "text-ok" : "text-warn"}`}>
          {configured ? t("settings.configured") : t("settings.missing")}
        </span>
      </div>
      <p className="m-0 text-[12px] leading-relaxed text-tx3">
        {t("settings.apiKeyHelp")}{" "}
        <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-tx2 underline">
          {t("settings.apiKeyLink")}
        </a>
        .
      </p>
      {available ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("settings.placeholder")}
            aria-label={t("settings.apiKey")}
            className="h-[30px] min-w-0 flex-1 rounded-md border border-line bg-transparent px-2.5 font-mono text-xs text-tx placeholder:text-tx3"
          />
          <button type="submit" disabled={busy || value.trim() === ""} className={buttonClass}>
            {t("settings.save")}
          </button>
          <button type="button" disabled={busy || !configured} onClick={() => void clear()} className={buttonClass}>
            {t("settings.clear")}
          </button>
        </form>
      ) : (
        <p className="m-0 text-[12px] text-tx3">{t(remote ? "settings.remoteKey" : "settings.desktopOnly")}</p>
      )}
      {error ? <p className="m-0 text-[12px] text-err">{t(`settings.errors.${error}`)}</p> : null}
    </section>
  );
}

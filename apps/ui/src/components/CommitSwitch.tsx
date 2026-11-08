import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useFabricaStore } from "../store/store";

/** Interruptor "Commit por bloque": el estado viene de `engine.status`; sin repo git queda deshabilitado. */
export function CommitSwitch({ send }: { send: SendCommand }) {
  const { t } = useTranslation();
  const enabled = useFabricaStore((s) => s.domain.commitPerBlock);
  const gitRepo = useFabricaStore((s) => s.domain.gitRepo);
  const online = useFabricaStore((s) => s.connection === "conectado");
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between gap-3">
        <span className="lbl">{t("commit.label")}</span>
        <input
          type="checkbox"
          role="switch"
          checked={enabled && gitRepo}
          disabled={!gitRepo || !online}
          onChange={(e) => send("project.setCommitPerBlock", { enabled: e.target.checked })}
          aria-describedby="commit-help"
        />
      </label>
      <span id="commit-help" className="text-[12px] leading-normal text-tx3">
        {gitRepo ? t("commit.help") : t("commit.noRepo")}
      </span>
    </div>
  );
}

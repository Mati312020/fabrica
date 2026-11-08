import { useTranslation } from "react-i18next";
import { GUIDED_CODES } from "../../lib/notices";
import { useFabricaStore } from "../../store/store";
import { cardKey, useUi } from "../../store/uiStore";

/** Avisos guiados de `engine.error` (sin navegador, navegador caído, git): qué pasó y qué hacer. */
export function EngineNotices() {
  const { t } = useTranslation();
  const notices = useFabricaStore((s) => s.domain.notices);
  const decided = useUi((s) => s.decided);
  const decide = useUi((s) => s.decide);
  return (
    <>
      {GUIDED_CODES.map((code) => {
        const notice = notices[code];
        if (!notice || decided[cardKey.notice(code, notice.seq)]) return null;
        return (
          <div key={code} className="notice" role="alert">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <small className="mono text-[9.5px] tracking-[.1em] text-warn">{t(`notices.${code}.title`)}</small>
              <span className="text-[12.5px] leading-normal text-tx2">{t(`notices.${code}.help`)}</span>
              {notice.message ? <span className="mono truncate text-[10.5px] text-tx3" title={notice.message}>{notice.message}</span> : null}
            </div>
            <button type="button" className="btn" onClick={() => decide(cardKey.notice(code, notice.seq))}>{t("notices.dismiss")}</button>
          </div>
        );
      })}
    </>
  );
}

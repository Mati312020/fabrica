import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

/** Props de {@link BudgetLimit}. */
interface BudgetLimitProps {
  /** Límite vigente informado por el motor, en US$. */
  limit: number;
  onSubmit(usd: number): void;
}

/** Edita el límite del proyecto en US$ (`budget.setLimit`). */
export function BudgetLimit({ limit, onSubmit }: BudgetLimitProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const value = Number(text.replace(",", "."));
  const valid = text.trim() !== "" && Number.isFinite(value) && value > 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit(value);
    setText("");
  };
  return (
    <form onSubmit={submit} className="mt-auto flex gap-1.5">
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t("budget.limitLabel")}
        placeholder={t("budget.limitPlaceholder", { limit })}
        className="mono h-7 min-w-0 flex-1 rounded-md border border-line bg-transparent px-2 text-[11px] text-tx placeholder:text-tx3"
      />
      <button type="submit" disabled={!valid} className="btn h-7! px-2.5! text-[11px]!">
        {t("budget.setLimit")}
      </button>
    </form>
  );
}

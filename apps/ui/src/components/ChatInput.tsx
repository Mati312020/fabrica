import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useFabricaStore } from "../store/store";

const MAX_LENGTH = 8000;

/** Props de {@link ChatInput}. */
interface ChatInputProps {
  send: SendCommand;
}

/** Caja de texto del chat; deshabilitada si no hay conexión con el motor. */
export function ChatInput({ send }: ChatInputProps) {
  const { t } = useTranslation();
  const connected = useFabricaStore((s) => s.connection === "conectado");
  const [text, setText] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const texto = text.trim();
    if (texto && send("chat.send", { texto })) setText("");
  };

  return (
    <form onSubmit={submit} className="mt-auto flex gap-2">
      <input
        value={text}
        maxLength={MAX_LENGTH}
        disabled={!connected}
        onChange={(e) => setText(e.target.value)}
        aria-label={t("chat.input")}
        placeholder={connected ? t("chat.placeholder") : t("chat.offline")}
        className="h-[34px] min-w-0 flex-1 rounded-md border border-line bg-transparent px-2.5 text-[12.5px] text-tx placeholder:text-tx3 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!connected || text.trim() === ""}
        className="h-[34px] cursor-pointer rounded-md border border-line bg-transparent px-3 font-mono text-[11.5px] text-tx"
      >
        {t("chat.send")}
      </button>
    </form>
  );
}

import { useTranslation } from "react-i18next";
import type { ChatMessage } from "../store/types";

/** Props de {@link ChatMessageView}. */
interface ChatMessageViewProps {
  message: ChatMessage;
}

/** Un mensaje del chat: burbuja a la derecha para la persona, etiqueta de rol para el resto. */
export function ChatMessageView({ message }: ChatMessageViewProps) {
  const { t } = useTranslation();
  if (message.rol === "usuario") {
    return (
      <div className="max-w-[280px] self-end rounded-lg bg-tx/[.07] px-2.5 py-[7px] text-[13px] leading-[1.45] break-words text-tx">
        {message.texto}
      </div>
    );
  }
  const accent = message.rol === "orquestador" ? "text-opus" : "text-tx3";
  return (
    <div className="flex flex-col gap-[3px]">
      <span className={`font-mono text-[10px] tracking-[.08em] ${accent}`}>{t(`chat.who.${message.rol}`)}</span>
      <div className="text-[13px] leading-[1.45] break-words text-tx2">{message.texto}</div>
    </div>
  );
}

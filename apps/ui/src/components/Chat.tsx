import { useTranslation } from "react-i18next";
import type { SendCommand } from "../hooks/useEngine";
import { useStickToBottom } from "../hooks/useStickToBottom";
import { useFabricaStore } from "../store/store";
import { ChatInput } from "./ChatInput";
import { ChatMessageView } from "./ChatMessageView";
import { Panel, PanelHeader } from "./Panel";

/** Props de {@link Chat}. */
interface ChatProps {
  send: SendCommand;
}

/** Chat con el orquestador: muestra los `chat.message` del motor y manda `chat.send`. */
export function Chat({ send }: ChatProps) {
  const { t } = useTranslation();
  const messages = useFabricaStore((s) => s.domain.messages);
  const listRef = useStickToBottom<HTMLDivElement>(messages);
  return (
    <Panel label={t("chat.title")} className="gap-2 px-3.5 py-3">
      <PanelHeader title={t("chat.title")} />
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((message) => (
          <ChatMessageView key={message.id} message={message} />
        ))}
      </div>
      <ChatInput send={send} />
    </Panel>
  );
}

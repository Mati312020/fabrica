import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { ChatNodeData } from "../../lib/diagram/types";

/** Nodo de chat: avisa cuando hay decisiones esperando a la persona. */
export function ChatNode({ data }: NodeProps<Node<ChatNodeData>>) {
  const { t } = useTranslation();
  return (
    <div className={data.pending > 0 ? "chatn pend" : "chatn"}>
      <Handle id="r" type="source" position={Position.Right} />
      <b>CHAT</b>
      <span>{data.pending > 0 ? t("diagram.chatPending", { count: data.pending }) : t("diagram.chatIdle")}</span>
    </div>
  );
}

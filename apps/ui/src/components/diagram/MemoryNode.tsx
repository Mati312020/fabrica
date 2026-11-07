import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { useCountUp } from "../../hooks/useCountUp";
import type { MemoryNodeData } from "../../lib/diagram/types";

/** Nodo Memoria·Auditoría: despierta con los auditores y muestra llamadas y último veredicto. */
export function MemoryNode({ data }: NodeProps<Node<MemoryNodeData>>) {
  const { t } = useTranslation();
  const calls = useCountUp(data.llamadas) ?? 0;
  const memories = useCountUp(data.recuerdos) ?? 0;
  const verdict = data.veredicto;
  const tone = data.active ? " on" : data.llamadas > 0 ? " has" : "";
  return (
    <div className={`glass mem${tone}`}>
      <Handle id="t" type="target" position={Position.Top} />
      <Handle id="r" type="source" position={Position.Right} />
      <div className="hd">
        <span className="lbl text-tx2!">{t("diagram.memory")}</span>
        <span className="mt mono text-[10px] tracking-[.08em]">OPUS</span>
        <span className="st">{t(data.active ? "diagram.awake" : "diagram.asleep")}</span>
      </div>
      <div className="grid">
        <div><div className="lbl">{t("diagram.calls")}</div><div className="big">{calls}</div></div>
        <div>
          <div className="lbl">{t("diagram.lastVerdict")}</div>
          {verdict ? (
            <div key={verdict.seq} className={`verd ${verdict.ok ? "v-ok" : "v-err"}`}>
              {t(verdict.ok ? "diagram.approved" : "diagram.rejected")}
            </div>
          ) : (
            <div className="verd text-tx3">—</div>
          )}
        </div>
        <div><div className="lbl">{t("diagram.auditors")}</div><div className="big">{data.auditores}</div></div>
        <div>
          <div className="lbl">{t("diagram.memories")}</div>
          <div key={data.savedSeq} className={`big${data.savedSeq > 0 ? " bump" : ""}`}>{memories}</div>
        </div>
      </div>
    </div>
  );
}

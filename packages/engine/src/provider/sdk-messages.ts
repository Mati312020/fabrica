import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { ProviderEvent } from "./types.js";

const MAX_DETAIL = 200;
const DETAIL_FIELDS = ["file_path", "path", "pattern", "url", "query"] as const;

/** Resume en una línea los argumentos de una herramienta para `agent.tool`. */
export function describeInput(input: unknown): string {
  const record = (input ?? {}) as Record<string, unknown>;
  const field = DETAIL_FIELDS.find((key) => typeof record[key] === "string");
  return field ? String(record[field]).slice(0, MAX_DETAIL) : "";
}

/**
 * Traduce un `SDKMessage` a eventos del proveedor.
 * - `assistant`: bloques `text` y `tool_use` (se omite `StructuredOutput`, que es interno).
 * - `result` con `subtype: "success"`: salida en `structured_output`, costo en `total_cost_usd`
 *   y tokens sumados de `modelUsage` (incluye subagentes y llamadas internas).
 * - `result` de error: `subtype` como código y `errors` como mensaje.
 */
export function mapMessage(message: SDKMessage): ProviderEvent[] {
  if (message.type === "assistant") {
    const events: ProviderEvent[] = [];
    for (const block of message.message.content) {
      if (block.type === "text" && block.text) events.push({ kind: "text", delta: block.text });
      if (block.type === "tool_use" && block.name !== "StructuredOutput") {
        events.push({ kind: "tool", name: block.name, detail: describeInput(block.input) });
      }
    }
    return events;
  }
  if (message.type !== "result") return [];
  if (message.subtype !== "success" || message.is_error) {
    const detail = message.subtype === "success" ? message.result : message.errors.join("; ");
    const code = message.subtype === "success" ? "api_error" : message.subtype;
    return [{ kind: "error", code, message: detail, costUsd: message.total_cost_usd }];
  }
  const usage = Object.values(message.modelUsage);
  const sum = (pick: (u: (typeof usage)[number]) => number) => usage.reduce((acc, u) => acc + pick(u), 0);
  return [
    {
      kind: "result",
      output: message.structured_output,
      costUsd: message.total_cost_usd,
      inputTokens: sum((u) => u.inputTokens + u.cacheReadInputTokens + u.cacheCreationInputTokens),
      outputTokens: sum((u) => u.outputTokens),
    },
  ];
}

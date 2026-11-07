import type { Options } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { checkToolUse } from "../workspace/confine.js";
import { mapMessage } from "./sdk-messages.js";
import type { ModelProvider, ProviderEvent, RoleRequest } from "./types.js";

const MAX_TURNS = 30;

/** Opciones del SDK para un rol. Aislamiento: sin settings del usuario, sin sesión en disco, sin Bash. */
export function buildOptions(req: RoleRequest, apiKey: string, abortController: AbortController): Options {
  const schema = z.toJSONSchema(req.schema) as Record<string, unknown>;
  delete schema["$schema"];
  return {
    model: req.model,
    cwd: req.cwd,
    systemPrompt: req.system,
    tools: [...req.tools],
    disallowedTools: ["Bash"],
    permissionMode: "default",
    canUseTool: async (tool, input) => {
      const verdict = checkToolUse(req.tools, req.cwd, tool, input);
      return verdict.ok
        ? { behavior: "allow", updatedInput: input }
        : { behavior: "deny", message: verdict.message };
    },
    maxTurns: MAX_TURNS,
    maxBudgetUsd: req.maxBudgetUsd,
    abortController,
    env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
    outputFormat: { type: "json_schema", schema },
    settingSources: [],
    persistSession: false,
    strictMcpConfig: true,
  };
}

/** Proveedor real: una llamada a `query()` del Claude Agent SDK por corrida de rol. */
export class SdkProvider implements ModelProvider {
  /** @param apiKey Getter de la key; se lee en cada corrida y nunca se registra. */
  constructor(private readonly apiKey: () => string) {}

  async *run(req: RoleRequest, signal: AbortSignal): AsyncGenerator<ProviderEvent> {
    const key = this.apiKey();
    const redact = (text: string) => (key ? text.split(key).join("[redactada]") : text);
    let finished = false;
    const abort = new AbortController();
    signal.addEventListener("abort", () => abort.abort(), { once: true });
    try {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");
      for await (const message of query({ prompt: req.prompt, options: buildOptions(req, key, abort) })) {
        for (const event of mapMessage(message)) {
          finished ||= event.kind === "error" || event.kind === "result";
          yield event.kind === "error" ? { ...event, message: redact(event.message) } : event;
        }
      }
    } catch (error) {
      if (finished) return; // el SDK también lanza tras un result de error: ya lo informamos
      const text = error instanceof Error ? error.message : String(error);
      yield { kind: "error", code: signal.aborted ? "aborted" : "sdk_exception", message: redact(text) };
    }
  }
}

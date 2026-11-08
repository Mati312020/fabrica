import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { describe, expect, it } from "vitest";
import { ROLES } from "../roles/roles.js";
import { buildOptions } from "./sdk.js";
import { mapMessage } from "./sdk-messages.js";
import type { RoleRequest } from "./types.js";

const req: RoleRequest = {
  role: "codificacion", model: "sonnet", system: "s", prompt: "p", tools: ROLES.codificacion.tools,
  schema: ROLES.codificacion.schema, cwd: process.cwd(), maxBudgetUsd: 1.5, agentId: "a", taskId: "t", attempt: 1,
};
const msg = (m: unknown) => m as SDKMessage;

describe("buildOptions", () => {
  const options = buildOptions(req, "sk-ant-secreta", new AbortController());

  it("aísla el SDK: sin settings, sin sesión en disco, sin Bash", () => {
    expect(options).toMatchObject({ settingSources: [], persistSession: false, strictMcpConfig: true, cwd: req.cwd });
    expect(options.disallowedTools).toContain("Bash");
    expect(options.tools).toEqual([...ROLES.codificacion.tools]);
    expect(options.maxBudgetUsd).toBe(1.5);
    expect(options.model).toBe("sonnet");
  });

  it("usa el CLI desempaquetado que informa Electron (FABRICA_CLAUDE_BIN) y, si no, el del SDK", () => {
    expect(options.pathToClaudeCodeExecutable).toBeUndefined();
    process.env["FABRICA_CLAUDE_BIN"] = "C:/app/unpacked/claude.exe";
    try {
      expect(buildOptions(req, "k", new AbortController()).pathToClaudeCodeExecutable).toBe("C:/app/unpacked/claude.exe");
    } finally {
      delete process.env["FABRICA_CLAUDE_BIN"];
    }
  });

  it("pasa la key solo por env y el esquema como json_schema", () => {
    expect(options.env?.["ANTHROPIC_API_KEY"]).toBe("sk-ant-secreta");
    expect(JSON.stringify({ ...options, env: undefined })).not.toContain("secreta");
    expect(options.outputFormat).toMatchObject({ type: "json_schema", schema: { type: "object" } });
  });

  it("canUseTool confina rutas y niega Bash", async () => {
    const ctx = { signal: new AbortController().signal } as never;
    const allow = await options.canUseTool?.("Write", { file_path: "src/a.ts" }, ctx);
    const outside = await options.canUseTool?.("Write", { file_path: "../a.ts" }, ctx);
    const bash = await options.canUseTool?.("Bash", { command: "ls" }, ctx);
    expect(allow?.behavior).toBe("allow");
    expect(outside?.behavior).toBe("deny");
    expect(bash?.behavior).toBe("deny");
  });
});

describe("mapMessage", () => {
  it("traduce texto y herramientas, ignorando StructuredOutput", () => {
    const content = [
      { type: "text", text: "pienso" },
      { type: "tool_use", name: "Read", input: { file_path: "a.ts" } },
      { type: "tool_use", name: "StructuredOutput", input: {} },
    ];
    expect(mapMessage(msg({ type: "assistant", message: { content } }))).toEqual([
      { kind: "text", delta: "pienso" },
      { kind: "tool", name: "Read", detail: "a.ts" },
    ]);
  });

  it("toma salida estructurada, costo y tokens del result", () => {
    const modelUsage = {
      a: { inputTokens: 10, outputTokens: 5, cacheReadInputTokens: 100, cacheCreationInputTokens: 1 },
      b: { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 },
    };
    const result = { type: "result", subtype: "success", is_error: false, structured_output: { ok: 1 }, total_cost_usd: 0.25, modelUsage };
    expect(mapMessage(msg(result))).toEqual([
      { kind: "result", output: { ok: 1 }, costUsd: 0.25, inputTokens: 112, outputTokens: 7 },
    ]);
  });

  it("traduce los subtipos de error", () => {
    const err = { type: "result", subtype: "error_max_budget_usd", is_error: true, errors: ["tope"], total_cost_usd: 0.3 };
    expect(mapMessage(msg(err))).toEqual([{ kind: "error", code: "error_max_budget_usd", message: "tope", costUsd: 0.3 }]);
    expect(mapMessage(msg({ type: "system" }))).toEqual([]);
  });
});

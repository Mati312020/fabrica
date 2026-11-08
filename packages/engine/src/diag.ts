import { writeFile } from "node:fs/promises";
import { PROTOCOL_VERSION } from "@fabrica/events";

const TIMEOUT_MS = 60_000;

async function attempt(work: () => Promise<string>): Promise<string> {
  try {
    return await work();
  } catch (error) {
    return `fallo: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/** El motor responde al `hello` con `engine.ready` (usa el WebSocket global de Node). */
function handshake(port: number, token: string): Promise<string> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const timer = setTimeout(() => resolve("sin respuesta"), 5000);
    ws.onopen = () => ws.send(JSON.stringify({ type: "hello", at: new Date().toISOString(), data: { token, protocol: PROTOCOL_VERSION } }));
    ws.onmessage = (e) => {
      clearTimeout(timer);
      ws.close();
      resolve(String(e.data).includes("engine.ready") ? "ok (engine.ready)" : "respuesta inesperada");
    };
    ws.onerror = () => resolve("error de conexión");
  });
}

/**
 * Prueba que el motor funciona dentro de la app empaquetada y escribe el resultado en un archivo:
 * el WebSocket responde, `playwright-core` carga y el CLI del Agent SDK arranca (con una key inválida,
 * así que lo esperable es un error de autenticación y no uno de ejecutable). Solo corre si el
 * entorno define `FABRICA_DIAG_FILE`; no toca la red de ningún proyecto ni usa una key real.
 * @param file Archivo de salida (JSON).
 * @param port Puerto donde escucha el motor.
 * @param token Token de sesión.
 */
export async function writeDiagnostics(file: string, port: number, token: string): Promise<void> {
  const result: Record<string, string> = { port: String(port), execPath: process.execPath, dirname: typeof __dirname === "string" ? __dirname : "n/a" };
  result["websocket"] = await attempt(() => handshake(port, token));
  result["playwright-core"] = await attempt(async () => {
    const pw = await import("playwright-core");
    return typeof pw.chromium?.launch === "function" ? "ok (chromium.launch disponible)" : "cargó sin chromium";
  });
  result["agent-sdk"] = await attempt(async () => {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    const types: string[] = [];
    try {
      const exe = process.env["FABRICA_CLAUDE_BIN"];
      const options = { ...(exe ? { pathToClaudeCodeExecutable: exe } : {}), maxTurns: 1, persistSession: false, settingSources: [], abortController: abort, env: { ...process.env, ANTHROPIC_API_KEY: "sk-ant-diagnostico-invalida" } };
      for await (const m of query({ prompt: "ping", options })) types.push(`${m.type}${"subtype" in m ? `:${String(m.subtype)}` : ""}`);
    } finally {
      clearTimeout(timer);
    }
    return `el CLI arrancó y respondió: ${types.join(", ")}`;
  });
  await writeFile(file, JSON.stringify(result, null, 2), "utf8");
}

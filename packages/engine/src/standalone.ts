import os from "node:os";
import path from "node:path";
import { parseArgs } from "./cli.js";
import { startEngine } from "./server.js";

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(`[fabrica-engine] ${parsed.error}`);
  process.exit(2);
}
const { host, port, token, tokenGenerated, tls, allowedOrigins } = parsed.config;

// La memoria vive fuera de cualquier proyecto: FABRICA_MEMORY_DB o %APPDATA%/fabrica-dev/memory.db.
const appData = process.env["APPDATA"] ?? path.join(os.homedir(), ".config");
const memoryPath = process.env["FABRICA_MEMORY_DB"] ?? path.join(appData, "fabrica-dev", "memory.db");

const engine = await startEngine({ token, host, port, allowedOrigins, memoryPath, ...(tls ? { tls } : {}) });
// La key y la carpeta salen del entorno del servicio. Nunca se imprimen ni viajan por WebSocket.
const key = process.env["ANTHROPIC_API_KEY"];
if (key) engine.setApiKey(key);
const workspace = process.env["FABRICA_WORKSPACE"];
if (workspace) engine.setWorkspace(workspace);

const scheme = tls ? "wss" : "ws";
console.log(`[fabrica-engine] escuchando en ${scheme}://${host}:${engine.port}`);
console.log(`[fabrica-engine] memoria: ${memoryPath}`);
console.log(`[fabrica-engine] carpeta: ${workspace ?? "(sin elegir: definí FABRICA_WORKSPACE)"}`);
console.log(`[fabrica-engine] API key: ${key ? "cargada desde el entorno" : "(sin definir: ANTHROPIC_API_KEY)"}`);
if (tokenGenerated) {
  // Solo loopback: el token generado se muestra para abrir la UI de desarrollo.
  const query = new URLSearchParams({ ws: `ws://127.0.0.1:${engine.port}`, token });
  console.log(`[fabrica-engine] abrí la UI en: http://localhost:5173/?${query.toString()}`);
} else {
  console.log("[fabrica-engine] token: el del entorno o del archivo (no se imprime)");
}

const stop = () => void engine.close().then(() => process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

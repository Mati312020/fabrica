import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { startEngine } from "./server.js";

const PORT = 4317;
const token = process.env["FABRICA_DEV_TOKEN"] ?? randomBytes(32).toString("hex");

// La memoria vive fuera de cualquier proyecto: FABRICA_MEMORY_DB o %APPDATA%/fabrica-dev/memory.db.
const appData = process.env["APPDATA"] ?? path.join(os.homedir(), ".config");
const memoryPath = process.env["FABRICA_MEMORY_DB"] ?? path.join(appData, "fabrica-dev", "memory.db");

const engine = await startEngine({ token, port: PORT, memoryPath });
// Solo desarrollo: la key y la carpeta salen del entorno. Nunca se imprimen.
const devKey = process.env["ANTHROPIC_API_KEY"];
if (devKey) engine.setApiKey(devKey);
const devWorkspace = process.env["FABRICA_WORKSPACE"];
if (devWorkspace) engine.setWorkspace(devWorkspace);

const query = new URLSearchParams({ ws: `ws://127.0.0.1:${engine.port}`, token });
console.log(`[fabrica-engine] escuchando en ws://127.0.0.1:${engine.port}`);
console.log(`[fabrica-engine] memoria: ${memoryPath}`);
console.log(`[fabrica-engine] carpeta: ${devWorkspace ?? "(sin elegir: definí FABRICA_WORKSPACE)"}`);
console.log(`[fabrica-engine] API key: ${devKey ? "cargada desde el entorno" : "(sin definir: ANTHROPIC_API_KEY)"}`);
console.log(`[fabrica-engine] abrí la UI en: http://localhost:5173/?${query.toString()}`);

process.on("SIGINT", () => void engine.close().then(() => process.exit(0)));

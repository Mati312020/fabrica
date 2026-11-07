import { randomBytes } from "node:crypto";
import { startEngine } from "./server.js";

const PORT = 4317;
const token = process.env["ALFA_DEV_TOKEN"] ?? randomBytes(32).toString("hex");

const engine = await startEngine({ token, port: PORT });
const query = new URLSearchParams({ ws: `ws://127.0.0.1:${engine.port}`, token });
console.log(`[alfa-engine] escuchando en ws://127.0.0.1:${engine.port}`);
console.log(`[alfa-engine] abrí la UI en: http://localhost:5173/?${query.toString()}`);

process.on("SIGINT", () => void engine.close().then(() => process.exit(0)));

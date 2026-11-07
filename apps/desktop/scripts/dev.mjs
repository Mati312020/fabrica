import { spawn } from "node:child_process";
import electron from "electron";
import "./build.mjs";

const UI_URL = "http://localhost:5173";
const TIMEOUT_MS = 60_000;

async function waitForUi() {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const ok = await fetch(UI_URL).then((r) => r.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`El dev server de la UI no respondió en ${UI_URL}`);
}

await waitForUi();

const env = { ...process.env, ALFA_UI_URL: UI_URL };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(String(electron), ["."], { stdio: "inherit", env, cwd: new URL("..", import.meta.url) });
child.on("exit", (code) => process.exit(code ?? 0));

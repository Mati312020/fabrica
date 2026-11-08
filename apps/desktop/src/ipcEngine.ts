import type { EngineConfig, EngineConfigResult } from "@fabrica/events";
import { app, ipcMain } from "electron";
import { z } from "zod";
import { CHANNELS } from "./channels";
import { guard } from "./guard";
import { configError, parseRemoteUrl } from "./remote";
import { ENGINE_TOKEN_FILE, hasSecret, saveSecret } from "./secrets";
import { loadSettings, saveSettings } from "./settings";

const inputSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("local") }),
  z.object({ mode: z.literal("remote"), url: z.string(), token: z.string().optional() }),
]);

async function getConfig(): Promise<EngineConfig> {
  const { engine } = await loadSettings();
  return { mode: engine.mode, url: engine.url, tokenConfigured: await hasSecret(ENGINE_TOKEN_FILE) };
}

async function setConfig(raw: unknown): Promise<EngineConfigResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_url" };
  const input = parsed.data;
  const error = configError(input, await hasSecret(ENGINE_TOKEN_FILE));
  if (error) return { ok: false, error };
  if (input.mode === "remote") {
    if (input.token !== undefined && !(await saveSecret(input.token, ENGINE_TOKEN_FILE))) {
      return { ok: false, error: "encryption_unavailable" };
    }
    await saveSettings({ engine: { mode: "remote", url: parseRemoteUrl(input.url) } });
  } else {
    // Se conservan la URL y el token cifrado para poder volver al remoto sin escribirlos de nuevo.
    await saveSettings({ engine: { mode: "local", url: (await loadSettings()).engine.url } });
  }
  // El motor se elige al arrancar: la app se reinicia después de responderle a la UI.
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 400);
  return { ok: true };
}

/** Registra los canales para ver y cambiar el motor (local o remoto). */
export function registerEngineConfigIpc(): void {
  ipcMain.handle(CHANNELS.engineConfigGet, guard(getConfig));
  ipcMain.handle(CHANNELS.engineConfigSet, guard(setConfig));
}

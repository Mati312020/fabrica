import type { ApiKeyResult } from "@fabrica/events";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { CHANNELS } from "./channels";
import type { EngineProcess } from "./engineProcess";
import { loadSettings, saveSettings } from "./settings";
import { clearApiKey, hasApiKey, isValidApiKeyFormat, saveApiKey } from "./secrets";
import { guard } from "./guard";
import { registerEngineConfigIpc } from "./ipcEngine";

async function setApiKey(engine: EngineProcess, key: unknown): Promise<ApiKeyResult> {
  if (engine.kind === "remote") return { ok: false, error: "engine_remote" };
  if (!isValidApiKeyFormat(key)) return { ok: false, error: "invalid_format" };
  if (!engine.alive()) return { ok: false, error: "engine_unavailable" };
  if (!(await saveApiKey(key))) return { ok: false, error: "encryption_unavailable" };
  engine.sendApiKey(key);
  return { ok: true };
}

/** Abre el selector de carpeta; guarda la elegida y se la manda al motor. Con motor remoto la carpeta es del servidor. */
async function chooseWorkspace(engine: EngineProcess): Promise<string | null> {
  if (engine.kind === "remote") return null;
  const parent = BrowserWindow.getFocusedWindow() ?? undefined;
  const options = { properties: ["openDirectory", "createDirectory"] as ("openDirectory" | "createDirectory")[] };
  const result = await (parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options));
  const dir = result.canceled ? undefined : result.filePaths[0];
  if (!dir) return null;
  await saveSettings({ workspace: dir });
  if (engine.alive()) engine.sendWorkspace(dir);
  return dir;
}

/**
 * Registra los canales IPC. La API key entra por `apiKey:set` y nunca se devuelve.
 * @param engine Proceso del motor.
 */
export function registerIpc(engine: EngineProcess): void {
  registerEngineConfigIpc();
  ipcMain.handle(
    CHANNELS.getConnection,
    guard(() => engine.connection.catch(() => null)),
  );
  ipcMain.handle(
    CHANNELS.apiKeySet,
    guard((key: unknown) => setApiKey(engine, key)),
  );
  ipcMain.handle(
    CHANNELS.workspaceChoose,
    guard(() => chooseWorkspace(engine)),
  );
  ipcMain.handle(
    CHANNELS.workspaceCurrent,
    guard(async () => (await loadSettings()).workspace),
  );
  ipcMain.handle(
    CHANNELS.apiKeyStatus,
    guard(async () => ({ configured: await hasApiKey() })),
  );
  ipcMain.handle(
    CHANNELS.apiKeyClear,
    guard(async () => {
      await clearApiKey();
      if (engine.alive()) engine.sendApiKey("");
    }),
  );
}

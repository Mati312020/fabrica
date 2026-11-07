import type { ApiKeyResult } from "@fabrica/events";
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from "electron";
import { CHANNELS } from "./channels";
import type { EngineProcess } from "./engineProcess";
import { loadSettings, saveSettings } from "./settings";
import { clearApiKey, hasApiKey, isValidApiKeyFormat, saveApiKey } from "./secrets";
import { isTrustedUrl } from "./trust";

/** Rechaza invocaciones que no vengan de la UI de Fabrica!. */
function guard<A extends unknown[], R>(handler: (...args: A) => Promise<R>) {
  return (event: IpcMainInvokeEvent, ...args: A): Promise<R> => {
    if (!isTrustedUrl(event.senderFrame?.url)) throw new Error("Remitente no autorizado");
    return handler(...args);
  };
}

async function setApiKey(engine: EngineProcess, key: unknown): Promise<ApiKeyResult> {
  if (!isValidApiKeyFormat(key)) return { ok: false, error: "invalid_format" };
  if (!engine.alive()) return { ok: false, error: "engine_unavailable" };
  if (!(await saveApiKey(key))) return { ok: false, error: "encryption_unavailable" };
  engine.sendApiKey(key);
  return { ok: true };
}

/** Abre el selector de carpeta; guarda la elegida y se la manda al motor. */
async function chooseWorkspace(engine: EngineProcess): Promise<string | null> {
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

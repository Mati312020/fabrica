import { app, BrowserWindow } from "electron";
import path from "node:path";
import { CHANNELS } from "./channels";
import { startEngineProcess } from "./engineProcess";
import { registerIpc } from "./ipc";
import { loadApiKey } from "./secrets";
import { loadSettings } from "./settings";
import { createWindow } from "./window";

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(async () => {
  const engine = startEngineProcess((code) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(CHANNELS.engineExit, code);
    }
  });
  // La memoria persistente vive en userData, nunca en la carpeta del proyecto.
  engine.sendMemoryPath(path.join(app.getPath("userData"), "memory.db"));
  registerIpc(engine);
  app.on("before-quit", () => engine.kill());
  createWindow();

  await engine.connection.catch(() => null);
  const stored = await loadApiKey();
  if (stored && engine.alive()) engine.sendApiKey(stored);
  const { workspace } = await loadSettings();
  if (workspace && engine.alive()) engine.sendWorkspace(workspace);
});

app.on("second-instance", () => {
  const [win] = BrowserWindow.getAllWindows();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.on("window-all-closed", () => app.quit());

import { BrowserWindow, shell } from "electron";
import path from "node:path";
import { devUiUrl, isTrustedUrl, uiDistDir } from "./trust";

const ALLOWED_EXTERNAL = "https://console.anthropic.com/";

/** Crea la ventana principal (1440x900, mínimo 1100x700) con el aislamiento de Electron activo. */
export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#08090b",
    title: "Alfa",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(ALLOWED_EXTERNAL)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedUrl(url)) event.preventDefault();
  });

  if (devUiUrl) void win.loadURL(devUiUrl);
  else void win.loadFile(path.join(uiDistDir, "index.html"));
  return win;
}

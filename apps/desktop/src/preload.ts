import type { FabricaBridge } from "@fabrica/events";
import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS } from "./channels";

const bridge: FabricaBridge = {
  engine: { getConnection: () => ipcRenderer.invoke(CHANNELS.getConnection) },
  apiKey: {
    set: (key) => ipcRenderer.invoke(CHANNELS.apiKeySet, key),
    status: () => ipcRenderer.invoke(CHANNELS.apiKeyStatus),
    clear: () => ipcRenderer.invoke(CHANNELS.apiKeyClear),
  },
  workspace: {
    choose: () => ipcRenderer.invoke(CHANNELS.workspaceChoose),
    current: () => ipcRenderer.invoke(CHANNELS.workspaceCurrent),
  },
  onEngineExit(cb) {
    const listener = (_event: unknown, code: number) => cb(code);
    ipcRenderer.on(CHANNELS.engineExit, listener);
    return () => void ipcRenderer.removeListener(CHANNELS.engineExit, listener);
  },
};

contextBridge.exposeInMainWorld("fabrica", bridge);

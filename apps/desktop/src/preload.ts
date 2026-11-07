import type { AlfaBridge } from "@alfa/events";
import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS } from "./channels";

const bridge: AlfaBridge = {
  engine: { getConnection: () => ipcRenderer.invoke(CHANNELS.getConnection) },
  apiKey: {
    set: (key) => ipcRenderer.invoke(CHANNELS.apiKeySet, key),
    status: () => ipcRenderer.invoke(CHANNELS.apiKeyStatus),
    clear: () => ipcRenderer.invoke(CHANNELS.apiKeyClear),
  },
  onEngineExit(cb) {
    const listener = (_event: unknown, code: number) => cb(code);
    ipcRenderer.on(CHANNELS.engineExit, listener);
    return () => void ipcRenderer.removeListener(CHANNELS.engineExit, listener);
  },
};

contextBridge.exposeInMainWorld("alfa", bridge);

import type { EngineConnection } from "@fabrica/events";
import type { EngineProcess } from "./engineProcess";
import { startEngineProcess } from "./engineProcess";
import { parseRemoteUrl, isValidEngineToken } from "./remote";
import { ENGINE_TOKEN_FILE, loadSecret } from "./secrets";
import { loadSettings } from "./settings";

/**
 * Motor de un servidor: no hay proceso que manejar. La API key y la carpeta del proyecto son del
 * servidor, así que `alive()` es false y la app no le manda nada por el canal del proceso padre.
 * @param connection URL `wss://` y token del servidor.
 */
export function remoteEngine(connection: EngineConnection): EngineProcess {
  const none = () => undefined;
  return {
    kind: "remote",
    connection: Promise.resolve(connection),
    alive: () => false,
    sendApiKey: none,
    sendWorkspace: none,
    sendMemoryPath: none,
    kill: none,
  };
}

/**
 * Arranca el motor que eligió la persona. Si pidió el remoto pero faltan la URL o el token,
 * vuelve al local en lugar de quedarse sin motor.
 * @param onExit Se llama si el motor local termina por su cuenta.
 */
export async function chooseEngine(onExit: (code: number) => void): Promise<EngineProcess> {
  const { engine } = await loadSettings();
  if (engine.mode === "remote") {
    const url = parseRemoteUrl(engine.url);
    const token = await loadSecret(ENGINE_TOKEN_FILE);
    if (url && isValidEngineToken(token)) return remoteEngine({ url, token });
  }
  return startEngineProcess(onExit);
}

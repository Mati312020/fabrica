import { useFabricaStore } from "../store/store";
import { useEngineConfig } from "./useEngineConfig";

/** Último tramo de una ruta (Windows o POSIX). */
export function folderName(path: string): string {
  return path.split(/[\\/]+/).filter(Boolean).at(-1) ?? path;
}

/**
 * Carpeta del proyecto informada por el motor y, en Electron, el selector para cambiarla.
 * El proceso principal guarda la ruta y se la manda al motor; la UI se entera por `engine.status`.
 */
export function useWorkspace() {
  const path = useFabricaStore((s) => s.domain.workspace);
  const bridge = window.fabrica?.workspace;
  const { remote } = useEngineConfig();
  return {
    /** Con motor remoto la carpeta es del servidor: no hay diálogo local. */
    remote,
    path,
    name: path ? folderName(path) : null,
    canChoose: Boolean(bridge) && !remote,
    choose: () => void bridge?.choose(),
  };
}

import { startPreviewServer, type PreviewServer } from "./server.js";

/** Un servidor de vista previa por carpeta, creado a demanda y cerrado al apagar el motor. */
export interface PreviewManager {
  /** URL de la vista previa de esa carpeta (la crea la primera vez). */
  urlFor(dir: string): Promise<string>;
  closeAll(): Promise<void>;
}

/** Crea el administrador de servidores de vista previa. */
export function createPreviewManager(): PreviewManager {
  const servers = new Map<string, Promise<PreviewServer>>();
  return {
    urlFor(dir) {
      let server = servers.get(dir);
      if (!server) {
        server = startPreviewServer(dir);
        servers.set(dir, server);
        server.catch(() => servers.delete(dir));
      }
      return server.then((s) => s.url);
    },
    async closeAll() {
      const all = [...servers.values()];
      servers.clear();
      await Promise.all(all.map((s) => s.then((x) => x.close(), () => undefined)));
    },
  };
}

import type { FabricaBridge } from "@fabrica/events";

declare global {
  interface Window {
    /** Presente solo dentro de Electron (lo expone el preload). */
    fabrica?: FabricaBridge;
  }
}

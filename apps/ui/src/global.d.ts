import type { AlfaBridge } from "@alfa/events";

declare global {
  interface Window {
    /** Presente solo dentro de Electron (lo expone el preload). */
    alfa?: AlfaBridge;
  }
}

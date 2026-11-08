import type { Step } from "../roles/schemas.js";

/** Pedido de un recorrido determinista en el navegador. */
export interface BrowserRequest {
  /** URL raíz de la vista previa. El recorrido no puede salir de este origen. */
  baseUrl: string;
  recorrido: readonly Step[];
  /** Carpeta de las capturas (`<proyecto>/.fabrica/capturas`). */
  outDir: string;
  /** Prefijo de los archivos de captura (por ejemplo, el id de la tarea). */
  prefix: string;
  /** Anchos a probar; por defecto escritorio (1280) y móvil (390). */
  widths?: readonly number[];
  /** Timeout por paso; por defecto `STEP_TIMEOUT_MS`. */
  stepTimeoutMs?: number;
  /** Se llama antes de cada paso, con un texto como `paso 3/8 · click #enviar`. */
  onStep?(detail: string): void;
}

/** Lo que encontró el recorrido. Todas las listas son texto legible para el auditor. */
export interface BrowserReport {
  /** Errores de consola y excepciones de la página. */
  errores: string[];
  /** Requests fallidos (4xx/5xx o de red). */
  fallidos: string[];
  /** Pasos que no se pudieron hacer, con el motivo. */
  pasosFallidos: string[];
  /** Rutas absolutas de las capturas, una por paso y ancho. */
  capturas: string[];
}

/** No hay un navegador utilizable (Edge no está instalado o no arrancó). */
export class NoBrowserError extends Error {
  override name = "NoBrowserError";
}

/** Ejecuta recorridos. Se inyecta en el contexto para poder simularlo en los tests del motor. */
export interface BrowserRunner {
  /** @throws {NoBrowserError} si no hay navegador. */
  run(req: BrowserRequest): Promise<BrowserReport>;
}

/** Anchos por defecto: escritorio y móvil. */
export const DEFAULT_WIDTHS = [1280, 390] as const;
/** Timeout por paso. */
export const STEP_TIMEOUT_MS = 10_000;
/** Timeout por recorrido (un ancho). */
export const RUN_TIMEOUT_MS = 90_000;

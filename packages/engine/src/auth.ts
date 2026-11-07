import { timingSafeEqual } from "node:crypto";

/** Orígenes del dev server de la UI que pueden conectarse en desarrollo. */
export const DEV_UI_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const FIXED_ORIGINS = ["null", "file://", "app://"];

/**
 * Compara tokens en tiempo constante.
 * @param expected Token que generó el proceso main.
 * @param received Token que llegó en el `hello`.
 */
export function tokenMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Decide si un upgrade WebSocket es aceptable según su cabecera Origin.
 * Sin Origin (clientes que no son navegador) se acepta: el token sigue siendo obligatorio.
 * @param origin Valor de la cabecera `Origin`, si existe.
 * @param allowed Orígenes web adicionales permitidos.
 */
export function originAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (origin === undefined) return true;
  return FIXED_ORIGINS.includes(origin) || allowed.includes(origin);
}

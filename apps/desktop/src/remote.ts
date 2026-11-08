import type { EngineConfigInput } from "@fabrica/events";

/** Largo mínimo del token de un motor remoto (bytes), el mismo que exige el motor. */
export const MIN_TOKEN_BYTES = 32;
const MAX_TOKEN_BYTES = 256;

/**
 * Valida la URL de un motor remoto: `wss://` (o `ws://127.0.0.1` para probar en la misma PC),
 * sin credenciales, query ni fragmento.
 * @param raw Texto recibido por IPC (no confiable).
 * @returns La URL normalizada, o null si no sirve.
 */
export function parseRemoteUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 512) return null;
  try {
    const u = new URL(raw.trim());
    const secure = u.protocol === "wss:";
    const local = u.protocol === "ws:" && u.hostname === "127.0.0.1";
    if (!secure && !local) return null;
    if (u.username || u.password || u.search || u.hash || !u.hostname) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Indica si un token cumple el mínimo (32 bytes) y no tiene espacios.
 * @param token Valor recibido por IPC (no confiable).
 */
export function isValidEngineToken(token: unknown): token is string {
  return typeof token === "string" && Buffer.byteLength(token) >= MIN_TOKEN_BYTES && Buffer.byteLength(token) <= MAX_TOKEN_BYTES && !/\s/.test(token);
}

/**
 * Comprueba la entrada de `engine.setConfig` antes de tocar el disco.
 * @param input Entrada de la UI (no confiable).
 * @param hasToken Si ya hay un token guardado.
 * @returns El código de error o null si es válida.
 */
export function configError(input: EngineConfigInput, hasToken: boolean): "invalid_url" | "invalid_token" | "token_required" | null {
  if (input.mode === "local") return null;
  if (parseRemoteUrl(input.url) === null) return "invalid_url";
  if (input.token === undefined) return hasToken ? null : "token_required";
  return isValidEngineToken(input.token) ? null : "invalid_token";
}

/**
 * Valida que una URL de vista previa sea del servidor local (`http://127.0.0.1:<puerto>/`).
 * @param raw URL tal como la informó el motor.
 * @returns La URL normalizada, o `null` si no es segura para embeber.
 */
export function safePreviewUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const local = url.protocol === "http:" && url.hostname === "127.0.0.1" && url.port !== "";
    return local && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

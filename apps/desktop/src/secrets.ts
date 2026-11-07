import { app, safeStorage } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";

const MIN_LENGTH = 20;
const MAX_LENGTH = 512;

const secretsFile = () => path.join(app.getPath("userData"), "secrets.bin");

/**
 * Valida el formato de una API key de Anthropic antes de guardarla.
 * @param key Valor recibido por IPC (no confiable).
 */
export function isValidApiKeyFormat(key: unknown): key is string {
  return (
    typeof key === "string" &&
    key.startsWith("sk-ant-") &&
    key.length >= MIN_LENGTH &&
    key.length <= MAX_LENGTH &&
    !/\s/.test(key)
  );
}

/**
 * Cifra la key con safeStorage (DPAPI en Windows) y la guarda en userData/secrets.bin.
 * Usa la API asíncrona: la síncrona está deprecada en esta versión de Electron.
 * @returns false si el sistema no puede cifrar: en ese caso no se escribe nada.
 */
export async function saveApiKey(key: string): Promise<boolean> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return false;
  await fs.writeFile(secretsFile(), await safeStorage.encryptStringAsync(key), { mode: 0o600 });
  return true;
}

/** Descifra la key guardada; null si no hay o no se puede descifrar. */
export async function loadApiKey(): Promise<string | null> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return null;
  try {
    const { result, shouldReEncrypt } = await safeStorage.decryptStringAsync(await fs.readFile(secretsFile()));
    if (shouldReEncrypt) await saveApiKey(result);
    return result;
  } catch {
    return null;
  }
}

/** Indica si hay una key guardada, sin descifrarla. */
export async function hasApiKey(): Promise<boolean> {
  return fs.access(secretsFile()).then(
    () => true,
    () => false,
  );
}

/** Borra la key guardada. */
export async function clearApiKey(): Promise<void> {
  await fs.rm(secretsFile(), { force: true });
}

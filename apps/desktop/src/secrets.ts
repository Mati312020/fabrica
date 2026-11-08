import { app, safeStorage } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";

const MIN_LENGTH = 20;
const MAX_LENGTH = 512;

const secretsFile = (name = "secrets.bin") => path.join(app.getPath("userData"), name);

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
 * Cifra un secreto con safeStorage (DPAPI en Windows) y lo guarda en userData.
 * Usa la API asíncrona: la síncrona está deprecada en esta versión de Electron.
 * @param value Texto a cifrar.
 * @param name Nombre del archivo dentro de userData.
 * @returns false si el sistema no puede cifrar: en ese caso no se escribe nada.
 */
export async function saveSecret(value: string, name = "secrets.bin"): Promise<boolean> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return false;
  await fs.writeFile(secretsFile(name), await safeStorage.encryptStringAsync(value), { mode: 0o600 });
  return true;
}

/**
 * Descifra un secreto guardado; null si no hay o no se puede descifrar.
 * @param name Nombre del archivo dentro de userData.
 */
export async function loadSecret(name = "secrets.bin"): Promise<string | null> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return null;
  try {
    const { result, shouldReEncrypt } = await safeStorage.decryptStringAsync(await fs.readFile(secretsFile(name)));
    if (shouldReEncrypt) await saveSecret(result, name);
    return result;
  } catch {
    return null;
  }
}

/**
 * Indica si hay un secreto guardado, sin descifrarlo.
 * @param name Nombre del archivo dentro de userData.
 */
export async function hasSecret(name = "secrets.bin"): Promise<boolean> {
  return fs.access(secretsFile(name)).then(
    () => true,
    () => false,
  );
}

/**
 * Borra un secreto guardado.
 * @param name Nombre del archivo dentro de userData.
 */
export async function clearSecret(name = "secrets.bin"): Promise<void> {
  await fs.rm(secretsFile(name), { force: true });
}

/** Cifra y guarda la API key de Anthropic. */
export const saveApiKey = (key: string) => saveSecret(key);
/** Descifra la API key guardada; null si no hay. */
export const loadApiKey = () => loadSecret();
/** Indica si hay una API key guardada. */
export const hasApiKey = () => hasSecret();
/** Borra la API key guardada. */
export const clearApiKey = () => clearSecret();

/** Archivo del token del motor remoto (cifrado igual que la API key). */
export const ENGINE_TOKEN_FILE = "engine-token.bin";

import { app } from "electron";
import path from "node:path";

/**
 * Ruta real del binario del CLI del Agent SDK en la app empaquetada. Está en `app.asar.unpacked`
 * (ver `asarUnpack`): el SDK lo resolvería dentro del asar y Windows no puede ejecutarlo desde ahí.
 * @returns undefined en desarrollo, donde el SDK lo encuentra solo.
 */
export function claudeExecutable(): string | undefined {
  if (!app.isPackaged) return undefined;
  const exe = process.platform === "win32" ? "claude.exe" : "claude";
  const pkg = `claude-agent-sdk-${process.platform}-${process.arch}`;
  return path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "@anthropic-ai", pkg, exe);
}

/** Entorno del proceso del motor: el del padre más `FABRICA_CLAUDE_BIN` si la app está empaquetada. */
export function packagedEnv(): NodeJS.ProcessEnv {
  const bin = claudeExecutable();
  return bin ? { ...process.env, FABRICA_CLAUDE_BIN: bin } : { ...process.env };
}

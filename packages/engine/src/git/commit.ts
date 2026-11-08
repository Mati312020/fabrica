import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { simpleGit } from "simple-git";
import { isInside } from "../workspace/confine.js";

/**
 * Indica si la carpeta ya es la raíz de un repositorio git.
 * @param dir Carpeta del proyecto.
 */
export function isGitRepo(dir: string): boolean {
  return existsSync(path.join(dir, ".git"));
}

/**
 * Agrega `.fabrica/` al `.gitignore` del proyecto si no está (las capturas no se versionan).
 * @param dir Carpeta del proyecto.
 */
export function ensureFabricaIgnored(dir: string): void {
  const file = path.join(dir, ".gitignore");
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const has = current.split(/\r?\n/).some((line) => [".fabrica", ".fabrica/", "/.fabrica", "/.fabrica/"].includes(line.trim()));
  if (has) return;
  const sep = current === "" || current.endsWith("\n") ? "" : "\n";
  writeFileSync(file, `${current}${sep}.fabrica/\n`, "utf8");
}

const queues = new Map<string, Promise<unknown>>();

/** Los bloques corren en paralelo: los commits de un mismo repo se hacen de a uno (`index.lock`). */
function serial<T>(dir: string, job: () => Promise<T>): Promise<T> {
  const run = (queues.get(dir) ?? Promise.resolve()).then(job, job);
  queues.set(dir, run.catch(() => undefined));
  return run;
}

/**
 * Hace `git add` de los archivos del bloque y un commit solo con ellos. Nunca hace push ni usa `--force`.
 * @param dir Carpeta del proyecto (repo git).
 * @param files Archivos del bloque, rutas relativas a `dir`.
 * @param message Mensaje del commit.
 * @returns El hash corto del commit, o null si no había cambios que commitear.
 */
export function commitFiles(dir: string, files: readonly string[], message: string): Promise<string | null> {
  return serial(dir, async () => {
    if (!isGitRepo(dir)) throw new Error("La carpeta no es un repositorio git");
    ensureFabricaIgnored(dir);
    const tracked = [...new Set(files)].filter((f) => isInside(dir, f) && existsSync(path.resolve(dir, f)));
    if (tracked.length === 0) return null;
    const git = simpleGit(dir);
    await git.add(tracked);
    const result = await git.commit(message, tracked);
    return result.commit || null;
  });
}

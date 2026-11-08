import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { DEV_UI_ORIGINS } from "./auth.js";
import type { TlsOptions } from "./listen.js";

/** Largo mínimo del token (bytes). Un token más corto no se acepta nunca. */
export const MIN_TOKEN_BYTES = 32;

/** Configuración resuelta del motor standalone. */
export interface StandaloneConfig {
  host: string;
  port: number;
  token: string;
  /** El token lo generó el proceso (solo loopback): hay que mostrárselo a quien lo lanzó. */
  tokenGenerated: boolean;
  tls?: TlsOptions;
  allowedOrigins: string[];
}

/** Resultado de leer los argumentos: la configuración o el motivo exacto por el que no se arranca. */
export type CliResult = { ok: true; config: StandaloneConfig } | { ok: false; error: string };

/** Lectura de archivos y entorno inyectable, para probar sin tocar el disco. */
export interface CliEnv {
  vars: Record<string, string | undefined>;
  readFile(path: string): string;
}

/** Entorno real del proceso. */
export const realEnv: CliEnv = { vars: process.env, readFile: (p) => readFileSync(p, "utf8") };

/**
 * Indica si un host es de loopback.
 * @param host Valor de `--host`.
 */
export function isLoopback(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  return h === "localhost" || h === "::1" || (isIP(h) === 4 && h.startsWith("127."));
}

/** Banderas con valor; `--allow-origin` puede repetirse. */
const VALUE_FLAGS = ["--host", "--port", "--token-file", "--tls-cert", "--tls-key", "--allow-origin"];

function scan(argv: readonly string[]): { flags: Map<string, string[]>; behindProxy: boolean } | string {
  const flags = new Map<string, string[]>();
  let behindProxy = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--behind-proxy") behindProxy = true;
    else if (VALUE_FLAGS.includes(arg) && argv[i + 1] !== undefined) flags.set(arg, [...(flags.get(arg) ?? []), argv[++i] ?? ""]);
    else return `Argumento desconocido o sin valor: ${arg}`;
  }
  return { flags, behindProxy };
}

function origins(raw: readonly string[]): string[] | string {
  const out: string[] = [];
  for (const item of raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean)) {
    try {
      const o = new URL(item);
      if (!/^https?:$/.test(o.protocol) || o.origin !== item.replace(/\/$/, "")) return `--allow-origin inválido: ${item}`;
      out.push(o.origin);
    } catch {
      return `--allow-origin inválido: ${item}`;
    }
  }
  return out;
}

/**
 * Valida los argumentos del motor standalone. Las reglas son de seguridad, no de comodidad:
 * token de al menos 32 bytes (entorno `FABRICA_TOKEN` o `--token-file`, nunca por argumento) y, si
 * el host no es loopback, TLS propio (`--tls-cert` + `--tls-key`) o `--behind-proxy` explícito.
 * @param argv Argumentos sin `node` ni el script.
 * @param env Entorno y lectura de archivos.
 */
export function parseArgs(argv: readonly string[], env: CliEnv = realEnv): CliResult {
  const scanned = scan(argv);
  if (typeof scanned === "string") return { ok: false, error: scanned };
  const { flags, behindProxy } = scanned;
  const one = (name: string) => flags.get(name)?.at(-1);
  const host = one("--host") ?? "127.0.0.1";
  const port = Number(one("--port") ?? 4317);
  if (!Number.isInteger(port) || port < 0 || port > 65535) return { ok: false, error: "--port inválido" };
  const cert = one("--tls-cert");
  const key = one("--tls-key");
  if (Boolean(cert) !== Boolean(key)) return { ok: false, error: "--tls-cert y --tls-key van juntos" };
  if (!isLoopback(host) && !cert && !behindProxy) {
    return { ok: false, error: `--host ${host} no es loopback: usá --tls-cert y --tls-key, o --behind-proxy si un proxy TLS va delante` };
  }
  const file = one("--token-file");
  let token: string | undefined;
  try {
    token = (file ? env.readFile(file) : (env.vars["FABRICA_TOKEN"] ?? env.vars["FABRICA_DEV_TOKEN"]))?.trim();
  } catch {
    return { ok: false, error: `No se pudo leer --token-file ${file}` };
  }
  const generated = token === undefined && isLoopback(host);
  if (token === undefined && !generated) return { ok: false, error: "Falta el token: definí FABRICA_TOKEN o --token-file" };
  token ??= randomBytes(MIN_TOKEN_BYTES).toString("hex");
  if (Buffer.byteLength(token) < MIN_TOKEN_BYTES) return { ok: false, error: `El token tiene que tener al menos ${MIN_TOKEN_BYTES} bytes` };
  const allowed = origins(flags.get("--allow-origin") ?? []);
  if (typeof allowed === "string") return { ok: false, error: allowed };
  const base = { host, port, token, tokenGenerated: generated, allowedOrigins: [...(isLoopback(host) ? DEV_UI_ORIGINS : []), ...allowed] };
  try {
    return { ok: true, config: cert && key ? { ...base, tls: { cert: env.readFile(cert), key: env.readFile(key) } } : base };
  } catch {
    return { ok: false, error: "No se pudieron leer --tls-cert / --tls-key" };
  }
}

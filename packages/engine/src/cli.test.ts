import { describe, expect, it } from "vitest";
import { MIN_TOKEN_BYTES, isLoopback, parseArgs, type CliEnv } from "./cli.js";

const TOKEN = "k".repeat(MIN_TOKEN_BYTES);
const env = (vars: Record<string, string> = {}, files: Record<string, string> = {}): CliEnv => ({
  vars,
  readFile(p) {
    const content = files[p];
    if (content === undefined) throw new Error("ENOENT");
    return content;
  },
});
const error = (argv: string[], e: CliEnv) => {
  const r = parseArgs(argv, e);
  return r.ok ? null : r.error;
};

describe("standalone: argumentos", () => {
  it("loopback sin token genera uno fuerte", () => {
    const r = parseArgs([], env());
    expect(r.ok && r.config.tokenGenerated && r.config.token.length >= 64).toBe(true);
    expect(r.ok && r.config.host).toBe("127.0.0.1");
  });

  it("rechaza host público sin TLS ni --behind-proxy", () => {
    expect(error(["--host", "0.0.0.0"], env({ FABRICA_TOKEN: TOKEN }))).toMatch(/no es loopback/);
    expect(error(["--host", "203.0.113.5", "--tls-cert", "c.pem"], env({ FABRICA_TOKEN: TOKEN }))).toMatch(/van juntos/);
  });

  it("acepta host público con TLS o con --behind-proxy", () => {
    const files = { "c.pem": "CERT", "k.pem": "KEY" };
    const tls = parseArgs(["--host", "0.0.0.0", "--tls-cert", "c.pem", "--tls-key", "k.pem"], env({ FABRICA_TOKEN: TOKEN }, files));
    expect(tls.ok && tls.config.tls).toEqual({ cert: "CERT", key: "KEY" });
    const proxy = parseArgs(["--host", "0.0.0.0", "--behind-proxy"], env({ FABRICA_TOKEN: TOKEN }));
    expect(proxy.ok && proxy.config.tls).toBeUndefined();
  });

  it("rechaza token corto (entorno o archivo) y exige token si el host no es loopback", () => {
    expect(error([], env({ FABRICA_TOKEN: "corto" }))).toMatch(/32 bytes/);
    expect(error(["--token-file", "t"], env({}, { t: "corto\n" }))).toMatch(/32 bytes/);
    expect(error(["--host", "0.0.0.0", "--behind-proxy"], env())).toMatch(/Falta el token/);
    expect(error(["--token-file", "nada"], env())).toMatch(/No se pudo leer/);
  });

  it("lee el token de un archivo recortando el salto de línea", () => {
    const r = parseArgs(["--token-file", "t"], env({}, { t: `${TOKEN}\n` }));
    expect(r.ok && r.config.token).toBe(TOKEN);
  });

  it("--allow-origin se repite o va separado por comas; solo orígenes http(s) exactos", () => {
    const argv = ["--allow-origin", "https://a.example", "--allow-origin", "https://b.example,https://c.example"];
    const r = parseArgs(argv, env({ FABRICA_TOKEN: TOKEN }));
    expect(r.ok && r.config.allowedOrigins).toEqual(expect.arrayContaining(["https://a.example", "https://b.example", "https://c.example"]));
    expect(error(["--allow-origin", "https://a.example/ruta"], env())).toMatch(/inválido/);
    expect(error(["--allow-origin", "*"], env())).toMatch(/inválido/);
  });

  it("host remoto no hereda los orígenes de desarrollo", () => {
    const r = parseArgs(["--host", "0.0.0.0", "--behind-proxy"], env({ FABRICA_TOKEN: TOKEN }));
    expect(r.ok && r.config.allowedOrigins).toEqual([]);
  });

  it("rechaza argumentos desconocidos o un puerto inválido; --token no existe", () => {
    expect(error(["--token", TOKEN], env())).toMatch(/desconocido/);
    expect(error(["--port", "99999"], env())).toMatch(/--port/);
  });

  it("isLoopback", () => {
    expect(["127.0.0.1", "localhost", "::1", "[::1]"].every(isLoopback)).toBe(true);
    expect(["0.0.0.0", "192.168.1.5", "::"].some(isLoopback)).toBe(false);
  });
});

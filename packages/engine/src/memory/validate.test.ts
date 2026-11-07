import { describe, expect, it } from "vitest";
import { LIMITS, SECRET_PATTERNS, validateLearning, type Learning } from "./validate.js";

const good: Learning = { titulo: "Usar reloj inyectado", contenido: "Las funciones de expiración reciben el reloj.", etiquetas: ["tests"] };
const reason = (over: Partial<Learning>) => {
  const r = validateLearning({ ...good, ...over });
  return r.ok ? "ok" : r.reason;
};

const samples: Record<string, string> = {
  "sk-ant-": "la clave es sk-ant-api03-abc",
  "ghp_": "token ghp_abcdefghijklmnop",
  "github_pat_": "usar github_pat_11ABC",
  "AKIA": "id AKIAIOSFODNN7EXAMPLE",
  "-----BEGIN": "-----BEGIN RSA PRIVATE KEY-----",
  "password=": "config password=hunter2",
  "token_largo": "valor 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
};

describe("validación anti-secretos", () => {
  it("acepta un aprendizaje normal y lo normaliza", () => {
    const r = validateLearning({ titulo: "  Usar reloj inyectado ", contenido: " x ", etiquetas: [" a ", ""] });
    expect(r).toEqual({ ok: true, value: { titulo: "Usar reloj inyectado", contenido: "x", etiquetas: ["a"] } });
  });

  it("hay una muestra por cada patrón", () => {
    expect(Object.keys(samples).sort()).toEqual(SECRET_PATTERNS.map((p) => p.name).sort());
  });

  for (const [name, text] of Object.entries(samples)) {
    it(`rechaza ${name} en el contenido`, () => expect(reason({ contenido: text })).toBe(`secreto:${name}`));
    it(`rechaza ${name} en el título y en las etiquetas`, () => {
      expect(reason({ titulo: text.slice(0, 100) })).toBe(`secreto:${name}`);
      expect(reason({ etiquetas: [text] })).toBe(`secreto:${name}`);
    });
  }

  it("rechaza base64 largo pero no palabras largas ni rutas cortas", () => {
    expect(reason({ contenido: "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5" })).toBe("secreto:token_largo");
    expect(reason({ contenido: "internacionalización de packages/engine/src" })).toBe("ok");
  });

  it("aplica los límites de largo", () => {
    expect(reason({ titulo: "ab" })).toBe("titulo_fuera_de_rango");
    expect(reason({ titulo: "abc" })).toBe("ok");
    expect(reason({ titulo: "a b ".repeat(LIMITS.tituloMax) })).toBe("titulo_fuera_de_rango");
    expect(reason({ titulo: "t ".repeat(60).trim() })).toBe("ok");
    expect(reason({ contenido: "x ".repeat(LIMITS.contenidoMax) })).toBe("contenido_fuera_de_rango");
    expect(reason({ contenido: "ab ".repeat(666) })).toBe("ok");
    expect(reason({ contenido: "   " })).toBe("contenido_fuera_de_rango");
    expect(reason({ etiquetas: Array.from({ length: 8 }, (_, i) => `t${i}`) })).toBe("ok");
    expect(reason({ etiquetas: Array.from({ length: 9 }, (_, i) => `t${i}`) })).toBe("demasiadas_etiquetas");
  });
});

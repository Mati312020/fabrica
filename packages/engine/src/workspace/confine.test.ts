import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkToolUse, isInside } from "./confine.js";

const root = path.resolve("proyecto-de-prueba");
const READ = ["Read", "Glob", "Grep", "Write"];
const check = (tool: string, input: Record<string, unknown>) => checkToolUse(READ, root, tool, input).ok;

describe("isInside", () => {
  it("acepta rutas relativas y absolutas dentro de la carpeta", () => {
    expect(isInside(root, "src/a.ts")).toBe(true);
    expect(isInside(root, "./src/../b.ts")).toBe(true);
    expect(isInside(root, path.join(root, "x", "y.ts"))).toBe(true);
    expect(isInside(root, ".")).toBe(true);
  });

  it("rechaza .. que escapa, absolutas ajenas y carpetas hermanas con el mismo prefijo", () => {
    expect(isInside(root, "../otro.ts")).toBe(false);
    expect(isInside(root, "src/../../otro.ts")).toBe(false);
    expect(isInside(root, path.resolve(root, "..", "otro.ts"))).toBe(false);
    expect(isInside(root, `${root}-hermana${path.sep}a.ts`)).toBe(false);
  });

  it.runIf(process.platform === "win32")("rechaza otra unidad y rutas UNC", () => {
    expect(isInside(root, ["Z:", "secreto.txt"].join(path.sep))).toBe(false);
    expect(isInside(root, [path.sep + path.sep + "servidor", "share", "a.txt"].join(path.sep))).toBe(false);
  });

  it("acepta nombres que empiezan con dos puntos pero no escapan", () => {
    expect(isInside(root, "..oculto/a.ts")).toBe(true);
  });
});

describe("checkToolUse", () => {
  it("permite herramientas del rol con rutas internas", () => {
    expect(check("Read", { file_path: "src/a.ts" })).toBe(true);
    expect(check("Write", { file_path: path.join(root, "n.ts"), content: "x" })).toBe(true);
    expect(check("Grep", { pattern: "../../no-es-ruta", path: "src" })).toBe(true);
    expect(check("Glob", { pattern: "**/*.ts" })).toBe(true);
  });

  it("niega rutas fuera de la carpeta en file_path y path", () => {
    expect(check("Read", { file_path: "../secreto.txt" })).toBe(false);
    expect(check("Write", { file_path: path.resolve(root, "..", "x.ts"), content: "" })).toBe(false);
    expect(check("Grep", { pattern: "x", path: ".." })).toBe(false);
  });

  it("niega patrones glob que salen de la carpeta", () => {
    expect(check("Glob", { pattern: "../**/*.ts" })).toBe(false);
    expect(check("Glob", { pattern: "src/../../**" })).toBe(false);
    expect(check("Glob", { pattern: path.resolve(root, "..", "*.ts").split(path.sep).join("/") })).toBe(false);
    expect(check("Grep", { pattern: "x", glob: "../*.ts" })).toBe(false);
    expect(check("Glob", { pattern: ["src", "..", "..", "x"].join("\\") })).toBe(false);
  });

  it("niega herramientas fuera de la lista del rol y Bash siempre", () => {
    expect(check("WebFetch", { url: "https://example.com" })).toBe(false);
    expect(checkToolUse(["Bash", "Read"], root, "Bash", { command: "ls" }).ok).toBe(false);
  });

  it("deja pasar la salida estructurada interna", () => {
    expect(check("StructuredOutput", { respuesta: "x" })).toBe(true);
  });
});

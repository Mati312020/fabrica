import { afterEach, describe, expect, it } from "vitest";
import { ok, orch, passed, until } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

const learning = (titulo: string, extra: Partial<{ contenido: string; etiquetas: string[] }> = {}) => ({
  titulo, contenido: `Detalle de ${titulo}`, etiquetas: ["norma"], ...extra,
});
const verdict = (aprendizajes: unknown[], aprobado = true) =>
  ok({ ok: aprobado, motivo: aprobado ? "Cumple" : "Falla", sugerencia: "", aprendizajes });
const research = () => ok({ hallazgos: "h", fuentes: [] });
const oneResearch = () => orch({ investigaciones: [{ resumen: "x" }] });

describe("memoria en el motor", () => {
  it("un auditor con aprendizajes guarda, avisa y la tarea siguiente los recibe en su prompt", async () => {
    h = makeHarness({
      orquestador: (_r, call) =>
        orch({ investigaciones: [{ resumen: call === 1 ? "normas ISO para estructuras de madera" : "estructuras de madera: normas aplicables" }] }),
      investigacion: research,
      auditoria: (_r, call) => (call === 1 ? verdict([learning("ISO 13910 clasifica estructuras de madera")]) : passed),
    });
    h.send("chat.send", { texto: "uno" });
    const saved = await h.waitFor("memory.saved");
    expect(saved.data.titulo).toBe("ISO 13910 clasifica estructuras de madera");
    const snapshot = await h.waitFor("memory.snapshot", (d) => d.items.length === 1);
    expect(snapshot.data.items[0]).toMatchObject({ id: saved.data.id, etiquetas: ["norma"] });
    expect(h.of("engine.status").at(-1)?.memoryCount).toBe(1);
    expect(h.memory.repo()?.get(saved.data.id)).toMatchObject({ agente: "investigacion-1" });

    h.send("chat.send", { texto: "ahora estructuras de madera otra vez" });
    await until(() => h.provider.count("investigacion") === 2);
    const [first, second] = h.provider.calls.filter((c) => c.role === "investigacion");
    expect(first?.prompt).not.toContain("Memoria del equipo");
    expect(second?.prompt).toContain("Memoria del equipo");
    expect(second?.prompt).toContain("ISO 13910 clasifica estructuras de madera");
    expect(h.of("agent.tool").some((t) => t.herramienta === "memoria" && t.detalle === "1 recuerdos")).toBe(true);
    const orquestadores = h.provider.calls.filter((c) => c.role === "orquestador");
    expect(orquestadores[1]?.prompt).toContain("títulos relevantes");
  });

  it("un rechazo no guarda nada, aunque traiga aprendizajes", async () => {
    h = makeHarness({
      orquestador: oneResearch,
      investigacion: research,
      auditoria: (_r, call) => (call === 1 ? verdict([learning("No debería guardarse")], false) : passed),
    });
    h.send("chat.send", { texto: "hola" });
    await until(() => h.of("audit.result").length >= 2);
    expect(h.of("audit.result").map((a) => a.ok)).toEqual([false, true]);
    expect(h.of("memory.saved")).toEqual([]);
    expect(h.memory.repo()?.count()).toBe(0);
  });

  it("guarda como máximo 3 por auditoría", async () => {
    const five = ["Uno aprendido", "Dos aprendido", "Tres aprendido", "Cuatro aprendido", "Cinco aprendido"].map((t) => learning(t));
    h = makeHarness({ orquestador: oneResearch, investigacion: research, auditoria: () => verdict(five) });
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("memory.snapshot", (d) => d.items.length === 3);
    expect(h.of("memory.saved").map((s) => s.titulo)).toEqual(["Uno aprendido", "Dos aprendido", "Tres aprendido"]);
  });

  it("rechaza en silencio los recuerdos con secretos y lo registra como memory_rejected", async () => {
    const bad = learning("Clave de la API", { contenido: "usar sk-ant-api03-secreta" });
    h = makeHarness({
      orquestador: oneResearch,
      investigacion: research,
      auditoria: () => verdict([bad, learning("Regla válida y útil")]),
    });
    h.send("chat.send", { texto: "hola" });
    const err = await h.waitFor("engine.error", (d) => d.code === "memory_rejected");
    expect(err.data.message).not.toContain("api03");
    await h.waitFor("memory.saved");
    expect(h.of("memory.saved").map((s) => s.titulo)).toEqual(["Regla válida y útil"]);
  });

  it("memory.read responde con el contenido y memory.delete borra y avisa", async () => {
    h = makeHarness({ orquestador: oneResearch, investigacion: research, auditoria: () => verdict([learning("Dato reutilizable")]) });
    h.send("chat.send", { texto: "hola" });
    const { data } = await h.waitFor("memory.saved");
    h.send("memory.read", { id: data.id });
    const content = await h.waitFor("memory.content");
    expect(content.data).toMatchObject({ id: data.id, titulo: "Dato reutilizable", contenido: "Detalle de Dato reutilizable", etiquetas: ["norma"] });
    h.send("memory.delete", { id: data.id });
    await h.waitFor("memory.deleted");
    expect(h.of("memory.snapshot").at(-1)?.items).toEqual([]);
    expect(h.of("engine.status").at(-1)?.memoryCount).toBe(0);
    h.send("memory.read", { id: data.id });
    await h.waitFor("engine.error", (d) => d.code === "memory_not_found");
  });

  it("sin base abierta todo sigue funcionando", async () => {
    h = makeHarness({ orquestador: oneResearch, investigacion: research, auditoria: () => verdict([learning("Algo útil acá")]) });
    h.memory.close();
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("audit.result");
    expect(h.of("memory.saved")).toEqual([]);
  });
});

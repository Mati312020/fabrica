import { afterEach, describe, expect, it } from "vitest";
import { orch, until } from "../testing/fixtures.js";
import { makeHarness, type Harness } from "../testing/harness.js";

let h: Harness;
afterEach(() => h.close());

describe("configuración y control", () => {
  it("sin carpeta: engine.error no_workspace y mensaje del sistema", async () => {
    h = makeHarness({}, { workspace: null });
    h.send("chat.send", { texto: "hola" });
    expect(await h.waitFor("engine.error")).toMatchObject({ data: { code: "no_workspace" } });
    expect(h.of("chat.message").map((m) => m.rol)).toEqual(["usuario", "sistema"]);
    expect(h.provider.calls).toHaveLength(0);
  });

  it("sin API key: engine.error no_api_key", async () => {
    h = makeHarness({}, { apiKey: false });
    h.send("chat.send", { texto: "hola" });
    expect(await h.waitFor("engine.error")).toMatchObject({ data: { code: "no_api_key" } });
    expect(h.of("chat.message").at(-1)?.rol).toBe("sistema");
  });

  it("pausa: no se despacha nada nuevo hasta reanudar", async () => {
    h = makeHarness({ orquestador: () => orch({ respuesta: "listo" }) });
    h.send("run.pause", {});
    h.send("chat.send", { texto: "hola" });
    await h.waitFor("agent.status", (d) => d.estado === "pausado");
    await new Promise((r) => setTimeout(r, 50));
    expect(h.provider.calls).toHaveLength(0);
    expect(h.of("engine.status").at(-1)).toMatchObject({ paused: true });
    h.send("run.resume", {});
    await until(() => h.of("chat.message").some((m) => m.texto === "listo"));
    expect(h.provider.count("orquestador")).toBe(1);
  });

  it("un fallo del proveedor detiene la tarea con engine.error", async () => {
    h = makeHarness({ orquestador: () => ({ error: { code: "auth", message: "401" } }) });
    h.send("chat.send", { texto: "hola" });
    expect(await h.waitFor("engine.error")).toMatchObject({ data: { code: "provider_error" } });
  });
});

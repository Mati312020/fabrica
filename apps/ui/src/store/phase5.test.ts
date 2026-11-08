import { describe, expect, it } from "vitest";
import { layoutBars, MAX_POINTS } from "../lib/tokenSeries";
import { toAncho } from "../lib/marks";
import { ev, fold } from "./fixtures";
import { usageByModel } from "./selectors";

const spawn = (id: string, modelo: string) => ev("agent.spawned", { id, rama: "codificacion", modelo });
const tokens = (id: string, entrada: number, salida: number, costo: number, s: number) => ev("agent.tokens", { id, entrada, salida, costo }, s);

describe("serie de tokens (Fase 5)", () => {
  it("cada agent.tokens agrega una barra con la diferencia contra el acumulado", () => {
    const s = fold([spawn("a", "sonnet"), tokens("a", 1000, 200, 0.1, 1), tokens("a", 1800, 260, 0.2, 2)]);
    expect(s.agents["a"]?.serie).toEqual([{ entrada: 1000, salida: 200 }, { entrada: 800, salida: 60 }]);
    expect(s.agents["a"]).toMatchObject({ entrada: 1800, salida: 260 });
  });

  it("ignora actualizaciones sin consumo y no pasa del máximo de barras", () => {
    const events = [spawn("a", "haiku"), tokens("a", 10, 1, 0, 1), tokens("a", 10, 1, 0, 2)];
    expect(fold(events).agents["a"]?.serie).toHaveLength(1);
    const many = Array.from({ length: MAX_POINTS + 10 }, (_, i) => tokens("a", (i + 1) * 10, (i + 1), 0, i % 50));
    expect(fold([spawn("a", "haiku"), ...many]).agents["a"]?.serie).toHaveLength(MAX_POINTS);
  });

  it("escala las barras al mayor valor de la serie", () => {
    const bars = layoutBars([{ entrada: 100, salida: 50 }, { entrada: 50, salida: 0 }], 30, 8);
    expect(bars).toEqual([{ x: 0, inH: 30, outH: 15 }, { x: 8, inH: 15, outH: 0 }]);
    expect(layoutBars([], 30, 8)).toEqual([]);
  });

  it("el presupuesto resume costo y tokens por modelo", () => {
    const s = fold([
      spawn("o", "opus"), spawn("s1", "sonnet"), spawn("s2", "sonnet"),
      tokens("o", 100, 10, 1.5, 1), tokens("s1", 1000, 100, 0.2, 2), tokens("s2", 500, 50, 0.1, 3),
    ]);
    const usage = usageByModel(s.agents);
    expect(usage.opus).toEqual({ costo: 1.5, entrada: 100, salida: 10 });
    expect(usage.sonnet.entrada).toBe(1500);
    expect(usage.sonnet.costo).toBeCloseTo(0.3);
    expect(usage.haiku).toEqual({ costo: 0, entrada: 0, salida: 0 });
  });

  it("el ancho de la UI se traduce al del contrato", () => {
    expect(toAncho("desktop")).toBe("escritorio");
    expect(toAncho("mobile")).toBe("movil");
  });
});

import type { Handler, Reply } from "./scripted.js";

/** Respuesta con salida válida. */
export const ok = (output: unknown, costUsd?: number): Reply =>
  costUsd === undefined ? { output } : { output, costUsd };

/** Veredicto de auditoría aprobada. */
export const passed: Reply = ok({ ok: true, motivo: "Cumple", sugerencia: "" });

/** Guion de auditor que siempre aprueba. */
export const auditOk: Handler = () => passed;

/** Auditoría rechazada con motivo. */
export const auditNo = (motivo: string): Reply => ok({ ok: false, motivo, sugerencia: "" });

/** Salida del orquestador con valores por defecto. */
export const orch = (over: Record<string, unknown> = {}, costUsd?: number): Reply =>
  ok({ respuesta: "Voy", ramas: [], investigaciones: [], pedirPlan: false, ...over }, costUsd);

/** Salida de codificación. */
export const code: Handler = () => ok({ resumen: "hecho", archivos: ["a.ts"] });

/** Recorrido de ejemplo de un bloque visual. */
export const walk = [
  { accion: "ir" as const, valor: "/" },
  { accion: "click" as const, selector: "#enviar" },
];

/** Salida de codificación de un bloque visual, con `recorrido`. */
export const codeVisual: Handler = () => ok({ resumen: "hecho", archivos: ["index.html"], recorrido: walk });

/** Bloque de plan. */
export const blk = (id: string, dependeDe: string[] = [], tipo: "visual" | "tecnico" = "tecnico") => ({
  id, nombre: `Bloque ${id}`, tipo, dependeDe, familia: "azul", descripcion: `Hacer ${id}`,
});

/** Salida de planificación. */
export const planOf = (...bloques: ReturnType<typeof blk>[]): Reply => ok({ resumen: "Plan", bloques });

/** Espera a que se cumpla una condición (máx. 5 s). */
export async function until(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 500 && !cond(); i++) await new Promise((r) => setTimeout(r, 10));
  if (!cond()) throw new Error("La condición no se cumplió a tiempo");
}

/** Verifica que `expected` aparezca en `actual` como subsecuencia. */
export function inOrder(actual: string[], expected: string[]): boolean {
  let at = 0;
  for (const t of actual) if (t === expected[at]) at++;
  return at === expected.length;
}

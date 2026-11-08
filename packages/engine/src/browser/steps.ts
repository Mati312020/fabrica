import type { Page } from "playwright-core";
import type { Step } from "../roles/schemas.js";

const MAX_WAIT_MS = 3000;

/**
 * Texto corto de un paso para el detalle de `agent.tool`.
 * @param step Paso del recorrido.
 * @param index Posición desde 0.
 * @param total Cantidad de pasos.
 */
export function describeStep(step: Step, index: number, total: number): string {
  const target = (step.selector ?? step.valor ?? "").slice(0, 60);
  return `paso ${index + 1}/${total} · ${step.accion}${target ? ` ${target}` : ""}`;
}

function need(value: string | undefined, what: string): string {
  if (!value) throw new Error(`falta ${what}`);
  return value;
}

/**
 * Ejecuta un paso. Lanza un error con el motivo si no se pudo hacer.
 * @param page Página abierta.
 * @param step Paso del recorrido.
 * @param baseUrl Origen permitido: `ir` no puede salir de él.
 */
export async function runStep(page: Page, step: Step, baseUrl: string): Promise<void> {
  switch (step.accion) {
    case "ir": {
      const target = new URL(step.valor ?? "/", baseUrl);
      if (target.origin !== new URL(baseUrl).origin) throw new Error(`destino fuera de la vista previa: ${target.origin}`);
      await page.goto(target.href, { waitUntil: "load" });
      return;
    }
    case "click":
      return page.locator(need(step.selector, "selector")).first().click();
    case "escribir":
      return page.locator(need(step.selector, "selector")).first().fill(need(step.valor, "valor"));
    case "esperar": {
      if (step.selector) return page.locator(step.selector).first().waitFor({ state: "visible" });
      const ms = Math.min(Math.max(Number.parseInt(step.valor ?? "", 10) || 500, 0), MAX_WAIT_MS);
      return page.waitForTimeout(ms);
    }
    case "verificarTexto": {
      const expected = need(step.valor, "valor");
      const text = await page.locator(step.selector ?? "body").first().innerText();
      if (!text.includes(expected)) throw new Error(`no aparece el texto "${expected}"`);
      return;
    }
  }
}

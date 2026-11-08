import path from "node:path";
import { NoBrowserError, type BrowserReport } from "../browser/types.js";
import { ensureFabricaIgnored, isGitRepo } from "../git/commit.js";
import type { CodeOut } from "../roles/schemas.js";
import { auditTask, type AuditVerdict } from "./audit.js";
import type { Ctx } from "./context.js";
import type { TaskSpec } from "./task.js";

const MAX_REPORT_CHARS = 4000;

function section(title: string, items: string[]): string {
  return items.length ? `${title}:\n${items.map((i) => `- ${i}`).join("\n")}` : `${title}: ninguno`;
}

/** Informe en texto para el auditor. */
function formatReport(r: BrowserReport): string {
  const text = [
    "Informe del recorrido en navegador (ejecutado por el motor en 1280 px y 390 px):",
    section("Errores de consola", r.errores),
    section("Requests fallidos", r.fallidos),
    section("Pasos que no se pudieron hacer", r.pasosFallidos),
    `Capturas (abrilas con Read):\n${r.capturas.map((c) => `- ${c}`).join("\n")}`,
  ].join("\n");
  return text.slice(0, MAX_REPORT_CHARS);
}

/**
 * Recorre el bloque visual en el navegador de forma determinista y vuelve a auditar con el informe.
 * Sin navegador emite `engine.error no_browser` y se queda con el veredicto de la auditoría de código.
 * @param ctx Contexto de la corrida.
 * @param spec Tarea del bloque.
 * @param out Salida de codificación (con `recorrido`).
 * @param agent Agente que produjo el bloque.
 * @param code Veredicto ya aprobado de la auditoría de código.
 */
export async function browserAudit(ctx: Ctx, spec: TaskSpec, out: CodeOut, agent: string, code: AuditVerdict): Promise<AuditVerdict> {
  const dir = ctx.state.workspace;
  if (!dir || !out.recorrido?.length) return code;
  let report: BrowserReport;
  try {
    if (isGitRepo(dir)) ensureFabricaIgnored(dir);
    report = await ctx.browser.run({
      baseUrl: await ctx.preview.urlFor(dir), recorrido: out.recorrido, prefix: spec.id,
      outDir: path.join(dir, ".fabrica", "capturas"),
      onStep: (detail) => ctx.emit("agent.tool", { id: agent, herramienta: "navegador", detalle: detail }),
    });
  } catch (error) {
    const missing = error instanceof NoBrowserError;
    const message = missing
      ? "Edge no está disponible: el bloque sigue solo con la auditoría de código"
      : `El recorrido en el navegador falló: ${error instanceof Error ? error.message : String(error)}`;
    ctx.emit("engine.error", { code: missing ? "no_browser" : "browser_failed", message });
    return code;
  }
  if (spec.blockId) ctx.captures.set(spec.blockId, report.capturas);
  ctx.emit("audit.browserReport", { taskId: spec.id, ...report });
  return auditTask(ctx, spec.id, spec.resumen, out, agent, formatReport(report));
}

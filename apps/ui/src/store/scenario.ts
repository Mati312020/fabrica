import type { FabricaEvent } from "@fabrica/events";
import { ev } from "./fixtures";

const bloques = [
  { id: "auth", nombre: "auth", tipo: "tecnico", dependeDe: [], familia: "nucleo" },
  { id: "db", nombre: "esquema-db", tipo: "tecnico", dependeDe: ["auth"], familia: "nucleo" },
  { id: "ui", nombre: "ui-login", tipo: "visual", dependeDe: ["db"], familia: "interfaz" },
];

/** Primera parte: chat, ramas, investigación y plan listo para aprobar. */
export const planning: FabricaEvent[] = [
  ev("engine.ready", { version: "1.0.0", protocol: 1 }),
  ev("engine.status", { apiKeyConfigured: true, paused: false, workspace: "D:\\proyectos\\demo", budgetLimit: 5 }),
  ev("chat.message", { rol: "usuario", texto: "Quiero un login" }, 1),
  ev("agent.spawned", { id: "orquestador", rama: "orquestador", modelo: "opus" }, 1),
  ev("branch.created", { id: "investigacion", tipo: "investigacion", nombre: "Investigación" }, 2),
  ev("branch.created", { id: "planificacion", tipo: "planificacion", nombre: "Planificación" }, 2),
  ev("branch.created", { id: "auditoria", tipo: "auditoria", nombre: "Auditoría" }, 2),
  ev("agent.spawned", { id: "investigacion-1", rama: "investigacion", modelo: "haiku" }, 3),
  ev("agent.spawned", { id: "auditoria-1", rama: "auditoria", modelo: "opus" }, 3),
  ev("task.assigned", { taskId: "t1", de: "orquestador", a: "investigacion-1", resumen: "buscar" }, 3),
  ev("agent.status", { id: "investigacion-1", estado: "trabajando" }, 4),
  ev("agent.progress", { id: "investigacion-1", pct: 40 }, 5),
  ev("task.toAudit", { taskId: "t1", auditorId: "auditoria-1" }, 6),
  ev("agent.status", { id: "auditoria-1", estado: "pensando" }, 6),
  ev("audit.result", { taskId: "t1", ok: true, motivo: "" }, 7),
  ev("plan.ready", { planId: "p1", bloques }, 8),
];

/** Segunda parte: plan aprobado, bloque visual aprobado por la persona y ensamblado. */
export const building: FabricaEvent[] = [
  ev("branch.created", { id: "codificacion", tipo: "codificacion", nombre: "Codificación" }, 10),
  ev("agent.spawned", { id: "codificacion-1", rama: "codificacion", modelo: "haiku" }, 11),
  ev("task.assigned", { taskId: "t2", de: "orquestador", a: "codificacion-1", resumen: "auth", blockId: "auth" }, 11),
  ev("block.progress", { blockId: "auth", pct: 60 }, 12),
  ev("agent.tokens", { id: "codificacion-1", entrada: 1000, salida: 200, costo: 0.25 }, 12),
  ev("budget.update", { usado: 0.25, limite: 5 }, 12),
  ev("block.assembled", { blockId: "auth" }, 13),
  ev("block.approvalRequested", { blockId: "ui", previewUrl: "", archivos: ["login.tsx"] }, 14),
];

/** Tercera parte: tres rechazos, escalado, bloqueo y pausa por presupuesto. */
export const failing: FabricaEvent[] = [
  ...[1, 2, 3].map((n) => ev("audit.result", { taskId: "t2", ok: false, motivo: `falla ${n}` }, 20 + n)),
  ev("task.escalated", { taskId: "t2", modeloAnterior: "haiku", modeloNuevo: "sonnet" }, 24),
  ev("agent.spawned", { id: "codificacion-2", rama: "codificacion", modelo: "sonnet", escaladoDesde: "haiku" }, 24),
  ev("task.blocked", { taskId: "t2", motivo: "Opus falló tres veces" }, 25),
  ev("budget.update", { usado: 4.8, limite: 5 }, 26),
  ev("budget.paused", { pct: 96 }, 26),
];

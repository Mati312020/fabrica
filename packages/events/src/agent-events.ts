import { z } from "zod";
import { AGENT_STATES, MODELS } from "./constants.js";
import { msg, nonNegative } from "./envelope.js";

const tags = z.array(z.string());

const model = z.enum(MODELS);

/** Eventos del motor sobre ramas, agentes, tareas, auditoría y memoria (§9). */
export const agentEventSchemas = [
  msg("branch.created", { id: z.string(), tipo: z.string(), nombre: z.string() }),
  msg("agent.spawned", {
    id: z.string(),
    rama: z.string(),
    modelo: model,
    escaladoDesde: model.optional(),
  }),
  msg("task.assigned", {
    taskId: z.string(),
    de: z.string(),
    a: z.string(),
    resumen: z.string(),
    blockId: z.string().optional(),
  }),
  msg("agent.status", { id: z.string(), estado: z.enum(AGENT_STATES) }),
  msg("agent.progress", { id: z.string(), pct: z.number().min(0).max(100) }),
  msg("agent.tool", { id: z.string(), herramienta: z.string(), detalle: z.string() }),
  msg("agent.tokens", {
    id: z.string(),
    entrada: nonNegative,
    salida: nonNegative,
    costo: nonNegative,
  }),
  msg("agent.output", { id: z.string(), texto: z.string() }),
  msg("task.toAudit", { taskId: z.string(), auditorId: z.string() }),
  msg("audit.result", { taskId: z.string(), ok: z.boolean(), motivo: z.string() }),
  msg("audit.browserReport", {
    taskId: z.string(),
    /** Errores de consola y excepciones de la página. */
    errores: z.array(z.string()),
    /** Requests fallidos (4xx/5xx o de red). */
    fallidos: z.array(z.string()),
    /** Pasos del recorrido que no se pudieron hacer. */
    pasosFallidos: z.array(z.string()),
    /** Rutas absolutas de las capturas en `<proyecto>/.fabrica/capturas/`. */
    capturas: z.array(z.string()),
  }),
  msg("task.escalated", { taskId: z.string(), modeloAnterior: model, modeloNuevo: model }),
  msg("task.blocked", { taskId: z.string(), motivo: z.string() }),
  msg("memory.saved", { id: z.string(), titulo: z.string() }),
  msg("memory.deleted", { id: z.string(), titulo: z.string() }),
  msg("memory.snapshot", {
    items: z.array(
      z.object({ id: z.string(), titulo: z.string(), etiquetas: tags, proyecto: z.string(), actualizado: z.string() }),
    ),
  }),
  msg("memory.content", {
    id: z.string(),
    titulo: z.string(),
    contenido: z.string(),
    etiquetas: tags,
    proyecto: z.string(),
    agente: z.string(),
    tarea: z.string(),
    creado: z.string(),
    actualizado: z.string(),
  }),
] as const;

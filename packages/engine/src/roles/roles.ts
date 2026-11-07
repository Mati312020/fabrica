import type { ModelName } from "@fabrica/events";
import type { z } from "zod";
import type { RoleName } from "../provider/types.js";
import { PROMPTS } from "./prompts.js";
import { auditOut, codeOut, orchestratorOut, planOut, researchOut } from "./schemas.js";

/** Definición fija de un rol: modelo inicial, herramientas, prompt y esquema de salida. */
export interface RoleDef {
  model: ModelName;
  tools: readonly string[];
  system: string;
  schema: z.ZodType;
}

const READ = ["Read", "Glob", "Grep"] as const;

/** Tabla de roles (spec Fase 1). Bash no figura en ninguno. */
export const ROLES: Record<RoleName, RoleDef> = {
  orquestador: { model: "opus", tools: [], system: PROMPTS.orquestador, schema: orchestratorOut },
  investigacion: {
    model: "haiku",
    tools: ["WebSearch", "WebFetch", ...READ],
    system: PROMPTS.investigacion,
    schema: researchOut,
  },
  planificacion: { model: "opus", tools: READ, system: PROMPTS.planificacion, schema: planOut },
  codificacion: {
    model: "sonnet",
    tools: ["Read", "Write", "Edit", "Glob", "Grep"],
    system: PROMPTS.codificacion,
    schema: codeOut,
  },
  auditoria: { model: "opus", tools: READ, system: PROMPTS.auditoria, schema: auditOut },
};

/** Escalera de modelos: Haiku → Sonnet → Opus. */
export const LADDER: readonly ModelName[] = ["haiku", "sonnet", "opus"];

/**
 * Modelo inmediatamente superior, o null si ya es el máximo.
 * @param model Modelo actual.
 */
export function nextModel(model: ModelName): ModelName | null {
  return LADDER[LADDER.indexOf(model) + 1] ?? null;
}

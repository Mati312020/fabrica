import { z } from "zod";
import { agentEventSchemas } from "./agent-events.js";
import { runEventSchemas } from "./run-events.js";

/** Unión discriminada por `type` de todos los eventos motor -> UI. */
export const eventSchema = z.discriminatedUnion("type", [
  ...agentEventSchemas,
  ...runEventSchemas,
]);

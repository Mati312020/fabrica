import { z } from "zod";

/**
 * Arma el schema de un mensaje `{ type, at, data }` para un tipo dado.
 * @param type Nombre del evento o comando.
 * @param shape Campos de `data`.
 */
export function msg<T extends string, S extends z.ZodRawShape>(type: T, shape: S) {
  return z.object({
    type: z.literal(type),
    at: z.iso.datetime(),
    data: z.object(shape),
  });
}

/** Número mayor o igual a cero (tokens, costos, montos). */
export const nonNegative = z.number().nonnegative();

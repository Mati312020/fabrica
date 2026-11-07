import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const settingsSchema = z.object({ workspace: z.string().nullable().default(null) });

/** Ajustes no secretos de la app, guardados en `userData/settings.json`. */
export type Settings = z.infer<typeof settingsSchema>;

const settingsFile = () => path.join(app.getPath("userData"), "settings.json");

/** Lee los ajustes; si el archivo falta o está roto, devuelve los valores por defecto. */
export async function loadSettings(): Promise<Settings> {
  try {
    return settingsSchema.parse(JSON.parse(await fs.readFile(settingsFile(), "utf8")));
  } catch {
    return settingsSchema.parse({});
  }
}

/**
 * Guarda cambios parciales de los ajustes.
 * @param patch Campos a actualizar.
 */
export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...(await loadSettings()), ...patch };
  await fs.writeFile(settingsFile(), JSON.stringify(next, null, 2), "utf8");
}

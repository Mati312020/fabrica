/** Nombres de los canales IPC compartidos entre main y preload. */
export const CHANNELS = {
  getConnection: "engine:getConnection",
  engineExit: "engine:exit",
  apiKeySet: "apiKey:set",
  apiKeyStatus: "apiKey:status",
  apiKeyClear: "apiKey:clear",
} as const;

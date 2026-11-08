/** Nombres de los canales IPC compartidos entre main y preload. */
export const CHANNELS = {
  getConnection: "engine:getConnection",
  engineConfigGet: "engine:configGet",
  engineConfigSet: "engine:configSet",
  engineExit: "engine:exit",
  apiKeySet: "apiKey:set",
  apiKeyStatus: "apiKey:status",
  apiKeyClear: "apiKey:clear",
  workspaceChoose: "workspace:choose",
  workspaceCurrent: "workspace:current",
} as const;

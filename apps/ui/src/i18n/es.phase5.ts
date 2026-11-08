/** Textos de la Fase 5 (motor local o remoto, gráficos de tokens) en español. */
export const esPhase5 = {
  engine: {
    title: "Motor",
    local: "Local",
    remote: "Remoto",
    localHelp: "El motor corre en esta computadora, dentro de la app.",
    remoteHelp: "El motor corre en un servidor. La carpeta del proyecto y la API key son del servidor, no de esta computadora.",
    url: "URL del motor remoto",
    token: "Token del motor remoto",
    tokenPlaceholder: "Token (mínimo 32 bytes)",
    tokenSaved: "Token guardado (dejalo vacío para conservarlo)",
    apply: "Aplicar y reiniciar",
    restarting: "Guardado. La app se reinicia para usar el motor elegido…",
    errors: {
      invalid_url: "La URL tiene que ser wss://… (sin usuario, parámetros ni #).",
      invalid_token: "El token tiene que tener al menos 32 bytes y no puede tener espacios.",
      token_required: "Falta el token del motor remoto.",
      encryption_unavailable: "Este sistema no puede cifrar secretos, así que no se guardó.",
    },
  },
};

/** Texto de la API key con motor remoto. */
export const esRemoteKey = "Con motor remoto la API key es una variable de entorno del servidor: no se carga acá.";

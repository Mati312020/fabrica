import { esPanels } from "./es.panels";
import { esPhase4 } from "./es.phase4";
import { esPhase5, esRemoteKey } from "./es.phase5";
import { esRun } from "./es.run";

/** Textos en español rioplatense neutro (idioma por defecto). */
export const es = {
  topbar: {
    noProject: "sin proyecto",
    engine: "motor v{{version}} · protocolo {{protocol}}",
    engineWaiting: "motor sin conectar",
    pause: "Pausar",
    resume: "Reanudar",
    theme: "Tema",
    language: "Idioma",
    settings: "Ajustes",
    chooseFolder: "Elegir carpeta",
    remoteFolder: "carpeta del servidor",
  },
  theme: { oscuro: "Oscuro", claro: "Claro", sistema: "Sistema" },
  connection: {
    conectando: "Conectando",
    conectado: "Conectado",
    desconectado: "Desconectado",
  },
  chat: {
    title: "Chat · orquestador",
    placeholder: "Escribile al orquestador…",
    offline: "Sin conexión con el motor",
    send: "Enviar",
    input: "Mensaje al orquestador",
    who: { usuario: "VOS", orquestador: "OPUS · ORQUESTADOR", sistema: "SISTEMA" },
  },
  log: {
    title: "Registro de sesión",
    empty: "Cada evento del motor aparece acá.",
    count_one: "{{count}} evento",
    count_other: "{{count}} eventos",
  },
  settings: {
    title: "Ajustes",
    close: "Cerrar",
    apiKey: "API key de Anthropic",
    apiKeyHelp: "Se guarda cifrada en esta computadora y nunca vuelve a mostrarse. Conseguila en",
    apiKeyLink: "console.anthropic.com",
    placeholder: "Pegá tu API key",
    save: "Guardar",
    clear: "Borrar",
    configured: "configurada",
    missing: "falta",
    remoteKey: esRemoteKey,
    desktopOnly: "Guardar la API key solo se puede desde la app de escritorio.",
    errors: {
      invalid_format: "La key tiene que empezar con sk-ant- y tener un largo razonable.",
      encryption_unavailable: "Este sistema no puede cifrar secretos, así que no se guardó.",
      engine_unavailable: "El motor no está disponible. Probá de nuevo en unos segundos.",
    },
  },
  ...esRun,
  ...esPanels,
  ...esPhase4,
  ...esPhase5,
};

import type { es } from "./es";
import { enPanels } from "./en.panels";
import { enPhase4 } from "./en.phase4";
import { enRun } from "./en.run";

type Messages = typeof es;

/** English texts; same shape as the Spanish ones. */
export const en: Messages = {
  topbar: {
    noProject: "no project",
    engine: "engine v{{version}} · protocol {{protocol}}",
    engineWaiting: "engine not connected",
    pause: "Pause",
    resume: "Resume",
    theme: "Theme",
    language: "Language",
    settings: "Settings",
    chooseFolder: "Choose folder",
  },
  theme: { oscuro: "Dark", claro: "Light", sistema: "System" },
  connection: {
    conectando: "Connecting",
    conectado: "Connected",
    desconectado: "Disconnected",
  },
  chat: {
    title: "Chat · orchestrator",
    placeholder: "Message the orchestrator…",
    offline: "No connection to the engine",
    send: "Send",
    input: "Message to the orchestrator",
    who: { usuario: "YOU", orquestador: "OPUS · ORCHESTRATOR", sistema: "SYSTEM" },
  },
  log: {
    title: "Session log",
    empty: "Every engine event shows up here.",
    count_one: "{{count}} event",
    count_other: "{{count}} events",
  },
  settings: {
    title: "Settings",
    close: "Close",
    apiKey: "Anthropic API key",
    apiKeyHelp: "It is stored encrypted on this computer and never shown again. Get one at",
    apiKeyLink: "console.anthropic.com",
    placeholder: "Paste your API key",
    save: "Save",
    clear: "Delete",
    configured: "configured",
    missing: "missing",
    desktopOnly: "The API key can only be saved from the desktop app.",
    errors: {
      invalid_format: "The key must start with sk-ant- and have a reasonable length.",
      encryption_unavailable: "This system cannot encrypt secrets, so nothing was saved.",
      engine_unavailable: "The engine is not available. Try again in a few seconds.",
    },
  },
  ...enRun,
  ...enPanels,
  ...enPhase4,
};

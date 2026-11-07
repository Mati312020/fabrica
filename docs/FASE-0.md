# Fase 0 · Esqueleto

> Especificación para implementar. Fuente de verdad del producto: `docs/FABRICA-PROYECTO.md`.
> Fuente de verdad visual: `design/tableros/*.html` (código de Claude Design, leer el CSS y el HTML).

## Objetivo

Monorepo donde Electron abre la UI de React, el motor corre en un proceso Node aparte con un
WebSocket, y la UI se dibuja **solo a partir de eventos** del motor. Configuración: API key
cifrada, tema claro/oscuro/sistema, idioma es/en. **Sin agentes todavía**: no se usa el Claude
Agent SDK en esta fase.

Regla de producto que ya aplica: nada en pantalla es simulado. Donde todavía no hay datos, va un
estado vacío que dice qué va a aparecer ahí. Nada de nodos, bloques o montos de ejemplo.

## Estructura (npm workspaces; no hay pnpm)

```
fabrica/
├─ .gitignore              # PRIMERO, antes de git init
├─ package.json            # workspaces: apps/*, packages/*
├─ tsconfig.base.json      # strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes
├─ eslint.config.js        # typescript-eslint + react-hooks + max-lines
├─ apps/
│  ├─ desktop/             # Electron main + preload
│  └─ ui/                  # Vite + React + TS (renderer, también corre en un navegador)
└─ packages/
   ├─ events/              # contrato §9: tipos + schemas zod
   └─ engine/              # motor: WebSocket + bus de eventos
```

`.gitignore`: `node_modules/`, `dist/`, `out/`, `release/`, `.env*`, `*.db`, `*.sqlite*`,
`*.pem`, `*.key`, `*.p12`, `*.log`, `coverage/`. Después `git init`. **No hacer commits.**

Scripts raíz: `dev` (UI + desktop + Electron), `dev:web` (motor standalone + UI en el navegador),
`build`, `lint`, `typecheck`, `test`. Instalar las versiones estables actuales de cada paquete.

## Reglas de código (obligatorias)

- Archivos de ≤100 líneas. En `eslint.config.js`:
  `"max-lines": ["warn", { max: 100, skipComments: true, skipBlankLines: true }]`.
  El lint tiene que terminar con 0 errores y 0 warnings de max-lines.
- TypeScript estricto en todo. JSDoc en funciones exportadas, hooks y props de componentes.
- Componentes funcionales; lógica en hooks o servicios, el componente solo renderiza.
  Early returns en vez de ternarios anidados.
- Comentarios solo para el porqué. Nada de manejo de errores para casos imposibles: validar en
  los bordes (mensajes WS entrantes, IPC, input del usuario).

## packages/events

- Tipos TS de **todos** los eventos del §9 de `FABRICA-PROYECTO.md`, con los nombres de ese §9
  (`branch.created`, `agent.spawned`, `task.assigned`, `agent.status`, `agent.tool`,
  `agent.tokens`, `agent.output`, `task.toAudit`, `audit.result`, `task.escalated`,
  `memory.saved`, `memory.deleted`, `plan.ready`, `block.progress`, `block.approvalRequested`,
  `block.assembled`, `budget.update`, `budget.warning`, `budget.paused`, `chat.message`).
- Agregados en la sesión local: `agent.progress {id, pct}`, `engine.ready {version, protocol}`,
  `engine.status {apiKeyConfigured, paused}`, `engine.error {code, message}`.
- Comandos UI → motor del §9 (`chat.send`, `plan.approve`, `plan.reject`, `block.approve`,
  `block.reject {comentario}`, `memory.delete`, `budget.useReserve`, `run.pause`,
  `run.resume`) más `hello {token, protocol}` para autenticar.
- Unión discriminada por `type`, sobre `{ type, at: ISO string, data }`. Schemas zod de comandos
  (los valida el motor) y de eventos (los valida la UI). `PROTOCOL_VERSION = 1`.
- Estados de agente: `esperando | pensando | trabajando | en_auditoria | terminado | error |
  pausado | dormido` (dormido sale del diseño, tablero 04).

## packages/engine

- `startEngine({ token, port? })` → levanta `ws` en **127.0.0.1** (nunca 0.0.0.0), puerto 0 por
  defecto (aleatorio), `maxPayload` 64 KB. Devuelve `{ port, close() }`.
- Autenticación: el primer mensaje tiene que ser `hello` con el token correcto
  (`crypto.timingSafeEqual`) y el mismo `protocol`, dentro de 3 s. Si no, cerrar con código
  4401. Rechazar en el upgrade cualquier `Origin` que no sea `null`, `file://`, `app://` o el
  origen del dev server de la UI. Motivo: cualquier página web abierta en el navegador del
  usuario puede intentar conectarse a un puerto de localhost.
- Bus de eventos: `emit(event)` arma `{type, at, data}` y lo manda a todos los clientes
  autenticados. Al autenticarse, el cliente recibe `engine.ready` y `engine.status`.
- Comandos en Fase 0: `chat.send` → responde `chat.message` con rol `sistema` y un texto que
  diga que el motor está conectado y que los agentes llegan en la Fase 1. `run.pause` /
  `run.resume` → actualiza `paused` y emite `engine.status`. El resto: `engine.error` con
  `code: "not_implemented"`. Comando inválido según zod: `engine.error` con
  `code: "bad_command"`, sin cerrar la conexión.
- API key: el motor la recibe **solo** del proceso main por el canal del proceso padre
  (mensaje `{ type: "config.apiKey", key }`), la guarda en memoria y emite
  `engine.status { apiKeyConfigured: true }`. Nunca la manda por WebSocket ni la loguea.
- Entrada de proceso hijo (`src/child.ts`): espera `{type:"init", token}` del padre, arranca y
  responde `{type:"listening", port}`. Entrada standalone (`src/standalone.ts`, solo para
  `dev:web`): puerto fijo 4317, token desde `FABRICA_DEV_TOKEN` o generado e impreso por consola.

## apps/desktop (Electron)

- Ventana 1440×900, mínimo 1100×700, `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, sin `webviewTag`. En dev carga el dev server de la UI; en build,
  los archivos de `apps/ui/dist`.
- Arranca el motor con `utilityProcess.fork`, le genera un token aleatorio de 32 bytes y espera
  `listening`. Si el motor muere, lo informa a la UI por IPC.
- API key con `safeStorage` (DPAPI en Windows), en `userData/secrets.bin`. Si
  `safeStorage.isEncryptionAvailable()` es false, no se guarda y se informa el error. IPC:
  `apiKey:set(key)` (validar que empiece con `sk-ant-` y tenga largo razonable),
  `apiKey:status() → { configured }`, `apiKey:clear()`. La UI **nunca** recibe la key de vuelta.
  Al arrancar, si hay una guardada, se descifra y se manda al motor.
- Preload con `contextBridge`: `window.fabrica = { engine: { getConnection() }, apiKey: { set,
  status, clear }, onEngineExit(cb) }`. Tipado compartido con la UI.

## apps/ui (React)

- Vite + React + TS + **Tailwind v4** (`@tailwindcss/vite`), con los tokens del diseño en
  `@theme`/variables CSS. Fuentes **IBM Plex Mono** e **IBM Plex Sans** empaquetadas con
  `@fontsource` (es una app de escritorio: nada de Google Fonts en runtime).
- CSP en `index.html`: `default-src 'self'; connect-src 'self' ws://127.0.0.1:*;
  style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:`.
- Tokens: copiar los valores de `.th-oscuro` / `.th-claro` y los colores base
  (`--opus-b #a78bfa`, `--sonnet-b #fb923c`, `--haiku-b #60a5fa`, `--ok-b #4ade80`,
  `--err-b #f87171`, `--warn-b #fbbf24`, `--famA-b #2dd4bf`, `--famB-b #f472b6`) de
  `design/tableros/01-principal-oscuro.html`, aplicados en `:root[data-theme="oscuro"|"claro"]`.
  "sistema" sigue a `prefers-color-scheme`. El cambio de tema es un fundido de 180 ms (gramática 12).
- Conexión: hook `useEngine()` que obtiene `{url, token}` de `window.fabrica` (Electron) o, solo en
  `import.meta.env.DEV`, de la query `?ws=&token=` (para `dev:web`). Envía `hello`, valida cada
  evento con zod, reconecta con backoff (1 s → 10 s máx.). Estados visibles: conectando,
  conectado, desconectado.
- Estado: store Zustand alimentado **solo** por `applyEvent(state, event)`, una función pura y
  testeada. Ningún componente escribe estado de dominio por su cuenta.
- i18n: i18next, `es` por defecto, `en` completo. Todo texto visible pasa por `t()`.
- Preferencias (tema, idioma) en `localStorage` envuelto en try/catch.
- Pantalla (layout del tablero 01, mismas proporciones, paneles de vidrio, fondo liso sin retícula):
  - Barra superior: logo "Fabrica!", proyecto ("sin proyecto"), chips Opus/Sonnet/Haiku en gris
    (se tiñen solo con agentes activos: hoy nunca), Pausar/Reanudar (manda `run.pause`/`run.resume`),
    tema (Oscuro/Claro/Sistema), idioma (ES/EN), botón Ajustes, indicador de conexión.
  - Diagrama: estado vacío ("Todavía no hay ejecución. Escribile al orquestador para empezar.").
  - Montaje: estado vacío ("Los bloques aparecen cuando apruebes un plan.").
  - Chat: funcional (manda `chat.send`, muestra `chat.message`). Deshabilitado si no hay conexión.
  - Registro de sesión: cada evento recibido es una línea `hh:mm:ss · tipo · resumen`; la más
    nueva entra 6 px desde abajo a brillo pleno y las anteriores bajan a 70 %, 50 %, 38 %…
    (mínimo 28 %), como en la gramática 10. Sin cursor parpadeante.
  - Presupuesto: estado vacío ("Sin presupuesto configurado").
  - Ajustes (panel lateral): API key (input password, Guardar, Borrar, estado "configurada" /
    "falta"; enlace en texto a console.anthropic.com), tema e idioma.
- `prefers-reduced-motion`: sin desplazamientos, solo cambios de color.

## Tests (vitest)

- events: schemas aceptan/rechazan lo esperado.
- engine: token incorrecto → cierre 4401; token correcto → `engine.ready` + `engine.status`;
  `chat.send` → `chat.message`; comando inválido → `engine.error` sin cerrar.
- ui: `applyEvent` para `chat.message`, `engine.status` y el registro.

## Hecho cuando

`npm install`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasan;
`npm run dev:web` levanta motor + UI en el navegador y el chat recibe la respuesta del motor;
`npm run dev` abre Electron con la misma pantalla. README corto con estos comandos.

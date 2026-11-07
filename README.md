# Alfa

Orquestador visual de agentes Claude. Fase 0: esqueleto (Electron + UI React + motor con WebSocket). Sin agentes todavía.

Documentación: `docs/ALFA-PROYECTO.md` (producto) y `docs/FASE-0.md` (especificación de esta fase).

## Comandos

```
npm install        # instala todo (npm workspaces)
npm run dev        # UI (Vite) + Electron; el motor corre como proceso hijo de Electron
npm run dev:web    # motor standalone (puerto 4317) + UI en el navegador
npm run build      # build de la UI y del proceso main/preload/motor
npm run lint       # ESLint, 0 warnings (incluye max-lines: 100)
npm run typecheck  # tsc --noEmit en cada workspace
npm test           # vitest
```

`dev:web`: el motor imprime la URL con el token (`http://localhost:5173/?ws=...&token=...`). Abrila en el navegador.
Para fijar el token: `ALFA_DEV_TOKEN=...`. La API key solo se guarda desde la app de escritorio.

## Estructura

```
apps/desktop    Electron: main, preload, safeStorage, proceso del motor
apps/ui         Vite + React + Tailwind v4 (renderer)
packages/events contrato de eventos y comandos (zod)
packages/engine motor: WebSocket en 127.0.0.1 + bus de eventos
```

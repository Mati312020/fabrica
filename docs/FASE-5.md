# Fase 5 · Pulido

> Producto: `docs/FABRICA-PROYECTO.md` §4, §10.3 y §12. Fases 0-4 implementadas.

## 1. Detalle de agentes con gráficos de tokens

- En el detalle (tablero 05): anillo de uso de contexto (ya existe) + **serie de tokens** de entrada y
  salida por corrida, como barras finas en SVG propio (sin Recharts: son pocas barras y el estilo del
  diseño es más simple de lograr a mano). Datos: historial de `agent.tokens` acumulado en el store.
- Resumen por modelo en el panel de presupuesto: costo y tokens de Opus, Sonnet y Haiku (ya está en
  el tablero 01).

## 2. Instalador para Windows

- `electron-builder` con destino **NSIS**, `oneClick: false`, elección de carpeta, acceso directo.
  `asar: true`; el SDK del agente y `playwright-core` en `asarUnpack` si lo necesitan (verificar que el
  CLI del SDK arranque desde la app empaquetada).
- Script `npm run dist` → `release/Fabrica-Setup-<versión>.exe`. Ícono propio (cubo isométrico del
  logo) en `apps/desktop/build/icon.ico`.
- **Sin firma de código**: Windows SmartScreen va a advertir al instalar. Firmar requiere un
  certificado (pendiente del usuario).
- Verificación: instalar en la misma PC, abrir, elegir carpeta, que el motor arranque.

## 3. Motor en servidor (opción "c")

- El motor standalone acepta `--host`, `--port` y token obligatorio (≥32 bytes, nunca generado
  débil). Si `--host` no es loopback, exige `--tls-cert` y `--tls-key` (wss) o `--behind-proxy`
  explícito; si no, no arranca.
- Origin: lista configurable (`--allow-origin`).
- La key de Anthropic en servidor: variable de entorno del servicio, nunca por WebSocket.
- Desktop: Ajustes → "Motor": local (default) o remoto (URL `wss://…` + token). El token se guarda
  con `safeStorage` como la API key. Con motor remoto la carpeta del proyecto es del servidor: la UI
  lo muestra así y deshabilita el diálogo de carpeta local.
- Documento `docs/SERVIDOR.md`: cómo levantarlo con systemd/Docker detrás de un proxy TLS.

## Tests

- Arranque del standalone: rechaza host público sin TLS ni `--behind-proxy`; rechaza token corto.
- UI: serie de tokens desde eventos; selector de motor.

## Qué requiere recursos del usuario

- Certificado de firma de código (instalador sin advertencias).
- Un servidor/VPS para probar la opción "c" de punta a punta.
- API key real para ver gráficos con datos reales.

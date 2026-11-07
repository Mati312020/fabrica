# Fase 4 · Web y bloques

> Producto: `docs/FABRICA-PROYECTO.md` §7.3, §8 y §16 (enfoque Hockify). Visual: tableros 01, 06 y 09.
> Fases 0-3 implementadas: leer `packages/*` y `apps/*` antes de tocar nada.

## Objetivo

En proyectos web, el auditor recorre la página generada **como un usuario** (enfoque Hockify: una simulación por la UI
encuentra lo que una lectura de código no ve). El usuario
aprueba los bloques visuales sobre una vista previa embebida, marcando qué cambiar. Los bloques se
ven como cubos isométricos que encastran. Cada bloque aprobado puede quedar como commit.

## 1. Servidor de vista previa

- El motor sirve la carpeta del proyecto (o su `dist/` si existe y tiene `index.html`) con un
  servidor estático propio en **127.0.0.1**, puerto aleatorio, solo lectura, sin listado de
  directorios, sin servir dotfiles (`.git`, `.env`, `.fabrica`). Tipos MIME básicos.
- Fuera de alcance: proyectos que necesitan `npm run dev` (ejecutar comandos del proyecto requiere
  sandbox; ver "Qué queda afuera").

## 2. Auditoría en navegador (Playwright)

- `playwright-core` + `chromium.launch({ channel: "msedge", headless: true })`: usa el Edge instalado
  en Windows, sin descargar navegadores. Si no está, `engine.error { code: "no_browser" }` y el bloque
  sigue solo con auditoría de código.
- El agente de codificación de un bloque **visual** devuelve además
  `recorrido: [{ accion: "ir" | "click" | "escribir" | "esperar" | "verificarTexto", selector?,
  valor? }]` (máx. 15 pasos): cómo usaría un cliente lo que construyó.
- Tras aprobar la auditoría de código, el motor ejecuta el recorrido de forma **determinista** (no lo
  ejecuta el LLM) en dos anchos (1280 y 390): junta errores de consola, requests fallidos (4xx/5xx,
  red), pasos que no se pudieron hacer y capturas por paso en `<proyecto>/.fabrica/capturas/`.
- Luego corre el auditor (rol `auditoria`, herramienta Read para poder abrir las capturas) con ese
  informe. Su salida es la misma `{ ok, motivo, sugerencia, aprendizajes? }`. Rechazo → mismo circuito
  (reintento, escalado).
- Eventos: `agent.tool { herramienta: "navegador", detalle: "paso 3/8 · click #enviar" }` mientras
  corre; `audit.result` como siempre. Nuevo evento `audit.browserReport { taskId, errores, fallidos,
  pasosFallidos, capturas: string[] }` para el detalle.
- Timeouts: 10 s por paso, 90 s por recorrido. El navegador se cierra siempre (try/finally).

## 3. Vista previa embebida y aprobación

- `block.approvalRequested.previewUrl` = URL del servidor de vista previa (ya no vacía para web).
- UI (tablero 06): `<iframe sandbox="allow-scripts allow-forms">` (sin `allow-same-origin`) sobre
  esa URL; CSP de la app suma `frame-src http://127.0.0.1:*`. Selector de ancho (escritorio/móvil).
- **Marcar qué cambiar**: modo "marcar" pone una capa transparente sobre el iframe; cada click deja
  un pin numerado con comentario. `block.reject` suma `marcas: [{ x, y, texto }]` (x, y en % del
  área). Al agente de codificación le llega el comentario más las marcas con la captura del ancho
  correspondiente.
- Bloque **técnico**: lo aprueba el auditor (ver "Qué queda afuera" sobre tests).

## 4. Montaje isométrico (§8.3)

- SVG isométrico (no WebGL): cubos con tres caras derivadas por `color-mix` del color de la
  **familia** del bloque, variantes por luminosidad dentro de la familia. Arriba en construcción
  (contorno fantasma + relleno según `block.progress`); abajo el conjunto, apilado sobre sus
  dependencias (nivel = 1 + máx. nivel de sus dependencias; orden del pintor por profundidad).
- `block.assembled` dispara el encastre de la gramática 09 (sube 6 px, viaja 520 ms, baja, rebote,
  destello). Layout como función pura testeada.

## 5. Git por bloque aprobado

- Ajuste por proyecto "Commit por bloque" (default activado si la carpeta ya es un repo git).
  `simple-git` en la carpeta del proyecto: al `block.assembled`, `git add` de los archivos del bloque
  y commit `Bloque <nombre>: <resumen>`. Nunca `push` automático. Nunca `--force`.
- Evento `block.committed { blockId, hash }`. Si git falla, `engine.error { code: "git_failed" }` y el
  bloque igual queda ensamblado.
- `.fabrica/` se agrega a `.gitignore` del proyecto si no está.
- Crear el repo en GitHub y hacer push: botón manual en Ajustes que usa el `git`/`gh` del sistema con
  las credenciales que el usuario ya tenga; Fabrica! no guarda tokens de GitHub.

## Tests

- Servidor estático: no sirve dotfiles ni sale de la carpeta (`..`, rutas codificadas).
- Ejecutor de recorrido contra una página fixture local (si no hay Edge en CI, el test se salta con
  aviso, no falla).
- Motor con `ScriptedProvider`: bloque visual → recorrido → informe → auditoría; rechazo con marcas
  llega al agente.
- Layout isométrico: niveles por dependencias y orden de pintado.
- Git: commit por bloque en un repo temporal; no commitea si la opción está apagada.

## Qué queda afuera (y por qué)

- **Tests de bloques técnicos y proyectos con `npm run dev`**: requieren ejecutar comandos del
  proyecto en la PC del usuario. El SDK ofrece `sandbox`, pero su soporte en Windows hay que
  verificarlo; sin sandbox es un riesgo real (el modelo podría correr cualquier cosa). Hasta
  resolverlo, los bloques técnicos los aprueba la auditoría de código.
- **Push / crear repo en GitHub automático**: requiere credenciales; queda manual.

## Qué requiere API key real

- Calidad de los recorridos que propone el agente y de la lectura de capturas del auditor.

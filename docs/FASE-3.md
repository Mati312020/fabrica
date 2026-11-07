# Fase 3 · Memoria persistente

> Producto: `docs/FABRICA-PROYECTO.md` §7.2 y §7.4. Visual: `design/tableros/05-detalle-agente-memoria.html`.
> Fases 0-2 implementadas: leer `packages/*` y `apps/*` antes de tocar nada.

## Objetivo

Lo que aprende el equipo sobrevive entre proyectos. Antes de asignar una tarea, el motor busca en la
memoria lo relevante y se lo pasa al agente. El usuario ve, lee y borra los recuerdos desde el nodo
Memoria·Auditoría.

## Almacenamiento

- `node:sqlite` (`DatabaseSync`), incluido en el Node de Electron 45 (24.22, verificado con FTS5).
  Sin dependencias nativas.
- Archivo **fuera de la carpeta del proyecto**: desktop → `userData/memory.db` (lo manda main al
  motor con `{ type: "config.memoryPath", path }`); standalone → `FABRICA_MEMORY_DB` o
  `%APPDATA%/fabrica-dev/memory.db`. Tests → `:memory:`.
- Esquema (migración idempotente con `user_version`):
  `recuerdos(id TEXT PK, titulo TEXT, contenido TEXT, etiquetas TEXT /*JSON*/, proyecto TEXT,
  agente TEXT, tarea TEXT, creado TEXT, actualizado TEXT)` + tabla FTS5
  `recuerdos_fts(titulo, contenido, etiquetas)` sincronizada por el repositorio (no triggers).
- Repositorio en `packages/engine/src/memory/` con funciones puras de acceso: `save`, `list`, `get`,
  `remove`, `search(texto, limite)`. Consultas siempre con parámetros.

## Qué se guarda

- La salida del auditor suma `aprendizajes?: [{ titulo, contenido, etiquetas: string[] }]` (máx. 3
  por auditoría). Solo cuando `ok: true`: no se aprende de un trabajo rechazado.
- Prompt del auditor: guardar solo lo reutilizable en otros proyectos (normas, decisiones de stack,
  errores a no repetir, componentes útiles, preferencias del usuario dichas en el chat). Nunca datos
  personales, credenciales ni contenido de archivos del proyecto.
- Validación del motor antes de guardar (rechaza en silencio y lo registra en `engine.error` con
  `code: "memory_rejected"`): título 3-120 caracteres, contenido ≤2000, ≤8 etiquetas, y ningún
  patrón de secreto (`sk-ant-`, `ghp_`, `github_pat_`, `AKIA`, `-----BEGIN`, `password=`, tokens
  largos base64/hex de 32+ caracteres seguidos).
- Mismo título (sin distinguir mayúsculas) → se actualiza el existente en vez de duplicar.
- Origen: proyecto (nombre de la carpeta), agente e id de tarea.

## Uso antes de asignar

- Antes de cada `task.assigned`, `search(resumen de la tarea, 5)`; si hay resultados, se agregan al
  prompt del agente como bloque "Memoria del equipo" con título y contenido (tope total 3000
  caracteres). Se emite `agent.tool { herramienta: "memoria", detalle: "N recuerdos" }` para que se vea.
- El orquestador recibe los títulos relevantes al procesar cada `chat.send`.

## Contrato (`packages/events`)

- Ya existen `memory.saved { id, titulo }`, `memory.deleted { id }` y el comando `memory.delete { id }`.
- Nuevos:
  - Evento `memory.snapshot { items: [{ id, titulo, etiquetas, proyecto, actualizado }] }`, que se
    manda al autenticarse y después de cada cambio.
  - Comando `memory.read { id }` → evento `memory.content { id, titulo, contenido, etiquetas,
    proyecto, agente, tarea, creado, actualizado }`, solo al cliente que lo pidió.
- `engine.status` suma `memoryCount`.

## UI

- El nodo Memoria·Auditoría muestra la cantidad de recuerdos (ya lo pide el diseño).
- El detalle del nodo (tablero 05) suma la lista de títulos (los más recientes primero, filtro por
  texto local). Al abrir uno: contenido, etiquetas y origen; botón Borrar con confirmación dentro de
  la página (sin `confirm()`), que manda `memory.delete`.
- `memory.saved` anima según la gramática (contador sube, línea en el registro).

## Tests

- Repositorio: guardar, listar, buscar por FTS, actualizar por título repetido, borrar, migración
  idempotente.
- Validación: rechaza cada patrón de secreto y los límites de largo.
- Motor con `ScriptedProvider`: un auditor con `aprendizajes` → `memory.saved`; la siguiente tarea
  relacionada recibe la memoria en su prompt; un rechazo no guarda nada.
- UI: `applyEvent` de `memory.snapshot`, `memory.saved` y `memory.deleted`.

## Hecho cuando

lint (0 warnings), typecheck, tests y build pasan; `memory.db` nunca queda en la carpeta del proyecto
ni en el repo (`*.db` ya está en `.gitignore`).

## Qué requiere API key real

- Que el auditor real produzca aprendizajes útiles y no ruido. Riesgo conocido (lección
  "Self-training envenena la KB"): si guarda de más, la memoria se llena de basura. Por eso el tope de
  3 por auditoría, solo en aprobados, y el borrado manual visible.

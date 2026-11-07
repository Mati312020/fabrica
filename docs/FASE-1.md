# Fases 1 y 2 · Orquestación real

> Producto: `docs/FABRICA-PROYECTO.md` (§5-§9, §12, §16). Visual: `design/tableros/*.html`.
> Fase 0 implementada: leer `packages/*` y `apps/*` antes de tocar nada. Se implementan las Fases 1
> y 2 juntas porque comparten el núcleo del motor.

## Objetivo

El usuario elige una carpeta de proyecto, le escribe al orquestador, ve cómo se crean ramas y agentes
reales, aprueba un plan auditado y ve cómo los bloques se codifican, se auditan y se ensamblan. Con
reintentos, escalamiento de modelo, varios agentes por rama, varios auditores y presupuesto.

Fuera de alcance: memoria persistente (Fase 3), Bash/tests/navegador/GitHub/3D (Fase 4).

## Principio: el LLM propone, el motor autoriza

El motor es una máquina de estados determinista y testeable. Los modelos devuelven **salida
estructurada** (validada con zod); el motor decide ramas, modelos, reintentos, escalamiento, orden de
bloques y presupuesto. Si una salida no valida, cuenta como rechazo de auditoría con motivo
`salida_invalida`.

## Claude Agent SDK (verificado el 07-nov-2026, `@anthropic-ai/claude-agent-sdk@0.3.319`)

Verificado leyendo `sdk.d.ts` del paquete. Antes de codificar, instalá la misma versión y releé los
tipos que uses. Puntos confirmados:

- `query({ prompt, options }): Query` (iterable asíncrono de `SDKMessage`).
- `options`: `model` (alias `opus|sonnet|haiku` o ID completo), `cwd`, `systemPrompt` (string),
  `tools` / `allowedTools` / `disallowedTools`, `canUseTool`, `permissionMode`, `maxTurns`,
  `maxBudgetUsd`, `abortController`, `env`, `outputFormat` (`{ type: 'json_schema', schema }`),
  `settingSources`, `persistSession`, `includePartialMessages`, `effort`.
- El mensaje `result` trae `total_cost_usd`, `usage` y, con `outputFormat`, la salida estructurada
  (confirmá el nombre exacto del campo en los tipos). Subtipos de error incluyen
  `error_max_turns`, `error_max_budget_usd`, `error_max_structured_output_retries`.
- **Aislamiento obligatorio:** `settingSources: []` (si se omite carga los settings y CLAUDE.md del
  usuario), `persistSession: false`, `env` con la key: `{ ...process.env, ANTHROPIC_API_KEY }`.
- Esquemas: `z.toJSONSchema()` de zod 4 para `outputFormat`.

## Paquete `events`: agregados

- `config.workspace` no es evento: es mensaje del proceso padre (como `config.apiKey`).
- `engine.status` suma `workspace: string | null` y `budgetLimit: number`.
- Comandos nuevos: `budget.setLimit { usd }`, `run.answer { taskId, decision: "reintentar" |
  "cancelar" }` (cuando Opus falló 3 veces).
- Evento nuevo: `task.blocked { taskId, motivo }` (escalamiento agotado; espera `run.answer`).
- `agent.spawned` suma `escaladoDesde?: modelo`; `plan.ready.bloques[]` = `{ id, nombre, tipo:
  "visual" | "tecnico", dependeDe: string[], familia: string }`.
- Ramas: `tipo` es string libre (`planificacion`, `codificacion`, `investigacion`, `diseno`,
  `testing`, …) con `nombre` visible.

## Motor (`packages/engine/src`)

Carpetas sugeridas: `provider/`, `roles/`, `run/`, `budget/`, `workspace/`. Archivos ≤100 líneas.

### Proveedor

```ts
interface ModelProvider {
  run(req: RoleRequest, signal: AbortSignal): AsyncIterable<ProviderEvent>;
}
type ProviderEvent =
  | { kind: "tool"; name: string; detail: string }
  | { kind: "text"; delta: string }                       // → agent.output
  | { kind: "result"; output: unknown; costUsd: number; inputTokens: number; outputTokens: number }
  | { kind: "error"; code: string; message: string };
```

- `SdkProvider`: arma `query()` según el rol (tabla abajo). `canUseTool` niega cualquier herramienta
  cuyo path (`file_path`, `path`, `pattern` con ruta) resuelva fuera de la carpeta del proyecto, y
  cualquier herramienta fuera de la lista del rol. Bash nunca. `maxBudgetUsd` = lo que queda del
  presupuesto. Test unitario de la función de confinamiento (rutas relativas, `..`, absolutas,
  otra unidad, symlink no hace falta).
- `ScriptedProvider`: **solo en tests** (`src/testing/`, excluido del build de la app). Responde
  según guiones por rol y por intento. Ningún import desde código de la app.

### Roles (modelo inicial, herramientas, salida)

| Rol | Modelo | Herramientas | Salida (zod) |
|---|---|---|---|
| orquestador | opus | ninguna | `{ respuesta, ramas: [{tipo, nombre}], investigaciones: [{resumen}], pedirPlan: boolean }` |
| investigación | haiku | WebSearch, WebFetch, Read, Glob, Grep | `{ hallazgos: string, fuentes: string[] }` |
| planificación | opus | Read, Glob, Grep | `{ resumen, bloques: [{id, nombre, tipo, dependeDe, familia, descripcion}] }` |
| codificación | sonnet | Read, Write, Edit, Glob, Grep | `{ resumen, archivos: string[] }` |
| auditoría | opus | Read, Glob, Grep | `{ ok: boolean, motivo, sugerencia }` |

Prompts de sistema en español, cortos, en `roles/prompts.ts`: quién es, qué devuelve, que trabaja
solo dentro de la carpeta del proyecto, que no invente datos. Al LLM va lo mínimo: la tarea, el
contexto aprobado necesario y el motivo del rechazo anterior si lo hay.

### Ciclo

1. Sin carpeta de proyecto o sin key → `engine.error` (`no_workspace` / `no_api_key`) y
   `chat.message` del sistema explicando qué falta.
2. `chat.send` → corrida del orquestador. Su `respuesta` va como `chat.message`. Por cada rama
   propuesta, si no existe: `branch.created`. Por cada investigación: tarea en la rama investigación.
   Si `pedirPlan`: tarea de planificación (con los hallazgos aprobados como contexto).
3. Toda tarea de rama: `task.assigned` (de orquestador a agente) → `agent.status pensando` →
   `agent.tool` / `agent.output` / `agent.tokens` / `agent.progress` mientras corre → resultado →
   `task.toAudit` → corrida de auditoría → `audit.result`.
4. `audit.result ok` → el orquestador (motor) avanza: hallazgos quedan como contexto; plan →
   `plan.ready` y espera `plan.approve` / `plan.reject` (con rechazo: nueva tarea de planificación
   con el comentario); bloque técnico → `block.assembled`; bloque visual →
   `block.approvalRequested` (sin vista previa hasta Fase 4: la tarjeta lista los archivos) y
   espera `block.approve` / `block.reject`.
5. `audit.result` rechazado → reintento en la misma rama con el motivo. A los **3 rechazos** del mismo
   modelo: `task.escalated` y `agent.spawned` de un modelo superior (haiku→sonnet→opus) que rehace la
   tarea **desde cero** (sin la salida anterior, sí con los motivos). Si Opus acumula 3 rechazos:
   `task.blocked` + `chat.message` y espera `run.answer`.
6. Plan aprobado → `branch.created codificacion` y tareas de bloque en orden de dependencias
   (topológico). Los bloques listos sin dependencias pendientes corren **en paralelo** hasta
   `MAX_PARALELO = 3`, cada uno con su agente (`agent.spawned`). `block.progress` = % de pasos.
7. Auditores: pool de `MAX_AUDITORES = 2`; cada auditor es un agente (`agent.spawned` en la rama
   `auditoria`, que el diagrama dibuja como el nodo Memoria·Auditoría).
8. `run.pause` → no se despacha nada nuevo y los agentes en espera pasan a `pausado`; lo que está
   corriendo termina. `run.resume` retoma.
9. Ciclos de dependencias o ids repetidos en el plan → la auditoría lo rechaza sin llamar al
   modelo (validación del motor).

### Presupuesto

- Límite por proyecto en US$, default 5, cambia con `budget.setLimit`. Se suma el `costUsd` de cada
  resultado (de todos los roles) y se emite `budget.update`.
- ≥80% → `budget.warning` una vez; desde ahí no se crean ramas nuevas (regla propuesta en el diseño).
- ≥95% → `budget.paused`: no se despacha nada, agentes a `pausado`. `budget.useReserve` habilita
  hasta el 100%. Al 100%, pausa definitiva hasta subir el límite.

## Desktop

- IPC `workspace:choose` → `dialog.showOpenDialog({ properties: ["openDirectory",
  "createDirectory"] })` → se guarda en `userData/settings.json` y se manda al motor
  (`{ type: "config.workspace", path }`). Al arrancar se reenvía el guardado.
- `dev:web`: el motor standalone toma `FABRICA_WORKSPACE` y la key de `ANTHROPIC_API_KEY` (solo
  standalone, solo desarrollo; documentarlo en el README).

## UI (según tableros 01, 04, 05, 07, 08, 09)

- Diagrama con `@xyflow/react`: layout determinista calculado del estado (orquestador arriba al
  centro con el nodo Chat a la izquierda, ramas en columnas, agentes apilados, línea de auditoría con
  unión por rama, Memoria·Auditoría abajo, retorno al orquestador). Nodos custom con los 8 estados del
  tablero 04. Sin zoom libre al arrancar: `fitView`.
- **Foco y atenuación**: solo lo activo se ilumina. **Gramática 09**: cada animación la dispara su
  evento (mecha en conectores para `task.assigned` / `task.toAudit` / `audit.result`, arranque y fin
  de agente, progreso contando de a uno, veredicto, error ×N, escalado con agente nuevo, registro).
  `prefers-reduced-motion` respetado.
- Chat: tarjeta de aprobación de plan (tablero 07: tabla de bloques con dependencias y botones),
  tarjeta de bloque visual (Aprobar / Rechazar con comentario), tarjeta de `task.blocked`.
- Montaje simple: columna de bloques con familia (color), estado y progreso; los ensamblados abajo.
- Presupuesto: tres estados del tablero 08, límite editable, botón de reserva.
- Detalle de agente (tablero 05 sin memoria): estado, herramienta, tarea, tiempo, tokens, costo, salida.
- Barra superior: carpeta del proyecto (botón para elegirla en Electron).
- Chips de modelo se tiñen con agentes activos de ese modelo.

## Tests

- Confinamiento de rutas.
- Motor con `ScriptedProvider`: camino feliz completo (chat → investigación → plan → aprobación →
  3 bloques con dependencias → ensamblado); orden de eventos esperado.
- 3 rechazos → escalado; Opus 3 rechazos → `task.blocked` y `run.answer`.
- Plan rechazado por el usuario → replanificación con comentario.
- Paralelismo: nunca más de 3 bloques a la vez y nunca uno antes que sus dependencias.
- Presupuesto: aviso al 80% una vez, pausa al 95%, reserva, sin ramas nuevas pasado el 80%.
- Salida inválida → rechazo `salida_invalida`; plan con ciclo → rechazo sin llamar al modelo.
- UI: `applyEvent` para los eventos nuevos y el layout del diagrama (función pura).

## Hecho cuando

lint (0 warnings), typecheck, tests y build pasan; `dev:web` sin key muestra el error guiado; la UI
reproduce un escenario completo **solo en un test** (nunca con datos de ejemplo en la app).

## Qué requiere API key real (no verificable sin ella)

- Que `SdkProvider` reciba la salida estructurada y el costo como se especificó.
- Calidad de prompts, tiempos reales y que el confinamiento funcione con el CLI real.
- Costo real de una corrida completa contra el presupuesto.

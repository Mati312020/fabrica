# Alfa — Orquestador visual de agentes Claude

> **Nombre temporal:** Alfa
> **Estado:** idea definida, sin código todavía
> **Origen:** sesión de diseño en Claude Code (nube), noviembre 2026
> **Destino:** continuar en una sesión local de Claude Code en Windows, en un repositorio nuevo de GitHub

---

## 0. Instrucciones para Claude (sesión local)

Este documento resume una conversación de diseño con el usuario. Antes de escribir código:

1. Leé el documento completo y mirá el boceto original (`boceto-original.jpg`, en esta misma carpeta, girado 90°).
2. **Hockify:** el usuario mencionó que en el proyecto *Hockify* comprobaron que auditar las webs **desde el navegador** funciona muy bien. Ese contexto está en su máquina local. Buscalo y reutilizá ese enfoque para la auditoría en navegador (sección 7.3).
3. Todo lo que figura en la sección 3 ya está **decidido** por el usuario. No lo vuelvas a preguntar.
4. Lo que está en la sección 14 ("Pendientes") todavía hay que definirlo con el usuario.
5. La próxima etapa acordada es el **diseño visual**. Conviene empezar por ahí o por el esqueleto técnico de la Fase 0, según lo que pida el usuario.
6. Verificá las APIs del Claude Agent SDK en la documentación actual antes de usarlas. Los nombres que aparecen acá son orientativos.

---

## 1. Visión

Alfa es una **aplicación de escritorio** donde se ve, en tiempo real, un equipo de agentes de Claude construyendo un proyecto.

**Requisito central:** todo lo que se ve tiene que ser real. Cada nodo del diagrama es un agente que existe y está ejecutando una tarea de verdad. Cada punto que viaja por una arista es una tarea que realmente se asignó. Cada bloque que se ensambla es un módulo realmente terminado y aprobado. No hay animaciones decorativas ni datos simulados.

- **Usuario:** el usuario es quien la usa, como herramienta propia. Otras personas pueden instalarla en sus computadoras, cada una con su propia API key.
- **Proyectos:** principalmente proyectos web, pero también scripts, documentos e investigaciones.

---

## 2. Boceto original (interpretación)

```
CHAT ──► OPUS CENTRAL (orquestador)
           │
           ├── Planificación ──► Opus, Opus, Opus …
           ├── Codificación ───► Sonnet, Sonnet, Sonnet …
           ├── Investigación ──► Haiku, Haiku, Haiku …
           │          │ (cada respuesta pasa por un nodo)
           │          ▼
           │   MEMORIA / AUDITORÍA / CORRECCIONES (Opus) ──► OPUS CENTRAL
           │
           └──► ÁREA DE MONTAJE DE BLOQUES (simula el proyecto armándose)
```

Aclaraciones del usuario sobre el boceto:
- En el dibujo, la línea hacia Memoria/Auditoría tiene un nodo en **cada** salida de respuesta. Eso significa que **audita todo**, no solo la rama de investigación.
- Memoria/Auditoría aparece como un solo agente por falta de espacio. **Pueden ser varios agentes.**
- Los "…" debajo de cada rama indican que la cantidad de agentes es variable.

---

## 3. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| 1 | Propósito | Herramienta propia para proyectos web y de todo tipo |
| 2 | Usuarios | Cada usuario instala su propia app con su propia API key. No hay servidor compartido por ahora |
| 3 | Plataforma | App de escritorio para **Windows** |
| 4 | Motor | **Claude Agent SDK** |
| 5 | Dónde corre | Localmente en la PC del usuario. **A futuro**, el motor tiene que poder pasar a un servidor o VPS propio (opción "c") sin rehacer la interfaz |
| 6 | API key | El usuario todavía no la tiene. Se obtiene en console.anthropic.com |
| 7 | Archivos generados | En una carpeta local, en un repo de GitHub o en ambos, según el proyecto |
| 8 | Repositorio de Alfa | Un repo nuevo en GitHub. **No** usar el repo `my-static-web-app`, que es una plantilla de Azure sin relación con este proyecto |
| 9 | Cantidad de agentes | La decide el Opus central según la carga. **No hay máximo fijo** de agentes en paralelo |
| 10 | Aprobación del usuario | Cuando los planes están completos **y auditados**, el usuario los aprueba antes de empezar a codificar |
| 11 | Chat | El usuario puede hablarle al orquestador en cualquier momento, también durante la ejecución |
| 12 | Flujo entre ramas | Las ramas se cruzan libremente. Ver ejemplo en 6.2 |
| 13 | Paso obligatorio | **Toda** respuesta de cualquier agente pasa primero por Memoria/Auditoría antes de volver al orquestador |
| 14 | Ramas | Las define el orquestador según lo que necesite el proyecto: planificación, codificación, investigación, diseño, testing, etc. |
| 15 | Modelos por rama | Los asigna el orquestador. Hay escalamiento por fallos (sección 6.3) |
| 16 | Corrección | El auditor **no corrige**. Informa el problema al orquestador, que reenvía la tarea a la rama y decide si mantiene el modelo o asigna uno superior |
| 17 | Auditoría web | En apps web también se audita **en el navegador** y se piden correcciones a partir de eso |
| 18 | Memoria | Persiste entre proyectos y guarda todo lo que sea útil o reutilizable |
| 19 | Bloques | Los define el plan de cada proyecto: qué bloques hay y cuántos en total |
| 20 | Aprobación de bloques | Si el bloque es visual, lo aprueba el usuario. Si es técnico (por ejemplo una API), lo aprueba el auditor con tests |
| 21 | Presupuesto | Aviso al **80%**. Pausa al **95%**. El 5% restante queda reservado para casos importantes que el usuario autoriza |
| 22 | Tema | Claro y oscuro, a elección del usuario |
| 23 | Idioma | Español por defecto, con opción de cambiar a inglés |
| 24 | Frontend | React |
| 25 | Repetir ejecuciones | **No** es necesario |
| 26 | Primera versión | Empezar por un MVP y crecer por fases (sección 12) |

---

## 4. Arquitectura

```
┌──────────────────── Alfa (Electron, Windows) ─────────────────────┐
│                                                                   │
│  INTERFAZ (renderer)                                              │
│   React + TypeScript + Vite                                       │
│   · React Flow ......... diagrama de agentes y aristas            │
│   · Framer Motion ...... puntos viajando y animaciones            │
│   · Three.js / R3F ..... bloques 3D isométricos (o SVG/CSS isom.) │
│   · Zustand ............ estado alimentado por eventos            │
│   · i18next ............ español / inglés                         │
│   · Recharts ........... gráficos de tokens                       │
│                     ▲                                             │
│                     │ WebSocket (JSON, contrato de eventos §9)    │
│                     ▼                                             │
│  MOTOR (proceso Node separado)                                    │
│   · Claude Agent SDK: orquestador + agentes                       │
│   · Bus de eventos: todo cambio de estado emite un evento         │
│   · Memoria/Auditoría: SQLite (better-sqlite3 o similar)          │
│   · Playwright ......... auditoría en el navegador                │
│   · simple-git / Octokit commits y repos de GitHub                │
│   · Contador de presupuesto                                       │
└───────────────────────────────────────────────────────────────────┘
```

**Por qué Electron:** el Agent SDK es de Node y Electron incluye Node. Tauri obligaría a sumar un proceso Node aparte.

**Por qué un motor separado comunicado por WebSocket, aunque hoy todo sea local:** para mudar el motor a un servidor (opción "c") alcanza con cambiar la URL del WebSocket. La interfaz nunca llama a Claude directamente.

**API key:** se guarda cifrada con `safeStorage` de Electron, que en Windows usa DPAPI. Nunca va en texto plano ni en el repo.

---

## 5. Agentes y roles

| Rol | Modelo inicial | Función |
|---|---|---|
| **Orquestador** (Opus central) | Opus | Recibe el chat, crea ramas, reparte tareas, decide modelos y escalamientos, pide aprobaciones |
| **Planificación** | Opus | Arma los planes. **El plan define los bloques del proyecto** y sus dependencias |
| **Codificación** | Sonnet | Implementa bloques |
| **Investigación** | Haiku | Busca información, documentación, normas, referencias |
| **Memoria / Auditoría / Correcciones** | Opus (uno o varios) | Audita **todas** las respuestas, guarda lo aprendido y reporta errores al orquestador |
| Otras ramas | Según el orquestador | Diseño, testing, documentación, etc., si el proyecto las necesita |

---

## 6. Flujo de trabajo

### 6.1 Ciclo de vida de una tarea

```
Orquestador ──asigna──► Agente de la rama
                              │ trabaja (herramientas, archivos…)
                              ▼
                      Memoria/Auditoría
                       │            │
                  aprobado      rechazado (con motivo)
                       │            │
                       ▼            ▼
                 Orquestador   Orquestador ──► reenvía a la rama
                       │                       (mismo modelo o superior, §6.3)
                       ▼
           ¿Bloque completo? ──► aprobación (§8.2) ──► montaje
```

Estados de un agente: `esperando` · `pensando` · `trabajando` (usando herramienta X) · `en auditoría` · `terminado` · `error` · `pausado`.

### 6.2 Cruce libre entre ramas (ejemplo del usuario)

Mientras Sonnet codifica el módulo A, Haiku ya investiga el módulo B. Lo que investiga Haiku va a Memoria/Auditoría, que lo revisa y lo devuelve al orquestador. El orquestador se lo pasa a Planificación, que ajusta el plan del módulo B.

**Regla:** las ramas nunca se hablan directamente. El camino siempre es *rama → auditoría → orquestador → rama*.

### 6.3 Escalamiento de modelo

- Escalera: **Haiku → Sonnet → Opus**.
- Si una tarea no pasa la auditoría **3 veces**, el orquestador puede asignarla a un modelo superior, que la **rehace desde cero** para encarar el problema desde otro punto de vista.
- Si Opus también falla 3 veces, el sistema **se detiene y le pregunta al usuario**.
- El diagrama tiene que mostrar el escalamiento: aparece un agente nuevo, de otro modelo, en esa rama.

### 6.4 Puntos de aprobación del usuario

1. **Planes:** cuando están completos y auditados, se aprueban antes de codificar.
2. **Bloques visuales:** con una vista previa en la app (§8.2).
3. **Uso de la reserva de presupuesto** (95% → 100%).
4. **Escalamiento agotado:** cuando Opus falló 3 veces.

---

## 7. Memoria / Auditoría / Correcciones

### 7.1 Auditoría
- Revisa **todas** las respuestas de todos los agentes.
- No corrige. Envía al orquestador un reporte con: tarea, rama, agente, problema encontrado y sugerencia.
- Puede haber varios agentes auditores en paralelo.

### 7.2 Memoria persistente
- Se guarda entre proyectos en una base local (SQLite).
- Guarda **toda información útil o reutilizable**. Ejemplo del usuario: si Haiku, investigando estructuras, descubre que para cierto material se aplica una norma ISO, eso se recuerda para futuros proyectos.
- También guarda preferencias del usuario, decisiones de stack, errores que no hay que repetir y componentes reutilizables.
- Cada recuerdo tiene: título, contenido, origen (proyecto, agente, tarea), fecha y etiquetas.
- Antes de asignar una tarea, el orquestador consulta la memoria y pasa al agente lo que sea relevante.

### 7.3 Auditoría en navegador (proyectos web)
- Se usa Playwright desde el motor: abre la web generada, navega, saca capturas, revisa la consola y prueba interacciones.
- **Reutilizar el enfoque de Hockify** (ver sección 0).
- Los problemas encontrados en el navegador siguen el mismo circuito: reporte → orquestador → rama.

### 7.4 Interfaz de la memoria
- Al hacer clic en un agente de Memoria se ve **la misma información que en cualquier agente** (estado, herramientas, tiempo, tokens), más:
- **Un listado de los títulos de lo aprendido.** Al abrir uno se puede **leer** y **borrar**.

---

## 8. Bloques

### 8.1 Concepto
- Un "bloque" es un **objeto visual tipo lego** que representa un módulo terminado.
- **El plan de cada proyecto define** qué bloques hay, cuántos en total y sus dependencias.

### 8.2 Aprobación
- **Bloques visuales** (pantallas, componentes): los aprueba el usuario desde una **vista previa embebida** de la web, con botones Aprobar / Rechazar y la opción de comentar o marcar sobre la pantalla qué cambiar.
- **Bloques técnicos** (API, lógica, datos): los aprueba el auditor si pasan los tests.
- Al aprobarse un bloque se puede hacer un commit en Git, si el proyecto usa GitHub.

### 8.3 Visualización
- Bloques **3D isométricos**.
- **Arriba:** los bloques en construcción, que van creciendo a medida que avanzan.
- **Abajo:** el conjunto ya ensamblado.
- Cuando un módulo se termina, **una animación lo baja y lo encaja** en el conjunto.
- Los bloques relacionados o dependientes llevan **colores parecidos, apenas degradados** (por ejemplo, la misma familia de color con distinta luminosidad).

---

## 9. Contrato de eventos (motor → interfaz)

La interfaz se dibuja **solo a partir de estos eventos**, y eso es lo que garantiza que lo visible sea real. Lista orientativa:

| Evento | Datos principales | Efecto visual |
|---|---|---|
| `branch.created` | id, tipo, nombre | Aparece una rama en el diagrama |
| `agent.spawned` | id, rama, modelo | Aparece un nodo de agente |
| `task.assigned` | taskId, de, a, resumen | **Un punto recorre la arista** hasta el agente |
| `agent.status` | id, estado | Cambia el color o ícono del nodo |
| `agent.tool` | id, herramienta, detalle | Se muestra la herramienta en uso |
| `agent.tokens` | id, entrada, salida, costo | Se actualiza el gráfico de tokens |
| `agent.output` | id, texto parcial | Texto en vivo en el detalle |
| `task.toAudit` | taskId, auditorId | Un punto viaja hacia Memoria/Auditoría |
| `audit.result` | taskId, ok, motivo | Un punto vuelve al orquestador (verde o rojo) |
| `task.escalated` | taskId, modeloAnterior, modeloNuevo | Aparece un agente de otro modelo |
| `memory.saved` / `memory.deleted` | id, título | Se actualiza la lista de la memoria |
| `plan.ready` | planId, bloques[] | Pide aprobación; se crean los bloques "fantasma" arriba |
| `block.progress` | blockId, % | El bloque crece arriba |
| `block.approvalRequested` | blockId, previewUrl | Se abre la vista previa con botones |
| `block.assembled` | blockId | **Animación de encastre** abajo |
| `budget.update` | usado, límite | Barra de presupuesto |
| `budget.warning` / `budget.paused` | % | Aviso al 80% / pausa al 95% |
| `chat.message` | rol, texto | Chat con el orquestador |

En sentido inverso (interfaz → motor): `chat.send`, `plan.approve/reject`, `block.approve/reject(comentario)`, `memory.delete`, `budget.useReserve`, `run.pause/resume`.

---

## 10. Interfaz

### 10.1 Layout
```
┌──────────────────────────────────────────────┬──────────────────┐
│                                              │  MONTAJE (fijo)  │
│        DIAGRAMA DE AGENTES (principal)       │  ▲ en construcción│
│   Orquestador al centro, ramas alrededor,    │  ─────────────── │
│   Memoria/Auditoría conectada a cada salida  │  ▼ ensamblado    │
│                                              │                  │
├──────────────────────────────────────────────┴──────────────────┤
│  CHAT con el orquestador          │  Presupuesto ▓▓▓▓░░ 62%     │
└──────────────────────────────────────────────────────────────────┘
```
- El **diagrama es la pantalla principal**.
- El **panel de montaje** queda fijo al costado.
- El **chat** siempre está disponible.

### 10.2 Diagrama
- El orquestador va al centro, con una rama por tipo y los agentes apilados dentro de cada rama.
- Al asignarse una tarea, **un punto recorre la arista** hasta la rama y el agente.
- El color o borde del nodo refleja su modelo: Opus, Sonnet o Haiku.

### 10.3 Detalle de un agente (al hacer clic)
- Estado, herramientas usadas, tiempo transcurrido, tarea actual y texto en vivo.
- **Gráfico de tokens** al estilo del indicador de uso de contexto que aparece junto al modelo en Claude.
- Para los agentes de Memoria, además, el listado de lo aprendido (§7.4).

### 10.4 Temas e idioma
- Tema claro y oscuro, a elección del usuario.
- Español e inglés.

---

## 11. Stack técnico sugerido

| Capa | Tecnología |
|---|---|
| Escritorio | Electron + electron-builder (instalador NSIS para Windows) |
| UI | React 18+ · TypeScript · Vite (por ejemplo con `electron-vite`) |
| Diagrama | React Flow (`@xyflow/react`) |
| Animación | Framer Motion |
| Bloques 3D | React Three Fiber con cámara ortográfica isométrica (alternativa más liviana: SVG o CSS isométrico) |
| Estado | Zustand |
| Gráficos | Recharts |
| i18n | i18next + react-i18next |
| Motor | Node + TypeScript + Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, verificar nombre y versión) |
| Comunicación | WebSocket (`ws`) |
| Persistencia | SQLite |
| Navegador | Playwright |
| Git | simple-git · Octokit |

**No reutilizar** el `react-app` del repo `my-static-web-app`: usa React 17 y Create React App, que está discontinuado.

### Estructura de carpetas sugerida
```
alfa/
├─ apps/
│  ├─ desktop/          # Electron main + preload
│  └─ ui/               # React (renderer)
├─ packages/
│  ├─ engine/           # Motor: orquestador, agentes, auditoría, presupuesto
│  ├─ events/           # Tipos TypeScript del contrato de eventos (§9), compartidos
│  └─ memory/           # Capa SQLite de memoria
├─ docs/
│  ├─ ALFA-PROYECTO.md  # este documento
│  └─ boceto-original.jpg
└─ package.json         # workspaces (pnpm o npm)
```

---

## 12. Plan por fases

**Fase 0: Esqueleto**
- Monorepo, Electron abriendo la UI de React y el motor levantando un WebSocket.
- Paquete `events` con los tipos del contrato.
- Configuración: carga segura de la API key, tema claro/oscuro, idioma.

**Fase 1: MVP (la propuesta acordada)**
- Chat con el orquestador.
- Orquestador más **una instancia por rama** (planificación, codificación, investigación).
- Memoria/Auditoría en el circuito (todas las respuestas pasan por ahí).
- Diagrama con **estados en vivo** y puntos viajando por las aristas.
- Área de montaje simple, todavía sin 3D.
- Contador de presupuesto con aviso al 80% y pausa al 95%.
- Aprobación de planes.

**Fase 2: Paralelismo y escalamiento**
- Varias instancias por rama decididas por el orquestador.
- Ramas dinámicas.
- Escalamiento Haiku → Sonnet → Opus tras 3 fallos.
- Varios auditores.

**Fase 3: Memoria persistente**
- SQLite, consulta de la memoria antes de asignar tareas.
- Interfaz para listar, leer y borrar recuerdos.

**Fase 4: Web y bloques**
- Auditoría en navegador con Playwright (enfoque Hockify).
- Vista previa embebida con aprobar, rechazar y comentar.
- Bloques **3D isométricos** con animación de encastre y colores por dependencia.
- Integración con GitHub (commit por bloque aprobado).

**Fase 5: Pulido**
- Detalle de agentes con gráficos de tokens.
- Instalador para Windows.
- Preparar el motor para que pueda correr en un servidor (opción "c").

---

## 13. Requisitos previos (en la PC del usuario)

- Windows con **Node.js 20+** (LTS) y **Git**.
- Cuenta de GitHub y un **repo nuevo** para Alfa.
- **API key de Anthropic** desde console.anthropic.com, con límites de gasto configurados también en la consola como red de seguridad.
- Claude Code instalado localmente para continuar el desarrollo.

---

## 14. Pendientes a definir con el usuario

- **Diseño visual detallado**: es la próxima etapa acordada. Incluye paleta, tipografía, forma de los nodos, estilo de los bloques isométricos y cómo se ven las aristas y los puntos.
- **Nombre definitivo** de la app ("Alfa" es temporal).
- **Monto del presupuesto**: por proyecto, por día o ambos, y en qué moneda se muestra.
- **Criterio de "caso importante"** para usar la reserva del 5%. ¿Lo decide siempre el usuario o el orquestador puede sugerirlo?
- **Contexto de Hockify**: revisarlo en la máquina local.
- Cómo se elige, al crear un proyecto, si va a carpeta local, a GitHub o a ambos.

---

## 15. Prompt sugerido para iniciar la sesión local

> Leé `docs/ALFA-PROYECTO.md` y mirá `docs/boceto-original.jpg`. Es el diseño de Alfa, un orquestador visual de agentes Claude para escritorio en Windows. Todo lo de la sección 3 ya está decidido. Buscá en esta máquina el contexto del proyecto Hockify sobre auditoría en navegador. Después proponeme cómo encarar el diseño visual (sección 14) y, cuando lo aprobemos, armá la Fase 0.

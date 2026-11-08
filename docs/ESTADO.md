# Estado de Fabrica! · 07-nov-2026

> Leer esto primero al retomar. Spec: `FABRICA-PROYECTO.md`. Fases: `FASE-0.md` … `FASE-5.md`.

## Dónde quedó

Las **Fases 0 a 5 están implementadas** con 214 tests en verde (lint con 0 warnings, typecheck,
build e instalador). Todo el circuito de agentes se verificó con un **proveedor de modelo simulado**
(`packages/engine/src/testing/`, solo tests). **Ninguna corrida usó todavía un modelo real.**

| Fase | Qué hay | Verificado de verdad | Verificado solo con simulación / sin verificar |
|---|---|---|---|
| 0 | Electron + UI + motor por WebSocket, API key con DPAPI | conexión, chat ida y vuelta, cifrado de la key | — |
| 1-2 | Orquestador, ramas, auditoría obligatoria, reintentos, escalamiento, paralelismo, presupuesto, diagrama animado | lógica del motor (tests), UI con un motor de prueba | adaptador del Agent SDK contra la API real |
| 3 | Memoria SQLite + FTS5 entre proyectos, filtro anti-secretos | repositorio y búsqueda (tests), `node:sqlite` dentro de Electron | calidad de lo que aprende un auditor real |
| 4 | Vista previa, auditoría en navegador (Edge + Playwright), marcas, montaje isométrico, commit por bloque | recorrido real en Edge contra una página de prueba; git en repo temporal | recorridos propuestos por un agente real; la UI de la vista previa no se miró en pantalla |
| 5 | Gráficos de tokens, instalador NSIS, motor en servidor (wss + token) | app empaquetada arranca con su motor; `wss://` con certificado autofirmado | instalación asistida del `.exe`; motor remoto contra un servidor real |

## Por qué se frenó (y qué destraba cada cosa)

1. **Sin API key de Fabrica!** → no se puede probar ningún agente real: salida estructurada y costo
   del SDK, calidad de prompts, recorridos del navegador, aprendizajes de la memoria, costo de una
   corrida. **Destraba:** crear una key con límite bajo (≈ US$ 5) en console.anthropic.com y
   cargarla en Ajustes de la app de escritorio. Primera prueba: proyecto chico, todo con Haiku.
2. **Motor en el NAS** → no desplegado. **Causa:** pool RAIDZ1 con dos discos con sectores
   pendientes (un disco más y se pierde el pool) y falta la API key. Plan en `NAS.md`. Falta
   además el Dockerfile y elegir Chromium en Linux.
3. **Tests de bloques técnicos y proyectos con `npm run dev`** → fuera de alcance a propósito:
   requieren que los agentes ejecuten comandos en la PC. Antes hay que verificar si el `sandbox`
   del Agent SDK funciona en Windows. Mientras tanto, los bloques técnicos los aprueba la auditoría
   de código.
4. **Instalador sin firma** → Windows SmartScreen advierte al instalar. Solo importa si se
   distribuye a terceros (certificado de firma de código, pago anual).

## Decisiones de producto abiertas

- Presupuesto: hoy por proyecto (US$ 5 por defecto). ¿También por día?
- Reserva del 5 %: hoy la libera solo el usuario. ¿El orquestador puede sugerirla?
- Regla del 80 % propuesta por el diseño ("no abre ramas nuevas"): implementada de forma provisoria.
- Al crear un proyecto: carpeta local, GitHub o ambos (hoy: carpeta local + commit por bloque opcional).

## Limitaciones conocidas

- Con motor remoto no hay vista previa de bloques visuales (el servidor de vista previa escucha en
  la máquina del motor).
- El detalle de agente no tiene anillo de uso de contexto (no hay dato real de la ventana).
- El instalador pesa ≈ 250 MB porque incluye el CLI del Agent SDK.

## Próximo paso recomendado

Con la key cargada: correr un proyecto web mínimo (una landing de una página) con presupuesto de
US$ 1 y anotar acá qué falló. Es la simulación de punta a punta que más errores va a encontrar.

# Motor de Fabrica! en el NAS (TrueNAS)

> Plan para la opción "c" (§4): el motor corre en el NAS de casa y la app de escritorio se conecta
> como "motor remoto". Requisitos generales del modo servidor: `docs/SERVIDOR.md`.
> **Estado: no desplegado.** Ver "Antes de desplegar".

## Antes de desplegar (bloqueantes)

1. **Salud del pool.** El pool de datos es un RAIDZ1 con dos discos con sectores pendientes. Un RAIDZ1
   tolera la falla de un solo disco: primero backup externo y reemplazo de discos, después servicios
   nuevos.
2. **API key de Fabrica!** con límite de gasto (la misma que se usa en escritorio o una aparte).
3. TrueNAS actualizado a la versión estable vigente.

## Diseño

- **Contenedor Docker** (App personalizada de TrueNAS) con Node 24 y el motor standalone
  (`packages/engine`), usuario sin privilegios, sistema de archivos de solo lectura salvo:
  - `/data/proyectos` → dataset propio (carpetas de proyecto que usan los agentes).
  - `/data/memoria` → dataset propio con `memory.db`.
- **Red: solo Tailscale.** El motor escucha en la interfaz de Tailscale (o en loopback detrás de
  `tailscale serve` con HTTPS). **Nunca** se publica a internet ni a la LAN abierta.
- **wss obligatorio**: certificado de `tailscale serve`/`tailscale cert`, o `--tls-cert/--tls-key`.
  Si se usa `tailscale serve`, el motor arranca con `--behind-proxy`.
- **Token**: 32+ bytes aleatorios en una variable de entorno de la App (no en el repo ni en el
  compose versionado). En la app de escritorio se guarda con `safeStorage`.
- **API key de Anthropic**: variable de entorno de la App (`ANTHROPIC_API_KEY`), nunca por
  WebSocket.
- **Navegador para auditoría**: en Linux no hay Edge; la imagen instala Chromium de Playwright
  (`npx playwright install --with-deps chromium`) y el motor usa `channel` por defecto en vez de
  `msedge` (configurable por variable de entorno).
- **Recursos**: límite de memoria del contenedor (el NAS corre otros servicios).

## Pasos (cuando se levanten los bloqueantes)

1. Crear datasets `apps/fabrica/proyectos` y `apps/fabrica/memoria` con ACL para el usuario del
   contenedor.
2. Construir la imagen desde el repo (Dockerfile a agregar en `packages/engine/`).
3. App personalizada en TrueNAS con los dos montajes, las variables de entorno y el puerto
   interno.
4. `tailscale serve` hacia el puerto del motor (HTTPS → wss).
5. En la app de escritorio: Ajustes → Motor → remoto, URL `wss://<nombre-tailscale-del-nas>/` y token.
6. Probar: conexión, chat, un proyecto chico con Haiku y presupuesto bajo.

## Pendiente de implementar para esto

- Dockerfile del motor y variable para elegir navegador (Edge en Windows / Chromium en Linux).
- Con motor remoto, la carpeta del proyecto vive en el NAS: elegirla desde la UI entre las carpetas
  de `/data/proyectos` (hoy el selector abre un diálogo local).

# Motor de Fabrica! en un servidor

El motor puede correr fuera de la PC (opción "c" del proyecto) y la app de escritorio se conecta por
`wss://`. Con motor remoto **la carpeta del proyecto, la memoria y la API key viven en el servidor**:
la app no manda nada de eso por la red.

## Qué exige el motor (y por qué no arranca si falta algo)

El motor standalone es `packages/engine/src/standalone.ts`:

```
node --import tsx packages/engine/src/standalone.ts [opciones]
```

| Opción | Efecto |
|---|---|
| `--host <ip>` | Interfaz donde escucha. Por defecto `127.0.0.1`. |
| `--port <n>` | Puerto. Por defecto `4317`. |
| `--tls-cert <pem>` + `--tls-key <pem>` | El motor sirve `wss://` por sí mismo. Van juntos. |
| `--behind-proxy` | Declara que un proxy TLS va delante y el motor habla `ws://` plano. |
| `--allow-origin <origen>` | Origen web permitido (repetible o separado por comas, ej. `https://panel.example.com`). Sin esto, un host remoto solo acepta la app de escritorio. |
| `--token-file <ruta>` | Archivo con el token. |

Reglas, todas verificadas al arrancar (sale con código 2 y un mensaje):

- **Token obligatorio y de al menos 32 bytes.** Viene de `FABRICA_TOKEN` o de `--token-file`; nunca por
  argumento (se vería en `ps`). Con host no loopback no se genera uno: si falta, no arranca. Generalo así:
  `openssl rand -hex 32 > /etc/fabrica/token && chmod 600 /etc/fabrica/token`.
- **Host que no es loopback** (`0.0.0.0`, una IP pública o privada) exige `--tls-cert`/`--tls-key` o
  `--behind-proxy`. Sin eso no arranca: un WebSocket con token en claro por la red no se acepta.
- **Origin**: solo `null`, `file://`, `app://` (la app de escritorio) y lo que pongas en `--allow-origin`.
- **API key de Anthropic**: variable de entorno `ANTHROPIC_API_KEY` del servicio. No hay forma de
  enviarla por WebSocket y la app de escritorio no la manda al motor remoto.
- Otras variables: `FABRICA_WORKSPACE` (carpeta del proyecto, absoluta y existente),
  `FABRICA_MEMORY_DB` (ruta del SQLite de memoria, fuera del proyecto).

## Detrás de un proxy TLS (recomendado)

El motor escucha solo en loopback o en una red privada y el proxy termina TLS. Ejemplo con Caddy
(`wss://fabrica.example.com`, certificado automático):

```
fabrica.example.com {
    reverse_proxy 127.0.0.1:4317
}
```

Caddy reenvía el upgrade de WebSocket sin configuración extra. Con nginx hacen falta
`proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`
y un `proxy_read_timeout` largo. Levantá el motor con `--behind-proxy` si no escucha en loopback.

## systemd

`/etc/systemd/system/fabrica-engine.service`:

```ini
[Unit]
Description=Fabrica! engine
After=network-online.target

[Service]
User=fabrica
WorkingDirectory=/opt/fabrica
Environment=FABRICA_WORKSPACE=/srv/fabrica/proyecto
Environment=FABRICA_MEMORY_DB=/var/lib/fabrica/memory.db
EnvironmentFile=/etc/fabrica/engine.env          # ANTHROPIC_API_KEY=sk-ant-...   (chmod 600, root)
ExecStart=/usr/bin/node --import tsx packages/engine/src/standalone.ts --port 4317 --token-file /etc/fabrica/token
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/srv/fabrica /var/lib/fabrica

[Install]
WantedBy=multi-user.target
```

Con el proxy en la misma máquina, el motor queda en `127.0.0.1` y no necesita `--behind-proxy`.

## Docker

```dockerfile
FROM node:24-slim
WORKDIR /app
COPY . .
RUN npm ci
USER node
CMD ["node", "--import", "tsx", "packages/engine/src/standalone.ts", "--host", "0.0.0.0", "--behind-proxy", "--token-file", "/run/secrets/fabrica_token"]
```

```
docker run -d --name fabrica-engine -p 127.0.0.1:4317:4317 \
  -e ANTHROPIC_API_KEY -e FABRICA_WORKSPACE=/work -e FABRICA_MEMORY_DB=/data/memory.db \
  -v fabrica-proyecto:/work -v fabrica-datos:/data \
  -v /etc/fabrica/token:/run/secrets/fabrica_token:ro fabrica-engine
```

`-p 127.0.0.1:4317:4317` publica el puerto solo hacia el proxy de la máquina, no a Internet. Con
`--host 0.0.0.0` dentro del contenedor, `--behind-proxy` es obligatorio y es verdad solo si el puerto no
se expone directo.

## Conectar la app

Ajustes → **Motor** → Remoto: URL `wss://fabrica.example.com` y el token. La app lo guarda cifrado
(`safeStorage`, igual que la API key), se reinicia y se conecta. Para volver al motor local, Ajustes →
Motor → Local. Con motor remoto el botón "Elegir carpeta" se deshabilita (la carpeta es del servidor) y la
API key no se pide.

## Límites conocidos

- Las vistas previas de bloques visuales y el recorrido de Playwright corren en el servidor, en su
  `127.0.0.1`: la vista previa embebida de la app **no puede abrirlas** desde otra PC. Falta un túnel o
  proxy de la vista previa; hasta entonces los bloques visuales se revisan solo en motor local.
- Un servidor sirve a una sola persona/proyecto: no hay cuentas ni aislamiento entre clientes.
- No se probó contra un VPS real (ver "Qué requiere recursos del usuario" en `FASE-5.md`).

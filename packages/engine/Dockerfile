# Motor de Fabrica! para servidor (opción "c", ver docs/SERVIDOR.md y docs/NAS.md).
# Construir desde la raíz del repo:  docker build -f packages/engine/Dockerfile -t fabrica-engine .
FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
    FABRICA_MEMORY_DB=/data/memoria/memory.db

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/events/package.json packages/events/
COPY packages/engine/package.json packages/engine/
# tsx es devDependency del motor y hace falta para correr el código TypeScript.
RUN npm ci --workspace @fabrica/engine --workspace @fabrica/events --include=dev --ignore-scripts \
 && npx playwright-core install --with-deps chromium \
 && rm -rf /root/.npm

COPY packages/events packages/events
COPY packages/engine packages/engine

# Usuario sin privilegios; solo /data es escribible (proyectos y memoria).
RUN useradd --create-home --uid 10001 fabrica \
 && mkdir -p /data/proyectos /data/memoria \
 && chown -R fabrica:fabrica /data
USER fabrica
VOLUME ["/data/proyectos", "/data/memoria"]
EXPOSE 4317

# Token: FABRICA_TOKEN o --token-file. Key: ANTHROPIC_API_KEY. Carpeta: FABRICA_WORKSPACE.
# Detrás de `tailscale serve` (TLS en el proxy): --host 0.0.0.0 --behind-proxy.
WORKDIR /app/packages/engine
ENTRYPOINT ["npx", "tsx", "src/standalone.ts"]
CMD ["--host", "0.0.0.0", "--port", "4317", "--behind-proxy"]

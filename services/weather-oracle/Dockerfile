# ---- Imagen Base ----
FROM node:24.11.1-alpine AS base

# Directorio de trabajo
WORKDIR /app

# Habilita pnpm en la imagen
RUN corepack enable

# 🛡️ Evita que corepack pida confirmaciones interactivas al descargar pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# ---- Builder: Instala, compila y genera ----
FROM base AS builder
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Copia manifiestos y configuraciones del monorepo.
COPY package.json pnpm-lock.yaml ./
COPY turbo.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copia los package.json de cada workspace
COPY packages/database/package.json ./packages/database/
COPY services/weather-oracle/package.json ./services/weather-oracle/

# Instala dependencias (Caché persistente)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
    --fetch-retries 10 \
    --fetch-retry-mintimeout 5000 \
    --fetch-retry-maxtimeout 5000

# Copia el código fuente
COPY packages/database/ ./packages/database/
COPY services/weather-oracle/ ./services/weather-oracle/

# Genera el cliente de Prisma (URL dummy para validación)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    pnpm --filter=@package/database db:generate

# Construye los bundles
RUN pnpm --filter=@package/database build
RUN pnpm --filter=@service/weather-oracle build

# ---- Despliegue Limpio de Dependencias ----
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm deploy --filter=@service/weather-oracle --legacy --prod /deploy \
    --prefer-offline \
    --fetch-retries 10 \
    --fetch-retry-mintimeout 5000 \
    --fetch-retry-maxtimeout 5000

# ---- Production: Imagen final ----
FROM base AS production

# Instala cliente PostgreSQL (para healthcheck en entrypoint)
RUN apk add postgresql-client

# ---- Copiamos los Artefactos Construidos ----
COPY --from=builder /deploy .

# ---- Inyectamos los artefactos compilados ----
COPY --from=builder /app/services/weather-oracle/dist ./dist
COPY --from=builder /app/packages/database ./packages/database

# ---- Scripts de Arranque ----
COPY services/weather-oracle/entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["node", "dist/bundle.mjs"]

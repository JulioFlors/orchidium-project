# ---- Imagen Base ----
FROM node:24.11.1-alpine AS base

# Directorio de trabajo
WORKDIR /app

# Habilita pnpm en la imagen
RUN corepack enable

# ---- Builder: Instala, compila y genera ----
FROM base AS builder

# Copia manifiestos y configuraciones del monorepo.
COPY package.json pnpm-lock.yaml ./
COPY turbo.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copia los package.json de cada workspace
COPY packages/database/package.json ./packages/database/
COPY services/ingest/package.json ./services/ingest/

# Instala dependencias (Caché persistente)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --fetch-retries 10 \
    --fetch-retry-mintimeout 5000 --fetch-retry-maxtimeout 5000

# Copia el código fuente
COPY packages/database/ ./packages/database/
COPY services/ingest/ ./services/ingest/

# Genera el cliente de Prisma (URL dummy para validación)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    pnpm --filter=@package/database db:generate

# Construye los bundles
RUN pnpm --filter=@package/database build
RUN pnpm --filter=@service/ingest build

# ---- Despliegue Limpio de Dependencias ----
# Desplegamos en un carpeta /deploy lista para producción, limpia y podada.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm deploy --filter=@service/ingest --legacy --prod /deploy \
    --prefer-offline --fetch-retries 10 \
    --fetch-retry-mintimeout 5000 --fetch-retry-maxtimeout 5000

# ---- Production: Imagen final ----
FROM base AS production

# ---- Copiamos los Artefactos Construidos ----
# Copiamos SOLO la carpeta desplegada desde el builder
COPY --from=builder /deploy .

# ---- Inyectamos los artefactos compilados ----
# Copiamos el bundle generado (nuestro ejecutable)
COPY --from=builder /app/services/ingest/dist ./dist

# ---- Scripts de Arranque ----
# Copia el script de arranque al directorio de binarios locales.
# /usr/local/bin está en el PATH del sistema, lo que permite que el script
# se ejecute directamente por su nombre sin necesidad de una ruta relativa.
COPY services/ingest/entrypoint.sh /usr/local/bin/
# Otorga permisos de ejecución al script de entrypoint.
RUN chmod +x /usr/local/bin/entrypoint.sh

# Establece el entrypoint
ENTRYPOINT ["entrypoint.sh"]

# Comando que se pasará al entrypoint
CMD ["node", "dist/bundle.mjs"]
FROM node:23-alpine  AS base

# Etapa 1: Construcción (Builder)
# Esta etapa instala todo, compila el código y prepara una carpeta 'deploy' limpia.
FROM base AS builder

# Directorio de trabajo dentro del contenedor.
WORKDIR /app

# enable corepack for pnpm
RUN corepack enable

# Copia manifiestos y configuraciones del monorepo.
COPY package.json pnpm-lock.yaml ./
COPY turbo.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copia los package.json de cada workspace
COPY packages/database/package.json ./packages/database/
COPY services/mqtt/package.json ./services/mqtt/

# Instala las dependencias del monorepo
RUN pnpm install --frozen-lockfile

# Copia todo el código fuente
COPY packages/database/ ./packages/database/
COPY services/mqtt/ ./services/mqtt/

# Genera el cliente de la base de datos.
RUN pnpm db:generate
# Construye el servicio de ingesta.
RUN pnpm build:ingest

# Etapa 2: Producción
# Se suele utilizar una imagen base aun mas ligera para el entorno de producción.
FROM base AS production

# Directorio de trabajo dentro del contenedor.
WORKDIR /app

# enable corepack for pnpm
RUN corepack enable
#################################################################################
# Copia el package.json del servicio para instalar dependencias de producción
#COPY --from=builder /app/services/mqtt/package.json .

# Instala SOLAMENTE las dependencias de producción (ej. mqtt, @prisma/client)
# No necesitamos las dependencias de workspace, ya están empaquetadas en el bundle.
#RUN pnpm install --prod
#################################################################################

# (NUEVA ESTRATEGIA PNPM)
# Copia solo los archivos necesarios para instalar dependencias de producción
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/services/mqtt/package.json ./services/mqtt/


# Instala SOLAMENTE las dependencias de producción de todo el workspace.
# El flag '--prod' podará las devDependencies.
RUN pnpm install --prod

# Copia la dependencia del workspace ya construida (el código de @package/database)
# Esto es necesario porque el bundle espera encontrarlo.
COPY --from=builder /app/packages/database ./packages/database

#################################################################################
# Copia el bundle.js auto-contenido desde el builder
COPY --from=builder /app/services/mqtt/dist/bundle.js ./dist/

# Copia el schema de Prisma, que es necesario en tiempo de ejecución
COPY --from=builder /app/packages/database/prisma ./prisma
#################################################################################
# Copia el script de arranque al directorio de binarios locales.
# /usr/local/bin está en el PATH del sistema, lo que permite que el script
# se ejecute directamente por su nombre sin necesidad de una ruta relativa.
COPY services/mqtt/entrypoint.sh /usr/local/bin/
# Otorga permisos de ejecución al script de entrypoint.
RUN chmod +x /usr/local/bin/entrypoint.sh

# Establece el entrypoint
ENTRYPOINT ["entrypoint.sh"]

# Comando que se pasará al entrypoint
CMD ["node", "dist/bundle.js"]
#!/bin/bash
# deploy.sh - Script de despliegue para producción.
# -------------------------------------------------------------------
# 📊 GESTIÓN DE BASE DE DATOS (Flujo de Trabajo)
# -------------------------------------------------------------------
# Las migraciones son un proceso exclusivo del entorno de DESARROLLO.
# 1. En LOCAL: Modificar schema.prisma -> `pnpm prisma migrate dev`
# 2. En PROD: Al ejecutar este script, el código en el VPS ya tendrá 
#    las migraciones registradas.
#
# Comandos manuales en el VPS (si es necesario):
# - Aplicar pendientes: docker compose exec scheduler npx prisma migrate deploy
# - Resetear (⚠️ BORRA TODO): docker compose exec scheduler npx prisma migrate reset --force
# -------------------------------------------------------------------

set -e

# ---- Colores ----
RESET='\x1b[0m'
RED='\x1b[91m'
GREEN='\x1b[92m'
YELLOW='\x1b[93m'
BLUE='\x1b[94m'
MAGENTA='\x1b[95m'
CYAN='\x1b[96m'
WHITE='\x1b[97m'

# Evitar que pnpm pida confirmaciones interactivas
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Confirmar un paso de ser necesario.
confirm() {
    echo ""
    read -p "$(echo -e "${YELLOW}⚡ $1 [s/N]:${RESET}")" choice
    case "$choice" in
        s|S|si|SI|Si ) return 0 ;;
        * ) return 1 ;;
    esac
}

echo ""
echo -e "${GREEN}🌵 PristinoPlant | Deploy${RESET}"
echo ""

# -------------------------------------------------------------------
# PASO 1: Sincronizar (Protegiendo infraestructura local)
# -------------------------------------------------------------------
echo -e "${CYAN}📡 [1/5] Sincronizando con origin/main${RESET}"
echo ""
git fetch origin main
# PROTECCIÓN: Resetear el código pero sin tocar la carpeta de certificados y logs
git reset --hard origin/main

echo ""
echo -e "${GREEN}✅ Repositorio Sincronizado${RESET}"

# -------------------------------------------------------------------
# PASO 2: Construir imágenes
# -------------------------------------------------------------------
echo ""
echo -e "${CYAN}🏗️ [2/5] Construyendo imágenes${RESET}"
docker compose build

echo ""
echo -e "${GREEN}✅ Imágenes construidas${RESET}"

# -------------------------------------------------------------------
# PASO 3: Sincronizar Base de Datos
# -------------------------------------------------------------------
echo ""
echo -e "${CYAN}🐘 [3/5] Sincronizando esquema de Base de Datos${RESET}"
echo ""

# Aplicamos migraciones pendientes de forma automática y segura
# Este es un paso de formalización; el cambio real ya ocurrió en local
docker compose run --rm scheduler pnpm --filter @package/database db:deploy

echo ""
echo -e "${GREEN}✅ Base de Datos Sincronizada${RESET}"

# -------------------------------------------------------------------
# PASO 4: Levantar servicios
# -------------------------------------------------------------------
echo ""
echo -e "${CYAN}🚀 [4/5] Levantando servicios${RESET}"
docker compose up -d --remove-orphans
echo ""
echo -e "${GREEN}✅ Servicios levantados${RESET}"

# -------------------------------------------------------------------
# PASO 5: Limpieza
# -------------------------------------------------------------------
echo ""
echo -e "${YELLOW}🧹 [5/5] Limpiando imágenes y caché antigua${RESET}"

# Borra imágenes colgantes
docker image prune -f

# Borra SOLO la caché de construcción que tenga más de 7 días de antigüedad (168 horas)
docker builder prune -f --filter "until=168h"

echo ""
echo -e "${GREEN}✅ Deploy Finalizado${RESET}"
echo ""
docker compose ps
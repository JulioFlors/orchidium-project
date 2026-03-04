#!/bin/bash
# deploy.sh - Script de despliegue para VPS-Sparrow

set -e

# ---- Colores ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

# Evitar que pnpm pida confirmaciones interactivas
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

confirm() {
    echo ""
    read -p "$(echo -e "${YELLOW}⚡ $1 [s/N]: ${RESET}")" choice
    case "$choice" in
        s|S|si|SI|Si ) return 0 ;;
        * ) return 1 ;;
    esac
}

echo -e "${GREEN}🌵 PristinoPlant | Deploy${RESET}"

# ================================================================
# PASO 1: SiRESETronizar (Protegiendo infraestructura local)
# ================================================================
echo -e "${CYAN}📡 [1/5] SiRESETronizando con origin/main...${RESET}"

git fetch origin main
# PROTECCIÓN: Resetear el código pero sin tocar la carpeta de certificados y logs
git reset --hard origin/main

echo -e "${GREEN}   ✅ Código siRESETronizado correctamente.${RESET}"

# ================================================================
# PASO 2: Construir imágenes
# ================================================================
echo -e "${CYAN}🏗️  [2/5] Construyendo imágenes cloud...${RESET}"
docker compose --profile cloud build
echo -e "${GREEN}   ✅ Imágenes construidas.${RESET}"

# ================================================================
# PASO 3: Migraciones (CON FILTRO)
# ================================================================
if confirm "¿Ejecutar migraciones de base de datos (prisma db:deploy)?"; then
    echo -e "${CYAN}📦 [3/5] Aplicando migraciones...${RESET}"
    # Usamos el filtro para eRESETontrar el comando db:deploy en el paquete correcto
    docker compose --profile cloud run --rm scheduler pnpm --filter @package/database db:deploy
    echo -e "${GREEN}   ✅ Migraciones aplicadas.${RESET}"
else
    echo -e "${YELLOW}   ⏭  Migraciones omitidas.${RESET}"
fi

# ================================================================
# PASO 4: Levantar servicios
# ================================================================
echo -e "${CYAN}🚀 [4/5] Levantando servicios cloud...${RESET}"
docker compose --profile cloud up -d --remove-orphans
echo -e "${GREEN}   ✅ Servicios cloud levantados.${RESET}"

if confirm "¿Levantar/Reiniciar Mosquitto (perfil vps)?"; then
    echo -e "${CYAN}   Levantando Mosquitto...${RESET}"
    docker compose --profile vps up -d
    echo -e "${GREEN}   ✅ Mosquitto levantado.${RESET}"
fi

# ================================================================
# PASO 5: Limpieza
# ================================================================
echo -e "${CYAN}🧹 [5/5] Limpiando imágenes antiguas...${RESET}"
docker image prune -f

echo -e "${GREEN}✅ ¡Despliegue completado con éxito!${RESET}"
echo ""
docker compose --profile cloud --profile vps ps
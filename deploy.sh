#!/bin/bash
# deploy.sh - Script de despliegue para VPS-Sparrow

set -e

# ---- Colores ----
RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'

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
echo ""
echo -e "${GREEN}🌵 PristinoPlant | Deploy${RESET}"
echo ""

# ================================================================
# PASO 1: Sicronizar (Protegiendo infraestructura local)
# ================================================================
echo -e "${CYAN}📡 [1/5] Sicronizando con origin/main${RESET}"
echo ""
git fetch origin main
# PROTECCIÓN: Resetear el código pero sin tocar la carpeta de certificados y logs
git reset --hard origin/main

echo ""
echo -e "${GREEN}   ✅ Repositorio Sicronizado${RESET}"

# ================================================================
# PASO 2: Construir imágenes
# ================================================================
echo ""
echo -e "${CYAN}🏗️  [2/5] Construyendo imágenes${RESET}"
docker compose --profile cloud build
echo ""
echo -e "${GREEN}   ✅ Imágenes construidas${RESET}"
echo ""

# ================================================================
# PASO 3: Migraciones (CON FILTRO)
# ================================================================
if confirm "¿Ejecutar migraciones de base de datos (prisma db:deploy)?"; then
    echo ""
    echo -e "${CYAN}📦 [3/5] Aplicando migraciones${RESET}"
    # Usamos el filtro para eRESETontrar el comando db:deploy en el paquete correcto
    docker compose --profile cloud run --rm scheduler pnpm --filter @package/database db:deploy
    echo ""
    echo -e "${GREEN}   ✅ Migraciones aplicadas${RESET}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}   ⏭️  Migraciones omitidas${RESET}"
    echo ""
fi

# ================================================================
# PASO 4: Levantar servicios
# ================================================================
echo ""
echo -e "${CYAN}🚀 [4/5] Levantando servicios cloud${RESET}"
docker compose --profile cloud up -d --remove-orphans
echo ""
echo -e "${GREEN}✅ Servicios cloud levantados${RESET}"
echo ""

if confirm "¿Levantar/Reiniciar Mosquitto (perfil vps)?"; then
    echo ""
    echo -e "${CYAN}   Levantando Mosquitto${RESET}"
    echo ""
    docker compose --profile vps up -d
    echo ""
    echo -e "${GREEN}✅ Mosquitto levantado${RESET}"
    echo ""
fi

# ================================================================
# PASO 5: Limpieza
# ================================================================
echo ""
echo -e "${CYAN}🧹 [5/5] Limpiando imágenes antiguas${RESET}"
docker image prune -f

echo ""
echo -e "${GREEN}✅ ok{RESET}"
echo ""
docker compose --profile cloud --profile vps ps

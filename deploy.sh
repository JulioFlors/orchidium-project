#!/bin/bash
# deploy.sh - Script de despliegue para VPS-Sparrow

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

# ================================================================
# PASO 1: Sincronizar (Protegiendo infraestructura local)
# ================================================================
echo -e "${CYAN}📡 [1/4] Sincronizando con origin/main${RESET}"
echo ""
git fetch origin main
# PROTECCIÓN: Resetear el código pero sin tocar la carpeta de certificados y logs
git reset --hard origin/main

echo ""
echo -e "${GREEN}✅ Repositorio Sincronizado${RESET}"

# ================================================================
# PASO 2: Construir imágenes
# ================================================================
echo ""
echo -e "${CYAN}🏗️ [2/5] Construyendo imágenes${RESET}"
docker compose --profile cloud build
echo ""
echo -e "${GREEN}✅ Imágenes construidas${RESET}"

# ================================================================
# PASO 3: Levantar servicios
# ================================================================
echo ""
echo -e "${CYAN}🚀 [3/4] Levantando servicios cloud${RESET}"
docker compose --profile cloud up -d --remove-orphans
echo ""
echo -e "${GREEN}✅ Servicios cloud levantados${RESET}"
echo ""

if confirm "¿Levantar/Reiniciar Mosquitto (perfil vps)?"; then
    echo ""
    echo -e "${CYAN}🚀 Levantando Mosquitto${RESET}"
    echo ""
    docker compose --profile vps up -d
    echo ""
    echo -e "${GREEN}✅ Mosquitto levantado${RESET}"
    echo ""
fi

# ================================================================
# PASO 4: Limpieza
# ================================================================
echo ""
echo -e "${YELLOW}🧹 [4/4] Limpiando imágenes y caché antigua${RESET}"

# Borra imágenes colgantes
docker image prune -f

# Borra SOLO la caché de construcción que tenga más de 7 días de antigüedad (168 horas)
docker builder prune -f --filter "until=168h"

echo ""
echo -e "${GREEN}✅ Deploy Finalizado${RESET}"
echo ""
docker compose --profile cloud --profile vps ps
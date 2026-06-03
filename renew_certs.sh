#!/bin/bash
# renew_certs.sh - Automatización de renovación y aislamiento de certificados SSL/TLS en VPS.
# -------------------------------------------------------------------------------------
# 
# 🆘 PLAN DE CONTINGENCIA / RESTAURACIÓN (En caso de fallo en Certbot):
# Si el script falla durante la generación de certificados y necesitas restaurar el estado anterior,
# ejecuta los siguientes comandos en tu VPS (reemplazando la fecha con el nombre real del respaldo):
# 
#   1. Eliminar la carpeta limpia/incompleta:
#      sudo rm -rf infrastructure/certs
# 
#   2. Restaurar la carpeta del respaldo:
#      sudo cp -rp infrastructure/certs_backup_YYYYMMDD_HHMMSS infrastructure/certs
# 
#   3. Reiniciar los contenedores para volver a usar los certificados anteriores:
#      docker compose --profile cloud restart postgres influxdb mosquitto
# 
# -------------------------------------------------------------------------------------

set -e

# ---- Colores para la terminal ----
RESET='\x1b[0m'
RED='\x1b[91m'
GREEN='\x1b[92m'
YELLOW='\x1b[93m'
BLUE='\x1b[94m'
CYAN='\x1b[96m'

# Asegurar que el script se ejecuta en la raíz del proyecto
cd "$(dirname "$0")"

echo -e "${GREEN}🌵 PristinoPlant | Renovación de Certificados SSL${RESET}"
echo -e "${CYAN}------------------------------------------------------------${RESET}"

# Requisito previo: Validar que Docker esté instalado
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}❌ Error: Docker no está instalado o no se puede ejecutar en este sistema.${RESET}" >&2
  exit 1
fi

# Confirmar inicio
read -p "$(echo -e "${YELLOW}⚡ ¿Deseas iniciar el proceso de renovación de certificados? [s/N]: ${RESET}")" CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS](i|I)?$ ]]; then
  echo -e "${BLUE}🛑 Proceso cancelado por el usuario.${RESET}"
  exit 0
fi

# -------------------------------------------------------------------------------------
# PASO PREVENTIVO: Crear Respaldo y Limpiar Linajes Antiguos de Certbot
# -------------------------------------------------------------------------------------
BACKUP_DIR="infrastructure/certs_backup_$(date +%Y%m%d_%H%M%S)"
echo -e "\n${CYAN}📦 Creando respaldo de seguridad en '${BACKUP_DIR}'...${RESET}"
mkdir -p "$BACKUP_DIR"
if [ -d "infrastructure/certs" ]; then
  sudo cp -rp infrastructure/certs/* "$BACKUP_DIR/"
  echo -e "${GREEN}✅ Respaldo preventivo creado con éxito.${RESET}"
else
  echo -e "${YELLOW}⚠️ No se encontró la carpeta 'infrastructure/certs'. Se creará desde cero.${RESET}"
fi

echo -e "${CYAN}🧹 Limpiando configuraciones antiguas de Certbot para evitar conflictos y directorios incrementales (-0001)...${RESET}"
# Eliminar linajes antiguos en live, archive y renewal
sudo rm -rf infrastructure/certs/live/mqtt.sisparrow.com*
sudo rm -rf infrastructure/certs/archive/mqtt.sisparrow.com*
sudo rm -rf infrastructure/certs/renewal/mqtt.sisparrow.com*.conf

sudo rm -rf infrastructure/certs/live/vps.sisparrow.com*
sudo rm -rf infrastructure/certs/archive/vps.sisparrow.com*
sudo rm -rf infrastructure/certs/renewal/vps.sisparrow.com*.conf

# -------------------------------------------------------------------------------------
# PASO 1: Generación de Certificados con Certbot Docker (RSA 2048 - Estándar IoT)
# -------------------------------------------------------------------------------------
# RSA 2048 es el estándar comprobado para dispositivos IoT (ESP32/MicroPython).
# El motor mbedTLS del ESP32 soporta nativamente las cipher suites ECDHE_RSA,
# lo que garantiza un handshake TLS exitoso con bajo consumo de RAM (~45KB).
# -------------------------------------------------------------------------------------
echo -e "\n${CYAN}🔑 [1/5] Ejecutando Certbot para 'mqtt.sisparrow.com' (RSA 2048)...${RESET}"
echo -e "${YELLOW}⚠️  Asegúrate de que el puerto 80 del VPS esté totalmente libre.${RESET}\n"

sudo docker run -it --rm -p 80:80 \
  -v $(pwd)/infrastructure/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d mqtt.sisparrow.com

echo -e "\n${CYAN}🔑 [2/5] Ejecutando Certbot para 'vps.sisparrow.com' (RSA 2048)...${RESET}\n"

sudo docker run -it --rm -p 80:80 \
  -v $(pwd)/infrastructure/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d vps.sisparrow.com

# -------------------------------------------------------------------------------------
# PASO 2: Limpieza de directorios dedicados previos
# -------------------------------------------------------------------------------------
echo -e "\n${CYAN}🗑️  [3/5] Limpiando carpetas de certificados dedicados anteriores...${RESET}"
sudo rm -rf infrastructure/certs/mosquitto/*
sudo rm -rf infrastructure/certs/postgres/*
sudo rm -rf infrastructure/certs/influxdb/*

# -------------------------------------------------------------------------------------
# PASO 3: Copiar nuevos certificados resolviendo los enlaces simbólicos
# -------------------------------------------------------------------------------------
echo -e "${CYAN}📂 [4/5] Copiando certificados a directorios aislados...${RESET}"
mkdir -p infrastructure/certs/mosquitto
mkdir -p infrastructure/certs/postgres
mkdir -p infrastructure/certs/influxdb

# Copia resolviendo enlaces simbólicos (-L)
sudo cp -L infrastructure/certs/live/mqtt.sisparrow.com/* infrastructure/certs/mosquitto/
sudo cp -L infrastructure/certs/live/vps.sisparrow.com/* infrastructure/certs/postgres/
sudo cp -L infrastructure/certs/live/vps.sisparrow.com/* infrastructure/certs/influxdb/

# -------------------------------------------------------------------------------------
# PASO 4: Otorgar propiedad y permisos de lectura estándar
# -------------------------------------------------------------------------------------
echo -e "${CYAN}🔒 [5/5] Ajustando propiedad (UID) y permisos de seguridad...${RESET}"

# A. Mosquitto (Usuario interno UID 1883)
echo -e "   ├─ Configurando permisos para Mosquitto (UID 1883)..."
sudo chown -R 1883:1883 infrastructure/certs/mosquitto/
sudo chmod 600 infrastructure/certs/mosquitto/privkey.pem
sudo chmod 644 infrastructure/certs/mosquitto/fullchain.pem

# B. PostgreSQL (Usuario interno UID 999)
echo -e "   ├─ Configurando permisos para PostgreSQL (UID 999)..."
sudo chown -R 999:999 infrastructure/certs/postgres/
sudo chmod 600 infrastructure/certs/postgres/privkey.pem
sudo chmod 644 infrastructure/certs/postgres/fullchain.pem

# C. InfluxDB (Usuario interno UID 1500)
echo -e "   └─ Configurando permisos para InfluxDB (UID 1500)..."
sudo chown -R 1500:1500 infrastructure/certs/influxdb/
sudo chmod 644 infrastructure/certs/influxdb/privkey.pem
sudo chmod 644 infrastructure/certs/influxdb/fullchain.pem

# -------------------------------------------------------------------------------------
# REINICIAR SERVICIOS
# -------------------------------------------------------------------------------------
echo -e "\n${CYAN}🔄 Reiniciando contenedores de infraestructura en Docker...${RESET}"
docker compose --profile cloud restart postgres influxdb mosquitto

echo -e "\n${GREEN}✅ Certificados renovados y contenedores reiniciados con éxito!${RESET}"
echo -e "${YELLOW}💡 Te recomendamos verificar el estado de los logs mediante: ${BLUE}docker logs mosquitto | tail -n 20${RESET}\n"

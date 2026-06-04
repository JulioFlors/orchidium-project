#!/bin/bash
# renew_certs.sh - Automatización de renovación y aislamiento de certificados SSL/TLS en VPS.
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
# PASO PREVENTIVO: Limpiar Linajes Antiguos de Certbot
# -------------------------------------------------------------------------------------
echo -e "${CYAN}🧹 Limpiando configuraciones antiguas de Certbot para evitar conflictos y directorios incrementales (-0001)...${RESET}"
# Eliminar linajes antiguos en live, archive y renewal
sudo rm -rf infrastructure/certs/live/mqtt.sisparrow.com*
sudo rm -rf infrastructure/certs/archive/mqtt.sisparrow.com*
sudo rm -rf infrastructure/certs/renewal/mqtt.sisparrow.com*.conf

sudo rm -rf infrastructure/certs/live/vps.sisparrow.com*
sudo rm -rf infrastructure/certs/archive/vps.sisparrow.com*
sudo rm -rf infrastructure/certs/renewal/vps.sisparrow.com*.conf

# -------------------------------------------------------------------------------------
# PASO 1: Generación de Certificados con Certbot Docker
# -------------------------------------------------------------------------------------
# NOTA: Las versiones modernas de Certbot generan certificados ECDSA (secp256r1) por
# defecto. El ESP32 es compatible con ECDSA (de hecho, es más liviano que RSA 2048),
# pero fallaba debido a que la cadena completa ("fullchain.pem") excedía la RAM.
# La solución real es usar "cert.pem" (solo la hoja) en el broker Mosquitto.
# -------------------------------------------------------------------------------------

# A. Abrir temporalmente el puerto 80 en UFW si está activo
UFW_STATUS=$(sudo ufw status | grep -i "Status: active" || true)
PORT80_ADDED=false
if [ -n "$UFW_STATUS" ]; then
  echo -e "\n${YELLOW}🛡️  UFW activo. Abriendo temporalmente el puerto 80/tcp...${RESET}"
  sudo ufw allow 80/tcp
  PORT80_ADDED=true
fi

echo -e "\n${CYAN}🔑 [1/5] Ejecutando Certbot para 'mqtt.sisparrow.com'...${RESET}"
echo -e "${YELLOW}⚠️  Asegúrate de que no haya otros servicios ocupando el puerto 80 del VPS.${RESET}\n"

sudo docker run -it --rm -p 80:80 \
  -v $(pwd)/infrastructure/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d mqtt.sisparrow.com

echo -e "\n${CYAN}🔑 [2/5] Ejecutando Certbot para 'vps.sisparrow.com'...${RESET}\n"

sudo docker run -it --rm -p 80:80 \
  -v $(pwd)/infrastructure/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d vps.sisparrow.com

# B. Cerrar el puerto 80 en UFW si fue abierto por este script
if [ "$PORT80_ADDED" = true ]; then
  echo -e "\n${YELLOW}🛡️  Cerrando el puerto 80/tcp en el firewall UFW...${RESET}"
  sudo ufw delete allow 80/tcp
fi

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

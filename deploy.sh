#!/bin/bash
# deploy.sh - Script de despliegue para VPS (PristinoPlant)

# Detener el script si CUALQUIER comando falla
set -e

echo " "
echo "🌵 PristinoPlant | Iniciando Despliegue"
echo "--------------------------------------"

# 1. Forzar limpieza local para evitar conflictos de merge
echo "🧹 Limpiando cambios locales en el VPS para evitar conflictos..."
git reset --hard HEAD
git clean -fd

# 2. Bajar cambios (con validación extra)
echo "📡 Bajando cambios de main..."
if git pull origin main; then
    echo "✅ Cambios descargados con éxito."
else
    echo "❌ Error: No se pudieron descargar los cambios de GitHub."
    exit 1
fi

# 3. Construir imágenes
echo " "
echo "🏗️  Construyendo servicios (Profiles: cloud)"
# Construimos solo los servicios de la app (ingest y scheduler)
docker compose --profile cloud build

# 4. Ejecutar Migraciones (Paso Crítico)
# Nota: Usamos 'scheduler' (nombre nuevo) y el perfil 'cloud'
echo " "
echo "📦 Aplicando migraciones de base de datos..."
docker compose --profile cloud run --rm scheduler pnpm db:deploy

# 5. Levantar Servicios
echo " "
echo "🚀 Levantando servicios (Infrastructure + App)"
# Esto levantará Mosquitto (vps) y los servicios de backend (cloud)
docker compose --profile vps --profile cloud up -d --remove-orphans

# 6. Limpieza de imágenes huérfanas
echo " "
echo "🧹 Limpiando imágenes antiguas para ahorrar espacio..."
docker image prune -f

echo " "
echo "✅ ¡Despliegue completado con éxito!"
echo "--------------------------------------"

#!/bin/bash
# deploy.sh - Script de despliegue para VPS (PristinoPlant)

# Detener el script si hay errores
set -e

echo " "
echo "🌵 PristinoPlant | Iniciando Despliegue"
echo " "

# 1. Bajar cambios
echo "📡 Bajando cambios de main"
git pull origin main

# 2. Construir imágenes (sin levantar aún)
echo " "
echo "🏗️  Construyendo servicios"
docker compose build

# 3. Ejecutar Migraciones (Paso Crítico)
# Usamos el contenedor de scheduler (que tiene el código y prisma) de forma efímera
# para ejecutar el deploy contra la DB de producción.
echo " "
echo "📦 Aplicando migraciones de base de datos"
docker compose run --rm scheduler-cloud pnpm db:deploy

# 4. Levantar Servicios
echo " "
echo "🚀 Levantando servicios (Re-creando si es necesario)"
docker compose up -d

# 5. Limpieza
echo " "
echo "🧹 Limpiando imágenes antiguas"
docker image prune -f

echo " "
echo "✅ ¡Despliegue completado con éxito!"
echo " "

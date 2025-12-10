#!/bin/sh
set -e # Salir inmediatamente si un comando falla

echo "                                                   "
echo "🚀 Iniciando servicio de adquisición de datos MQTT "
echo "                                                   "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
#!/bin/sh
set -e # Salir inmediatamente si un comando falla

echo " "
echo "🐘 Verificando conexión con la base de datos $DB_HOST"
echo " "

# Espera a que la base de datos esté lista.
until pg_isready --username="$DB_USER" --host="$DB_HOST"; do
  >&2 echo " "
  >&2 echo "🕒 La Base de Datos aun no está disponible"
  sleep 2
done

echo " "
echo "✅ $DB_HOST está listo."
echo " "

echo "🚀 Iniciando servicio de adquisición de datos MQTT "
echo " "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
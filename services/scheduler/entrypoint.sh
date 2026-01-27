#!/bin/sh
set -e # Salir inmediatamente si un comando falla

echo "Verificando conexión con la base de datos $DB_HOST"

# Espera a que la base de datos esté lista.
until pg_isready --username="$DB_USER" --host="$DB_HOST"; do
  >&2 echo "La Base de Datos aun no está disponible"
  sleep 10
done

echo "✅ $DB_HOST está listo."

# Ejecuta el comando de Prisma usando su binario.
if ! /app/node_modules/.bin/prisma migrate deploy --config=/app/packages/database/prisma.config.ts; then
  >&2 echo "❌ FALLO al aplicar las migraciones."
  >&2 echo "⚠️ El contenedor se reiniciara en 5 minutos."
  sleep 300
  exit 1 # Salimos del script con un código de error.
fi

  echo "                         "
  echo "✅ Migraciones aplicadas."
  echo "                         "
  echo "🚀 Iniciando servicio de Rutinas de Riego Automatizadas (Scheduler)."
  echo "                         "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
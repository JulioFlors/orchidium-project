#!/bin/sh
set -e # Salir inmediatamente si un comando falla

# Wait for the database to be ready
until pg_isready --username="$DB_USER" --host="$DB_HOST"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 30
done

>&2 echo "Postgres is Ready"

# Ejecuta el comando de Prisma usando node.
# Es la forma más directa y no requiere descargas.
if node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma; then
  # Si el comando tiene éxito (código de salida 0), imprimimos el mensaje de éxito.
  echo "--- Entrypoint: Migraciones aplicadas. Iniciando servicio... ---"
else
  # Si el comando falla (código de salida distinto de 0), imprimimos un error y salimos.
  echo "--- Entrypoint: ¡FALLO en la migración de la base de datos! El contenedor se detendrá. ---"
  exit 1 # Salimos del script con un código de error.
fi

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.js"]
exec "$@"

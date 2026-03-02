#!/bin/sh
set -e # Salir inmediatamente si un comando falla

echo "Verificando conexión con la base de datos $DB_HOST"

# Espera a que la base de datos esté lista.
until pg_isready --username="$DB_USER" --host="$DB_HOST"; do
  >&2 echo " "
  >&2 echo "🕒 La Base de Datos aun no está disponible"
  sleep 2
done

echo " "
echo "✅ $DB_HOST está listo."
echo " "

echo "Verificando conexión con InfluxDB ($INFLUX_URL)"

# wget viene preinstalado en Alpine, a diferencia de curl.
# InfluxDB 3 no expone /ping ni /health, pero responde con 200 a la raíz.
until wget -q --spider --timeout=5 "$INFLUX_URL" 2>/dev/null; do
  >&2 echo " "
  >&2 echo "🕒 InfluxDB aun no responde en $INFLUX_URL"
  sleep 5
done
echo " "
echo "✅ InfluxDB está listo."


# NOTA: Las migraciones se han movido al pipeline de despliegue (deploy.sh)
# para evitar condiciones de carrera y reinicios en bucle.

echo " "
echo "🚀 Iniciando servicio de Rutinas de Riego Automatizadas (Scheduler)."
echo " "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
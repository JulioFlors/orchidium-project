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

# InfluxDB 3 no expone /ping ni /health, pero responde con 200 a la raíz.
# InfluxDB 3 requiere el Token incluso para verificar la raíz.
# NOTA: wget viene preinstalado en Alpine, a diferencia de curl.
#       Se agrega --no-check-certificate para evitar fallos de handshake TLS con HTTPS.
until wget --no-check-certificate --header="Authorization: Token $INFLUX_TOKEN" -q --spider --timeout=5 "$INFLUX_URL" 2>/dev/null; do
  >&2 echo " "
  >&2 echo "🕒 InfluxDB aun no responde en $INFLUX_URL"
  sleep 5
done

echo " "
echo "✅ $INFLUX_URL está listo."
echo " "

echo "🚀 Iniciando servicio de Rutinas de Riego Automatizadas (Scheduler)."
echo " "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
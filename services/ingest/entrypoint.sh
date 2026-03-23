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

echo "📡 Verificando conexión con InfluxDB ($INFLUX_URL)"
echo " "

# InfluxDB 3 no expone /ping ni /health. Se verifica que responda HTTP.
# Con autenticación habilitada responde 401/404, lo cual es válido como
# prueba de que el servicio está activo (≠ problema de auth).
# NOTA: Alpine usa busybox wget (no soporta -S). Un error HTTP ("server
#       returned error") confirma que el servidor sí está escuchando.

check_influx() {
  # En InfluxDB 3 (Catalyst), el endpoint /api/v2/ping es el más fiable para healthchecks.
  # Usamos el token para evitar logs de "MissingToken" en el servidor.
  RESULT=$(wget --no-check-certificate --timeout=5 --header "Authorization: Token $INFLUX_TOKEN" -O /dev/null "$INFLUX_URL/api/v2/ping" 2>&1)
  WGET_STATUS=$?

  # Éxito (0) o cualquier respuesta del servidor (incluso errores HTTP) confirman que está vivo.
  # El código 8 en GNU wget es "Server error", en BusyBox suele ser 1.
  if [ $WGET_STATUS -eq 0 ] || echo "$RESULT" | grep -q "server returned error"; then
    return 0
  fi
  return 1
}

until check_influx; do
  >&2 echo " "
  >&2 echo "🕒 InfluxDB aun no responde en $INFLUX_URL"
  sleep 5
done

echo " "
echo "✅ $INFLUX_URL está listo."
echo " "

echo "🚀 Iniciando servicio de adquisición de datos MQTT"
echo " "

# Ejecuta el comando del Dockerfile CMD ["node", "dist/bundle.mjs"]
exec "$@"
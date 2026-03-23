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

# InfluxDB 3 no expone /ping ni /health. Se verifica que responda HTTP.
# Con autenticación habilitada responde 401/404, lo cual es válido como
# prueba de que el servicio está activo (≠ problema de auth).
# NOTA: Alpine usa busybox wget (no soporta -S). Un error HTTP ("server
#       returned error") confirma que el servidor sí está escuchando.

check_influx() {
  # Ejecutamos wget y capturamos TODA la salida (stdout y stderr) en la variable RESULT
  RESULT=$(wget --no-check-certificate --timeout=5 -O /dev/null "$INFLUX_URL" 2>&1)
  
  # Guardamos el código de salida exacto de wget ANTES de que cualquier otro comando lo sobreescriba
  WGET_STATUS=$?

  # Si wget fue exitoso (0) OR el servidor devolvió un error HTTP (está vivo), retornamos éxito (0)
  if [ $WGET_STATUS -eq 0 ] || echo "$RESULT" | grep -q "server returned error"; then
    return 0
  else
    return 1 # Falló por timeout, connection refused, etc.
  fi
}

until check_influx; do
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
# WIFI
WIFI_SSID = "TU_NOMBRE_DE_WIFI"
WIFI_PASS = "TU_CONTRASEÑA_DE_WIFI"

# ---- CONFIGURACIÓN MQTT (Seleccionar UNA opción) ----

# OPCIÓN 1: Producción VPS (Remoto)
# Con SSL, Puerto 8883
MQTT_SERVER = "tudominio.com"
MQTT_USER   = "usuario-iot-device"
MQTT_PASS   = "contraseña_segura"
MQTT_PORT   = 8883
MQTT_SSL    = True
# El driver de SSL obliga a que este parámetro sea un diccionario
# "cert_reqs": 0: Permite conectar sin validar toda la cadena de CA en el ESP32
# "do_handshake": True: Fuerza la negociación TLS/SSL de inmediato al abrir el socket
MQTT_SSL_PARAMS = {
    "server_hostname": "tudominio.com",
    "cert_reqs": 0,
    "do_handshake": True
}

# OPCIÓN 2: HiveMQ Cloud (Remoto)
# Con SSL, Puerto 8883
# MQTT_SERVER = "tu-cluster.hivemq.cloud"
# MQTT_USER   = "usuario-hivemq"
# MQTT_PASS   = "contraseña_hivemq"
# MQTT_PORT   = 8883
# MQTT_SSL    = True
# MQTT_SSL_PARAMS = {
#     "server_hostname": "tu-cluster.hivemq.cloud", 
#     "cert_reqs": 0,
#     "do_handshake": True
# }

# OPCIÓN 3: Docker Mosquitto (Local)
# Sin SSL, Puerto 1883
# MQTT_SERVER = "192.168.X.X"
# MQTT_USER   = "usuario-local"
# MQTT_PASS   = "contraseña_local"
# MQTT_PORT   = 1883
# MQTT_SSL    = False
# MQTT_SSL_PARAMS = {}
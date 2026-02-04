WIFI_CONFIG = {
    "SSID": "wifi name",
    "PASS": "wifi password"
}

# ---- CONFIGURACIÓN MQTT (Seleccionar UNA opción) ----

# OPCIÓN 1: Docker Mosquitto (Local)
# Sin SSL, Puerto 1883
MQTT_CONFIG = {
    "SERVER": "192.168.1.5",
    "USER": "pristinoplant-iot-device",
    "PASS": "password_local", 
    "PORT": 1883,
    "SSL": False,
    "SSL_PARAMS": {} 
}

# OPCIÓN 2: HiveMQ Cloud (Remoto)
# Con SSL, Puerto 8883
# MQTT_CONFIG = {
#     "SERVER": "cluster.url.hivemq.cloud",
#     "USER": "usuario_hivemq",
#     "PASS": "password_hivemq",
#     "PORT": 8883,
#     "SSL": True,
#     "SSL_PARAMS": {"server_hostname": "cluster.url.hivemq.cloud"}
# }
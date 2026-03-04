WIFI_CONFIG = {
    "SSID": "TU_NOMBRE_DE_WIFI",
    "PASS": "TU_CONTRASEÑA_DE_WIFI"
}

# ---- CONFIGURACIÓN MQTT (Seleccionar UNA opción) ----

# OPCIÓN 1: Producción VPS (Remoto)
# Con SSL, Puerto 8883
# "cert_reqs": 0: Permite conectar sin validar toda la cadena de CA en el ESP32
# "do_handshake": True: Fuerza la negociación TLS/SSL de inmediato al abrir el socket
MQTT_CONFIG = {
    "SERVER": "tudominio.com",
    "USER": "usuario-iot-device",
    "PASS": "contraseña_segura",
    "PORT": 8883,
    "SSL": True,
    "SSL_PARAMS": {
        "server_hostname": "tudominio.com",
        "cert_reqs": 0,
        "do_handshake": True
    }
}

# OPCIÓN 2: HiveMQ Cloud (Remoto)
# Con SSL, Puerto 8883
""" 
MQTT_CONFIG = {
    "SERVER": "tu-cluster.hivemq.cloud",
    "USER": "usuario-hivemq",
    "PASS": "contraseña_hivemq",
    "PORT": 8883,
    "SSL": True,
    "SSL_PARAMS": {
        "server_hostname": "tu-cluster.hivemq.cloud", 
        "cert_reqs": 0,
        "do_handshake": True
    }
} 
"""

# OPCIÓN 3: Docker Mosquitto (Local)
# Sin SSL, Puerto 1883
""" 
MQTT_CONFIG = {
    "SERVER": "192.168.X.X",
    "USER": "usuario-local",
    "PASS": "contraseña_local", 
    "PORT": 1883,
    "SSL": False,
    "SSL_PARAMS": {}
}
"""
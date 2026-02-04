# -----------------------------------------------------------------------------
# Script de Actualización de Credenciales via OTA
# ⚠️ Instrucciones ⚠️
# 1. Renombra este archivo como 'update_creds.py'.
# 2. Edita las variables de WiFi (NEW_SSID/PASS) y MQTT (NEW_MQTT_...).
# 3. Sube el archivo al repositorio (GitHub).
# 4. Reinicia el ESP32 (boot.py descargará y ejecutará este script).
# 5. IMPORTANTE: Borra este archivo del repositorio inmediatamente después.
# -----------------------------------------------------------------------------
import os

# ---- Debug mode ----
DEBUG = True

# ---- Nuevas Credenciales WiFi ----
NEW_SSID = "NOMBRE_DE_LA_RED"
NEW_PASS = "CONTRASEÑA_WIFI"

# ---- Nuevas Credenciales MQTT ----
NEW_MQTT_SERVER = "192.168.1.5"
NEW_MQTT_USER   = "pristinoplant-iot-device"
NEW_MQTT_PASS   = "TU_PASSWORD"
NEW_MQTT_PORT   = 1883
NEW_MQTT_SSL    = False # True para HiveMQ Cloud
# Parametros SSL (Solo si SSL=True)
# Ej: '{"server_hostname": "..."}'
NEW_MQTT_SSL_PARAMS = {} 

# ---- Ruta de Destino ----
TARGET_PATH = "lib/secrets/__init__.py"

# ---- Colors for logs ----
class Colors:
    RESET = '\x1b[0m'
    RED = '\x1b[91m'
    GREEN = '\x1b[92m'
    YELLOW = '\x1b[93m'
    BLUE = '\x1b[94m'
    MAGENTA = '\x1b[95m'
    WHITE = '\x1b[97m'

# ---- Función Auxiliar: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

# ---- Función Principal: apply_update ----
def apply_update():
    """
    Esta función es llamada por boot.py.
    Sobrescribe lib/secrets/__init__.py con la nueva configuración.
    """
    log(f"\n🔑  {Colors.GREEN}Actualizando Credenciales WiFi y MQTT{Colors.RESET}")
    log(f"    ├─ Objetivo:  {Colors.BLUE}{TARGET_PATH}{Colors.RESET}")
    log(f"    ├─ Nueva Red: {Colors.BLUE}{NEW_SSID}{Colors.RESET}")
    log(f"    ├─ Broker:    {Colors.BLUE}{NEW_MQTT_SERVER}:{NEW_MQTT_PORT}{Colors.RESET}")

    # Contenido del Archivo __init__.py actualizado
    new_secrets_content = f"""# Credenciales actualizadas via OTA (update_creds.py)
# NO SUBIR ESTE ARCHIVO A GITHUB

WIFI_CONFIG = {{
    "SSID": "{NEW_SSID}",
    "PASS": "{NEW_PASS}"
}}

# ---- CONFIGURACIÓN MQTT ----
MQTT_CONFIG = {{
    "SERVER": "{NEW_MQTT_SERVER}",
    "USER": "{NEW_MQTT_USER}",
    "PASS": "{NEW_MQTT_PASS}",
    "PORT": {NEW_MQTT_PORT},
    "SSL": {NEW_MQTT_SSL},
    "SSL_PARAMS": {NEW_MQTT_SSL_PARAMS}
}}
"""

    # Sobreescribimos el archivo local
    try:
        # Verificamos que el directorio exista
        try:
            os.stat("lib/secrets")
        except OSError:
            log(f"    ├─ {Colors.YELLOW}Creando directorio lib/secrets{Colors.RESET}")
            try:
                os.mkdir("lib/secrets") 
            except: pass 

        # Escribimos el archivo
        with open(TARGET_PATH, 'w') as f:
            f.write(new_secrets_content)
        
        log(f"    └─ Estado:    {Colors.GREEN}Escritura Exitosa{Colors.RESET}")
        log(f"\n✅  {Colors.GREEN}Credenciales aplicadas{Colors.RESET}")

        return True

    except Exception as e:
        log(f"\n❌  {Colors.RED}Error Crítico escribiendo secretos: {e}{Colors.RESET}")
        return False
from gc import collect, mem_free
from machine import reset #type: ignore
from network import STA_IF, WLAN #type: ignore
from os import remove
from utime import sleep #type: ignore

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

# ---- Configuración OTA ----
OTA_CONFIG = {
    "URL": "https://raw.githubusercontent.com/JulioFlors/orchidium-project/main/firmware/relay_modules/"
}

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

# ---- Actualización de Credenciales ----
try:
    import update_creds #type: ignore
    update_creds.apply_update()
    # Borramos el archivo del ESP32
    remove('update_creds.py')
    log(f"📡  Credenciales {Colors.GREEN}Actualizadas{Colors.RESET}")
    sleep(1)
    reset()
except ImportError:
    pass

# ---- Importar configuración WiFi de forma segura ---- #
try:
    from secrets import WIFI_CONFIG
except ImportError:
    log(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_CONFIG = {"SSID": "", "PASS": ""}

# ---- Función Auxiliar: Conexión WiFi Síncrona ----
def connect_wifi_sync():
    """**Conexión wifi síncrona** `Boot.py` `OTA` `Mantenimiento` `timeout = 60`
    """

    wlan = WLAN(STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        log(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_CONFIG['SSID']}{Colors.RESET}", end="")
        wlan.connect(WIFI_CONFIG['SSID'], WIFI_CONFIG['PASS'])

        timeout = 60
        while not wlan.isconnected() and timeout > 0:
            log(f"{Colors.BLUE}.{Colors.RESET}", end="")
            sleep(1)
            timeout -= 1
            
    if wlan.isconnected():
        log(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")
        return True
    
    log(f"\n❌  No se pudo establecer la conexión WiFi: {Colors.RED}{e}{Colors.RESET}")
    return False

# ---- Comprobar/Actualizar firmware via OTA ----
if connect_wifi_sync():
    try:
        # Importamos dentro para que al salir de la función se libere RAM
        from ota import OTAUpdater #type: ignore

        collect()
        # Ejecutar OTA
        ota = OTAUpdater(OTA_CONFIG['URL'], debug=DEBUG)
        ota.check_for_updates()
        
        # Limpieza profunda
        del ota, OTAUpdater
        collect()
        
    except Exception as e:
        log(f"🔥 Error en proceso OTA: {Colors.RED}{e}{Colors.RESET}")

# Al terminar boot.py, MicroPython ejecuta automáticamente main.py
# El WiFi queda conectado.
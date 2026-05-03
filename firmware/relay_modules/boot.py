from gc import collect
from machine import reset #type: ignore
from micropython import const
from network import STA_IF, WLAN #type: ignore
from os import remove
from utime import sleep #type: ignore

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = False

# ---- Configuración OTA (Optimizado sin diccionario) ----
OTA_URL = const("https://raw.githubusercontent.com/JulioFlors/orchidium-project/main/firmware/build/relay_modules/")

# ---- Colors for logs ----
# Solo se crea si estamos en modo desarrollo
if DEBUG:
    class Colors:
        RESET   = '\x1b[0m'
        RED     = '\x1b[91m'
        GREEN   = '\x1b[92m'
        YELLOW  = '\x1b[93m'
        BLUE    = '\x1b[94m'
        MAGENTA = '\x1b[95m'
        CYAN    = '\x1b[96m'
        WHITE   = '\x1b[97m'

# ---- Actualización de Credenciales ----
try:
    import update_creds #type: ignore
    update_creds.apply_update()
    # Borramos el archivo del ESP32
    remove('update_creds.py')
    if DEBUG:
        print(f"📡  Credenciales {Colors.GREEN}Actualizadas{Colors.RESET}")
    sleep(1)
    reset()
except ImportError:
    pass

# ---- Importar configuración WiFi de forma segura ---- #
try:
    from secrets import WIFI_SSID, WIFI_PASS
except ImportError:
    if DEBUG:
        print(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_SSID, WIFI_PASS = "", ""

# ---- Función Auxiliar: Conexión WiFi Síncrona ----
def connect_wifi_sync():
    """**Conexión wifi síncrona** `Boot.py` `OTA` `Mantenimiento` `timeout = 60`"""
    wlan = WLAN(STA_IF)
    wlan.active(False)
    wlan.active(True)
    
    if not wlan.isconnected():
        if DEBUG: print(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_SSID}{Colors.RESET}", end="")
        wlan.connect(WIFI_SSID, WIFI_PASS)

        timeout = 60
        while not wlan.isconnected() and timeout > 0:
            if DEBUG: print(f"{Colors.BLUE}.{Colors.RESET}", end="")
            sleep(1)
            timeout -= 1
            
    if wlan.isconnected():
        if DEBUG: print(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

        # Inyección de DNS
        try:
            cloudflare_dns = "1.1.1.1"
            ip, subnet, gateway, dns = wlan.ifconfig()
            wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
            if DEBUG:
                print(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
        except Exception as e:
            if DEBUG: print(f"⚠️  Error forzando DNS en Boot: {e}")

        return True
    
    if DEBUG: print(f"\n❌  No se pudo establecer la conexión WiFi {Colors.RED}(Timeout){Colors.RESET}.")
    return False

# ---- Bucle de Persistencia de Red con Límite de Seguridad ----
# El dispositivo intentará conectar pacientemente. Si tras 10 intentos (aprox 10 min) 
# no hay éxito, reiniciará físicamente para limpiar la tabla de memoria (heap).
fail_count = 0
MAX_BOOT_FAILURES = const(10)

while True:
    if connect_wifi_sync():
        try:
            from ota import OTAUpdater #type: ignore
            collect()
            
            # ---- Comprobar/Actualizar Firmrware via OTA ----
            # Ejecutar OTA (Usando la constante directa OTA_URL)
            ota = OTAUpdater(OTA_URL, debug=DEBUG)
            
            # Si falla la verificación por (DNS/Red), Aumentamos el contador de errores.
            if ota.check_for_updates():
                break  # OTA OK → salir del bucle y continuar a main.py
            else:
                fail_count += 1
                if DEBUG: print(f"\n⚠️  {Colors.YELLOW}Fallo de Red en proceso OTA.{Colors.RESET} ({fail_count}/{MAX_BOOT_FAILURES})")
                sleep(10)

        except Exception as e:
            fail_count += 1
            if DEBUG: print(f"\n🔥  Error en proceso OTA: {Colors.RED}{e}{Colors.RESET} ({fail_count}/{MAX_BOOT_FAILURES})")
            sleep(10)
    else:
        # Falló el WiFi
        fail_count += 1
        if DEBUG: print(f"    └─ Reintento en 10 segundos. ({fail_count}/{MAX_BOOT_FAILURES})")
        sleep(10)
    
    # [ÚLTIMO RECURSO]: Si la RAM está muy fragmentada o el driver de red colapsó
    if fail_count >= MAX_BOOT_FAILURES:
        if DEBUG:
            print(f"\n💀  {Colors.RED}Límite de fallos alcanzado.{Colors.RESET}")
            print(f"🔄  {Colors.BLUE}Reiniciando Hardware para limpiar RAM...{Colors.RESET}\n")
        sleep(2)
        reset()

# (Limpieza Final de RAM antes de main.py)
import sys
modules_to_free = ['machine', 'ntptime', 'ota']
for mod in modules_to_free:
    if mod in sys.modules:
        del sys.modules[mod]

# Destruir Variables Globales Innecesarias
for var in ['ota', 'WIFI_SSID', 'WIFI_PASS', 'OTA_URL', 'connect_wifi_sync', 'update_creds']:
    if var in globals():
        del globals()[var]

collect()

# Al terminar boot.py, MicroPython ejecuta automáticamente main.py
# El WiFi queda conectado.
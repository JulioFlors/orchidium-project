from machine import reset #type: ignore
from micropython import const
from network import STA_IF, WLAN #type: ignore
from ntptime import settime
from utime   import sleep #type: ignore

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

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
    """**Conexión wifi síncrona** `Boot.py` `OTA` (opcional) `Mantenimiento` `timeout = 60`"""
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

        # ---- Inyección de DNS ----
        try:
            cloudflare_dns = "1.1.1.1"
            ip, subnet, gateway, dns = wlan.ifconfig()
            wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
            if DEBUG:
                print(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
        except Exception as e:
            if DEBUG: print(f"⚠️  Error forzando DNS en Boot: {e}")


        # ---- Sincronización de Tiempo NTP ----
        if DEBUG: print(f"\n🕒  Sincronizando ", end="")

        for _ in range(5):
            try:
                settime()
                if DEBUG: print(f"\n🕒  Hora del sistema {Colors.GREEN}Sincronizada{Colors.RESET}")
                break
            except:
                if DEBUG: print(f"{Colors.BLUE}.{Colors.RESET}", end="")
                sleep(1)
        else:
            if DEBUG: print(f"\n⚠️  Hora del sistema {Colors.YELLOW}Desincronizada{Colors.RESET}")

        return True

    if DEBUG: print(f"\n❌  No se pudo establecer la conexión WiFi {Colors.RED}(Timeout){Colors.RESET}.")
    return False

# ---- Bucle de Persistencia de Red con Límite de Seguridad ----
# El dispositivo intentará conectar pacientemente. Si tras 3 intentos (aprox 3 min) 
# no hay éxito, reiniciará físicamente para limpiar la tabla de memoria (heap).
fail_count = 0
MAX_BOOT_FAILURES = const(3)

while True:
    if connect_wifi_sync():
        break # Salto directo a main.py
    else:
        # Falló el WiFi
        fail_count += 1
        if DEBUG: print(f"    └─ Reintento en 60 segundos. ({fail_count}/{MAX_BOOT_FAILURES})")
        sleep(60)
    
    # [ÚLTIMO RECURSO]: Si la RAM está muy fragmentada o el driver de red colapsó
    if fail_count >= MAX_BOOT_FAILURES:
        if DEBUG:
            print(f"\n💀  {Colors.RED}Límite de fallos alcanzado.{Colors.RESET}")
            print(f"🔄  {Colors.BLUE}Reiniciando Hardware para limpiar RAM...{Colors.RESET}\n")
        sleep(2)
        reset()

# (Limpieza Final de RAM antes de main.py)
import sys
import gc

# Limpiamos módulos del cache (forzamos re-importación limpia en main.py)
for mod in ['machine', 'network', 'utime', 'ntptime']:
    if mod in sys.modules:
        del sys.modules[mod]

# Destruimos Variables Globales del Boot (Mantenemos const y sys para main.py)
for var in [
    'WIFI_SSID', 'WIFI_PASS', 'connect_wifi_sync', 'Colors', 'DEBUG', 
    'fail_count', 'MAX_BOOT_FAILURES', 'reset', 'STA_IF', 
    'WLAN', 'sleep'
]:
    if var in globals():
        del globals()[var]

gc.collect()

# Al terminar boot.py, MicroPython ejecuta automáticamente main.py
# El WiFi queda conectado.
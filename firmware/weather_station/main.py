# -----------------------------------------------------------------------------
# Weather Station: Environmental Monitoring Firmware.
# Descripción: Nodo de Monitoreo Ambiental del Orquideario (ZONA_A).
# Fecha: 23-05-2026
# Version: v0.9.0
# notes_release: Robustecimiento del nodo EMA de la Zona A. Conectividad resiliente, ahorro de batería con apagado de radio y medidas de seguridad avanzadas.
# ------------------------------- Configuración -------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib. 
# Esto es necesario para que al importar la librería umqtt.simple2 se sobreescriba 
# la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

import uasyncio as asyncio
from micropython import const

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

# ---- Configuración MQTT (const() para ahorro de RAM) ----
# El broker esperará ~1.5x este valor antes de desconectar al cliente.
MQTT_KEEPALIVE       = const(60) # ~1.5x = 90 seg
# Intervalo para enviar pings de 'keepalive' al broker MQTT.
MQTT_PING_INTERVAL   = const(29) # ~keepalive/2
# Intervalo para revisar mensajes MQTT entrantes.
MQTT_CHECK_INTERVAL  = const(1)  # seg
# Timeout para operaciones de socket
MQTT_SOCKET_TIMEOUT  = const(45) # seg
# Tiempo máximo de espera para QoS 1
MQTT_MESSAGE_TIMEOUT = const(90) # seg

# ---- Configuración Resiliencia / Watchdog ----
# Tiempo máximo sin conexión MQTT/WiFi antes de forzar un Hard Reset (10 minutos)
MAX_OFFLINE_RESET_SEC = const(600)
# Tiempo del Watchdog Timer (Hardware) en milisegundos (125 segundos)
WDT_TIMEOUT_MS = const(125000)
# Tamaño máximo de la cola de mensajes MQTT para evitar OOM
MAX_BUFFER_SIZE = const(15)
# Tamaño de lote de telemetría (10 muestras = 10 minutos)
BATCH_SIZE = const(10)

# ---- Tópicos MQTT Pre-calculados (Optimización de RAM) ----
MQTT_TOPIC_STATUS           = const(b"PristinoPlant/Weather_Station/ZONA_A/status")
MQTT_TOPIC_AUDIT            = const(b"PristinoPlant/Weather_Station/ZONA_A/audit")
MQTT_TOPIC_AUDIT_STATE      = const(b"PristinoPlant/Weather_Station/ZONA_A/audit/state")
MQTT_TOPIC_EXTERIOR_METRICS = const(b"PristinoPlant/Weather_Station/ZONA_A/readings")
MQTT_TOPIC_CMD              = const(b"PristinoPlant/Weather_Station/ZONA_A/cmd")
MQTT_TOPIC_CMD_RECEIVED     = const(b"PristinoPlant/Weather_Station/ZONA_A/cmd/received")

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = const(b"lwt_disconnect")

# ---- Colors for logs ----
if DEBUG:
    class Colors:
        RESET   = '\x1b[0m'
        DIM     = '\x1b[90m'
        RED     = '\x1b[91m'
        GREEN   = '\x1b[92m'
        YELLOW  = '\x1b[93m'
        BLUE    = '\x1b[94m'
        MAGENTA = '\x1b[95m'
        CYAN    = '\x1b[96m'
        WHITE   = '\x1b[97m'

# ---- Utilidades de Telemetría (RingBuffer) ----
class RingBuffer:
    def __init__(self, size):
        self.size = size
        self.buffer = [None] * size
        self.index = 0

    def clear(self):
        self.buffer = []
        self.index = 0

    def ensure_init(self):
        if not self.buffer:
            self.buffer = [None] * self.size
            self.index = 0

    def append(self, item):
        self.ensure_init()
        from utime import time
        self.buffer[self.index] = (time(), item)
        self.index = (self.index + 1) % self.size

    def get_all(self):
        if not self.buffer: return []
        res = []
        for i in range(self.size):
            idx = (self.index + i) % self.size
            if self.buffer[idx] is not None:
                res.append(self.buffer[idx])
        return res

    @property
    def count(self):
        if not self.buffer: return 0
        n = 0
        for item in self.buffer:
            if item is not None:
                n += 1
        return n

# Buffers de Telemetría
illuminance_Batch = RingBuffer(BATCH_SIZE)
temperature_Batch = RingBuffer(BATCH_SIZE)
humidity_Batch    = RingBuffer(BATCH_SIZE)

# ---- Hardware Global ----
dht_sensor = None
illuminance_sensor = None
i2c_bus = None

# ---- Variables Globales de Estado ----
wlan    = None # Conexión WiFi
client  = None # Cliente MQTT
CONNECTED_ALLOWED = False # Control de ahorro de energía (True = Radio encendida)
IS_SAMPLING_LUX = True   # Control de muestreo BH1750 (Día/Noche)

# Candado asíncrono para evitar colisiones en el socket MQTT
mqtt_lock = asyncio.Lock()

# Buffer de mensajes MQTT para el patrón Productor-Consumidor
mqtt_message_buffer = []

# Eventos de control asíncronos
mqtt_msg_event = asyncio.Event()
mqtt_connected_event = asyncio.Event()
audit_master_event = asyncio.Event()

# Diccionario de Sincronización para Auditorías
audit_events = {
    "lux":  asyncio.Event(),
    "wifi": asyncio.Event(),
    "ram":  asyncio.Event(),
    "temp": asyncio.Event(),
    "hum":  asyncio.Event()
}

AUDIT_MODE = {
    "lux":  False,
    "wifi": False,
    "ram":  False,
    "temp": False,
    "hum":  False
}

AUDIT_COUNTERS = {
    "lux":  0,
    "wifi": 0,
    "ram":  0,
    "temp": 0,
    "hum":  0
}

# ---- Funciones de Muestreo de Auditoría ----
def get_lux_sample():
    if illuminance_sensor is not None:
        try: return round(illuminance_sensor.get_auto_luminance(), 1)
        except: return None
    return None

def get_wifi_sample():
    from network import WLAN, STA_IF
    w = WLAN(STA_IF)
    if w.isconnected():
        return (w.status('rssi'), w.ifconfig()[0])
    return None

def get_ram_sample():
    from gc import collect, mem_alloc, mem_free
    collect()
    return (mem_free(), mem_alloc())

def get_dht_sample():
    if dht_sensor is None: return None
    try:
        clean_dht_line()
        from utime import sleep_ms
        sleep_ms(1500)
        dht_sensor.measure()
        return (round(dht_sensor.temperature(), 1), round(dht_sensor.humidity(), 1))
    except:
        return None

AUDIT_SAMPLE_FNS = {
    "lux":  get_lux_sample,
    "wifi": get_wifi_sample,
    "ram":  get_ram_sample,
    "temp": get_dht_sample,
    "hum":  get_dht_sample
}

# ---- Función Auxiliar: Uso del disco ----
def log_disk_usage():
    if not DEBUG: return
    try:
        import os
        fs_stat = os.statvfs('/')
        block_size = fs_stat[0]
        total_blocks = fs_stat[2]
        free_blocks = fs_stat[3]
        total_kb = (total_blocks * block_size) // 1024
        free_kb = (free_blocks * block_size) // 1024
        used_kb = total_kb - free_kb
        p = (used_kb / total_kb) * 100
        print(f"\n💾  Flash Usage: {used_kb}KB / {total_kb}KB ({p:.1f}%) | Free: {free_kb}KB")
    except Exception as e:
        print(f"⚠️  Disk Stat Error: {e}")

# ---- Función Auxiliar: Uso de la memoria RAM ----
def log_ram_usage():
    if not DEBUG: return
    try:
        from gc import mem_free, mem_alloc
        free = mem_free()
        alloc = mem_alloc()
        total = free + alloc
        used = total - free
        p = (used / total) * 100
        print(f"🧠  RAM Usage: {used/1024:.1f}KB / {total/1024:.1f}KB ({p:.1f}%) | Free: {free/1024:.1f}KB")
    except Exception as e:
        print(f"⚠️  RAM Stat Error: {e}")

# ---- Importar configuración desde lib/secrets de forma segura ---- #
try:
    from secrets import WIFI_SSID, WIFI_PASS, MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS
except ImportError:
    if DEBUG:
        print(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    WIFI_SSID, WIFI_PASS = "", ""
    MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS = "", "", "", 1883, False, {}

# ---- Excepciones Personalizadas ----
class MQTTSessionZombie(OSError):
    """Excepción para identificar sesiones MQTT que han dejado de responder."""
    pass

# ---- Función Auxiliar: Interpretación de Errores MQTT (Optimización RAM: if/elif) ----
def log_mqtt_exception(context, e):
    if not DEBUG: return

    if type(e).__name__ == 'MQTTException':
        code = e.args[0] if e.args else -1
        
        if code == 1:   msg = "Conn Reset (El router o servidor cortó la conexión de golpe)"
        elif code == 2: msg = "Error de Lectura (Datos incompletos por caída de red)"
        elif code == 3: msg = "Corte de Red (No se pudo terminar de enviar la información al servidor)"
        elif code == 4: msg = "Mensaje muy largo (Supera el límite de memoria permitido)"
        elif code == 5: msg = "PID Mismatch (Desincronización de mensajes con el servidor)"
        elif code == 20: msg = "Rechazado (El servidor MQTT denegó la conexión)"
        elif code == 21: msg = "Versión MQTT Incompatible"
        elif code == 22: msg = "ID de Cliente Rechazado"
        elif code == 23: msg = "Servidor MQTT No Disponible (Apagado o reiniciándose)"
        elif code == 24: msg = "Credenciales MQTT Incorrectas (Revisa el Usuario/Contraseña)"
        elif code == 25: msg = "No Autorizado (El usuario no tiene permisos en el servidor MQTT)"
        elif code == 28: msg = "Sin Conexión (El ESP32 no detecta acceso a la red)"
        elif code == 29: msg = "Respuesta Inválida (El servidor MQTT respondió datos corruptos)"
        elif code == 30: msg = "Timeout (El servidor tardó demasiado en responder)"
        elif code == 40: msg = "Error de Suscripción (Tópico denegado)"
        elif code == 44: msg = "Suscripción Rechazada"
        else: msg = f"Error desconocido ({code})"
        
        print(f"\n❌  {context}: {Colors.RED}[MQTT-{code}] {msg}{Colors.RESET}\n")
    
    elif isinstance(e, OSError):
        err_msg = str(e)
        code = e.args[0] if e.args else 0
        
        if isinstance(e, MQTTSessionZombie):
            prefix = "Zombie"
        else:
            prefix = f"Red-{code}"

        if code == 110:   err_msg = "ETIMEDOUT (Internet demasiado lento o desconectado en silencio)"
        elif code == 113: err_msg = "EHOSTUNREACH (No hay ruta hacia el servidor, posible falla del proveedor de internet)"
        elif code == 104: err_msg = "ECONNRESET (El router o el proveedor de internet cerró la sesión inactiva)"
        elif code == 16:  err_msg = "EBUSY (Chip WiFi ocupado limpiando la conexión anterior)"
        elif code == 12:  err_msg = "ENOMEM (Memoria RAM insuficiente para esta operación)"
        elif code == -202: err_msg = "SSL Failed (Fallo al negociar la conexión segura, la red está muy inestable)"
        elif code == -17040: err_msg = "SSL RAM Error (Falta memoria RAM para procesar el certificado de seguridad)"
        elif code == -29312: err_msg = "SSL EOF (El servidor cerró la conexión antes de terminar la validación de seguridad)"
        
        print(f"\n❌  {context}: {Colors.RED}[{prefix}] {err_msg}{Colors.RESET}\n")
    
    else:
        print(f"\n❌  {context}: {Colors.RED}{type(e).__name__}: {e}{Colors.RESET}\n")

# ---- Función Auxiliar: Limpieza Atómica de Línea DHT22 (Pin 4) ----
def clean_dht_line():
    from machine import Pin
    from utime import sleep_ms
    p = Pin(4, Pin.IN, Pin.PULL_UP)
    p.init(Pin.OUT)
    p.value(1)
    sleep_ms(500)
    p.init(Pin.IN, Pin.PULL_UP)

# ---- Función Auxiliar: Setup del BH1750 (I2C) ----
def setup_bh1750_sync():
    global illuminance_sensor, i2c_bus
    from machine import I2C, Pin, SoftI2C
    from utime import sleep_ms
    try:
        addr = 0x23 
        sensor_connected = False
        BUS_CONFIGS = [
            ("hw",   100000,   0,       "Hardware I2C"),
            ("soft", 50000,    200000,  "SoftI2C Robusto"),
            ("soft", 10000,    500000,  "SoftI2C Lento (10m)"),
        ]
        if DEBUG: print(f"\n☀️  Conectando {Colors.YELLOW}BH1750{Colors.RESET}")
        for i, (bus_type, freq, timeout, label) in enumerate(BUS_CONFIGS):
            if sensor_connected: break
            is_last = (i == len(BUS_CONFIGS) - 1)
            prefix = "    └─" if is_last else "    ├─"
            try:
                if bus_type == "soft":
                    i2c_bus = SoftI2C(scl=Pin(22), sda=Pin(21), freq=freq, timeout=timeout)
                else:
                    i2c_bus = I2C(0, scl=Pin(22), sda=Pin(21), freq=freq)
                sleep_ms(150)
                i2c_bus.writeto(addr, b'')
                try: from bh1750 import BH1750
                except ImportError:
                    if DEBUG: print(f"{prefix} ❌ Error: no se encontró bh1750.py")
                    return
                illuminance_sensor = BH1750(bus=i2c_bus, addr=addr)
                sleep_ms(200)
                lux_test = round(illuminance_sensor.get_auto_luminance(), 1)
                if lux_test is not None:
                    illuminance_Batch.append(lux_test)
                if DEBUG:
                    print(f"    ├─ ✅ {Colors.GREEN}Conectado{Colors.RESET} [{label}]")
                    print(f"    └─ 📊 Valor: {Colors.YELLOW}{lux_test} lux{Colors.RESET}")
                sensor_connected = True
            except OSError:
                if DEBUG: print(f"{prefix} ❌ {Colors.RED}No detectado{Colors.RESET} en [{label}]")
                continue
        if not sensor_connected:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}Desconectado{Colors.RESET}")
            illuminance_sensor = None
            i2c_bus = None
    except Exception as e:
        if DEBUG: print(f"    └─ ❌ Exception: {Colors.RED}[{e}]{Colors.RESET}")
        illuminance_sensor = None

# ---- Función Auxiliar: Inicializar Sensores ----
async def setup_sensors():
    global dht_sensor, illuminance_sensor
    from machine import Pin
    
    dht_boot_ok = False
    try:
        from dht import DHT22
        if DEBUG: print(f"\n🌡️  Inicializando {Colors.YELLOW}DHT22{Colors.RESET}")
 
        dht_sensor = DHT22(Pin(4, Pin.IN, Pin.PULL_UP))

        try:
            clean_dht_line()
            await asyncio.sleep_ms(500)
            dht_sensor.measure()
            temp, hum = dht_sensor.temperature(), dht_sensor.humidity()
            if -10 <= temp <= 60 and 0 <= hum <= 100:
                dht_boot_ok = True
                temperature_Batch.append(round(temp, 1))
                humidity_Batch.append(round(hum, 1))
                if DEBUG:
                    print(f"    ├─ ✅ {Colors.GREEN}Verificado{Colors.RESET}")
                    print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                    print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
            else:
                if DEBUG: print(f"    └─ ⚠️ {Colors.YELLOW}Fuera de rango{Colors.RESET}")
        except Exception:
            if DEBUG: print(f"    └─ ⚠️ {Colors.YELLOW}Sin respuesta en lectura inicial{Colors.RESET}")
    except Exception as e:
        if DEBUG: print(f"    └─ ❌ Fallo inicialización DHT22: {e}")
        dht_sensor = None

    # Rescate lógico si la verificación inicial falló en boot (hasta 3 rescates)
    if not dht_boot_ok:
        for attempt in range(1, 4):
            if DEBUG: print(f"    └─ 🔄 Reintento lógico DHT22 (Intento {attempt}/3).{Colors.RESET}")
            dht_sensor = None
            await asyncio.sleep(5)
            
            try:
                clean_dht_line()
                await asyncio.sleep(1)
                from dht import DHT22
                dht_sensor = DHT22(Pin(4, Pin.IN, Pin.PULL_UP))
                dht_sensor.measure()
                temp, hum = dht_sensor.temperature(), dht_sensor.humidity()
                if -10 <= temp <= 60 and 0 <= hum <= 100:
                    temperature_Batch.append(round(temp, 1))
                    humidity_Batch.append(round(hum, 1))
                    dht_boot_ok = True
                    if DEBUG:
                        print(f"    ├─ ✅ {Colors.GREEN}Recuperado tras reintento (Intento {attempt}){Colors.RESET}")
                        print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                        print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
                    break
                else:
                    if DEBUG: print(f"    └─ ⚠️ {Colors.YELLOW}Fuera de rango en reintento (Intento {attempt}/3){Colors.RESET}")
            except Exception:
                if DEBUG: print(f"    └─ ⚠️ {Colors.YELLOW}Sin respuesta en reintento (Intento {attempt}/3){Colors.RESET}")
        
        if not dht_boot_ok:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}No se pudo recuperar el DHT22.{Colors.RESET}")

    # Inicializar el BH1750
    setup_bh1750_sync()

# ---- Función Auxiliar: Sincronizar Estado de RAM (Audit Mode) ----
async def publish_audit_state():
    try:
        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            lux_on  = "true" if AUDIT_MODE["lux"]  else "false"
            wifi_on = "true" if AUDIT_MODE["wifi"] else "false"
            ram_on  = "true" if AUDIT_MODE["ram"]  else "false"
            temp_on = "true" if AUDIT_MODE["temp"] else "false"
            hum_on  = "true" if AUDIT_MODE["hum"]  else "false"

            hw_lux  = "true" if illuminance_sensor  else "false"
            hw_dht  = "true" if dht_sensor          else "false"

            # Construcción manual de JSON (Zero-Dict)
            payload = '{"lux":%s,"wifi":%s,"ram":%s,"temp":%s,"hum":%s,"lux_hw":%s,"temp_hw":%s,"hum_hw":%s}' % (
                lux_on, wifi_on, ram_on, temp_on, hum_on,
                hw_lux, hw_dht, hw_dht
            )

            from umqtt.simple2 import MQTTException
            try:
                async with mqtt_lock:
                    if client and getattr(client, 'sock', None):
                        client.publish(MQTT_TOPIC_AUDIT_STATE, payload, retain=True, qos=0)
                await asyncio.sleep_ms(500)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo sincronización estado auditoría", e)
                force_disconnect_mqtt()
                await check_critical_mqtt_errors(e)

    except Exception as e:
        if DEBUG: print(f"⚠️  Error preparando payload de auditoría: {e}")

# ---- Callback de estado MQTT ----
def sub_status_callback(pid, status):
    if not DEBUG: return
    from umqtt import errno as umqtt_errno
    if status == umqtt_errno.STIMEOUT:
        print(f"\n⚠️  {Colors.YELLOW}Timeout de entrega{Colors.RESET} (PID: {pid}): El broker no confirmó.")
    elif status == umqtt_errno.SUNKNOWNPID:
        print(f"\n❌  {Colors.RED}PID Desconocido{Colors.RESET} (PID: {pid}): Respuesta inesperada del broker.")

# ---- Callback MQTT (Productor) ----
def sub_callback(topic, msg, retained, dup):
    try:
        topic_str = topic.decode('utf-8')
        if len(mqtt_message_buffer) < MAX_BUFFER_SIZE:
            mqtt_message_buffer.append((topic, msg, retained, dup))
            mqtt_msg_event.set()
        else:
            if DEBUG:
                print(f"⚠️  {Colors.YELLOW}Buffer MQTT lleno{Colors.RESET} (Descartando antiguo)")
    except Exception as e:
        if DEBUG: print(f"⚠️  Error en sub_callback: {e}")

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt(silent=True):
    global client
    from gc import collect

    if client is not None:
        try:
            if wlan and wlan.isconnected():
                client.disconnect()
        except: pass

        try:
            if hasattr(client, 'sock') and client.sock:
                client.sock.close()
        except: pass

        try:
            if hasattr(client, 'sock_raw') and client.sock_raw:
                client.sock_raw.close()
        except: pass

        try:
            client.sock = None
            client.sock_raw = None
        except: pass
        
        client = None
        mqtt_connected_event.clear()
        collect()

        if DEBUG and not silent:
            print(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

# ---- FUNCIÓN AUXILIAR: Gestión de desconexión (Graceful Shutdown) ----
def shutdown():
    """
    **Apagado Controlado (Weather Station)**
    * Publica `offline` explícitamente con QoS 1.
    * Flush de batches de telemetría acumulados de forma síncrona.
    * Desconecta MQTT y WiFi para ahorrar energía.
    """
    from utime import sleep_ms

    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            flush_telemetry_batches()
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error en flush_telemetry_batches en shutdown: {e}")
        sleep_ms(500)

        try:
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error publicando offline en shutdown: {e}")
        sleep_ms(500)

    force_disconnect_mqtt(silent=False)

    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            wlan.active(False)
            if DEBUG: print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

# ---- CORUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    global wlan
    from network import STA_IF, WLAN
    from utime   import time

    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = False
    wifi_disconnect_start = None

    while True:
        if not CONNECTED_ALLOWED:
            if wlan.active():
                try:
                    wlan.disconnect()
                    wlan.active(False)
                    if DEBUG:
                        print(f"📡  Radio WiFi {Colors.YELLOW}Apagada (Ahorro Batería){Colors.RESET}")
                except: pass
            await asyncio.sleep(5)
            continue

        if not wlan.active():
            try:
                wlan.active(True)
                await asyncio.sleep(1)
            except: pass

        if not wlan.isconnected():
            if connected_once:
                if DEBUG:
                    print(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")

            if wifi_disconnect_start is None:
                wifi_disconnect_start = time()

            if (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                if DEBUG:
                    print(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                    print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                await asyncio.sleep(1)
                safe_reset()

            try:
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(2)
                wlan.active(True)

                if DEBUG: print(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_SSID}{Colors.RESET}", end="")
                wlan.connect(WIFI_SSID, WIFI_PASS)

                while not wlan.isconnected():
                    if wifi_disconnect_start and (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                        if DEBUG:
                            print(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                            print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                        await asyncio.sleep(1)
                        safe_reset()

                    if not CONNECTED_ALLOWED:
                        break

                    if DEBUG:
                        print(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)

                if wlan.isconnected():
                    if DEBUG:
                        print(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                    try:
                        cloudflare_dns = "1.1.1.1"
                        ip, subnet, gateway, dns = wlan.ifconfig()
                        wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
                        if DEBUG:
                            print(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
                    except Exception as e:
                        if DEBUG: print(f"⚠️  Error forzando DNS: {e}")

                    wifi_disconnect_start = None
                    force_disconnect_mqtt()
                    connected_once = True

            except Exception as e:
                if DEBUG: print(f"\n❌ No se pudo conectar WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            wifi_disconnect_start = None
            await asyncio.sleep(20)

# ---- Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    from machine import reset
    from utime   import sleep
    if DEBUG:
        print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Timeout en conexión MQTT {Colors.RED}(Socket Bloqueado){Colors.RESET}")
        print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
        sleep(1)
    reset()

# ---- Manejo centralizado de Errores Críticos MQTT ----
async def check_critical_mqtt_errors(e):
    from umqtt.simple2 import MQTTException
    
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -30592, 12]:
        if DEBUG:
            print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Fallo crítico de SSL/Red/RAM ({e.args[0]}).")
            print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n")
        await asyncio.sleep(5)
        safe_reset()

    if isinstance(e, MQTTException) and e.args and e.args[0] == 3:
         if DEBUG:
             print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Buffer de escritura lleno (Fragmentación RAM).")
             print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo...{Colors.RESET}\n")
         await asyncio.sleep(5)
         safe_reset()

# ---- CORUTINA: Gestión de Conexión MQTT ----
async def mqtt_connector_task(client_id):
    global client

    from gc      import collect
    from machine import Timer
    from umqtt.simple2 import MQTTClient, MQTTException
    from utime   import ticks_diff, ticks_ms, time

    wd_timeout_ms = (MQTT_SOCKET_TIMEOUT + 5) * 1000
    mqtt_disconnect_start = None
    last_manual_ping = ticks_ms()

    while True:
        if not CONNECTED_ALLOWED:
            await asyncio.sleep(5)
            continue

        if wlan is None or not wlan.isconnected():
            await asyncio.sleep(5)
            continue

        if client is None:
            if mqtt_disconnect_start is None:
                mqtt_disconnect_start = time()
            
            if (time() - mqtt_disconnect_start > MAX_OFFLINE_RESET_SEC):
                if DEBUG:
                    print(f"\n💀  {Colors.RED}DEATH: El MQTT no conectó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}")
                await asyncio.sleep(1)
                safe_reset()

            try:
                collect()
                client = MQTTClient(
                    client_id=client_id,
                    server=MQTT_SERVER,
                    port=MQTT_PORT,
                    user=MQTT_USER, password=MQTT_PASS,
                    keepalive=MQTT_KEEPALIVE,
                    ssl=MQTT_SSL,
                    ssl_params=MQTT_SSL_PARAMS,
                    socket_timeout=MQTT_SOCKET_TIMEOUT,
                    message_timeout=MQTT_MESSAGE_TIMEOUT
                )

                client.set_last_will(LWT_TOPIC, LWT_MESSAGE, retain=True, qos=1)
                client.set_callback(sub_callback)
                client.set_callback_status(sub_status_callback)

                wd_timer = Timer(0)
                wd_timer.init(period=wd_timeout_ms, mode=Timer.ONE_SHOT, callback=_connection_timeout_handler)

                collect()
                if DEBUG:
                    log_disk_usage()
                    log_ram_usage()
                    print(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

                try:
                    # clean_session=False para recibir comandos pendientes cuando nos conectemos
                    client.connect(clean_session=False)
                finally:
                    wd_timer.deinit()

                mqtt_disconnect_start = None
                if DEBUG: print(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}")
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)
                client.subscribe(MQTT_TOPIC_CMD, qos=1)
                
                mqtt_connected_event.set()

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo la Conexión MQTT", e)
                await check_critical_mqtt_errors(e)
                force_disconnect_mqtt()
                await asyncio.sleep(10)
                continue

        # Gestión de la conexión activa
        if client:
            try:
                async with mqtt_lock:
                    client.check_msg()

                now_ms = ticks_ms()

                # Ping manual (importante para NAT y mantener canal abierto)
                if ticks_diff(now_ms, last_manual_ping) > (MQTT_PING_INTERVAL * 1000):
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            client.ping()
                    if DEBUG: print(f"📡  MQTT: {Colors.CYAN}Ping de vida enviado{Colors.RESET}")
                    last_manual_ping = now_ms

                # Control de sesión Zombie (1.5x keepalive)
                elif ticks_diff(now_ms, client.last_cpacket) > (MQTT_KEEPALIVE * 1500):
                    raise MQTTSessionZombie("Inactividad del broker MQTT excedida")

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Error en Operación MQTT", e)
                await check_critical_mqtt_errors(e)
                force_disconnect_mqtt()
                last_manual_ping = ticks_ms()
                await asyncio.sleep(10)
                continue

        await asyncio.sleep(MQTT_CHECK_INTERVAL)

# ---- Funciones Auxiliares: Vaciar y Publicar Telemetría (Aislamiento + 500ms) ----
def publish_single_batch(metric_name, ring_buffer, prefix="├─"):
    if ring_buffer.count > 0:
        items = ring_buffer.get_all()
        # [Optimización RAM - Zero-Dict Manual JSON]: Expresión generadora
        data_str = ",".join('[%d,{"%s":%s}]' % (it[0], metric_name, str(it[1])) for it in items)
        payload_batch = '{"data":[%s]}' % data_str
        client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch, qos=0)
        
        if DEBUG:
            emoji = "☀️" if metric_name == "illuminance" else "🌡️" if metric_name == "temperature" else "💧"
            label = "Lux" if metric_name == "illuminance" else "Temp" if metric_name == "temperature" else "Hum"
            print(f"    {prefix} {emoji}  Flush {label}: {len(items)} muestras")
            
        ring_buffer.clear()
        return True
    return False

async def flush_telemetry_batches_async():
    try:
        if not (client and getattr(client, 'sock', None) and wlan and wlan.isconnected()):
            return

        has_lux  = illuminance_Batch.count > 0
        has_temp = temperature_Batch.count > 0
        has_hum  = humidity_Batch.count > 0

        async with mqtt_lock:
            if client and getattr(client, 'sock', None):
                # Vaciado con Aislamiento Total y pausas de 500ms
                if has_lux:
                    try:
                        prefix = "└─" if not (has_temp or has_hum) else "├─"
                        if publish_single_batch("illuminance", illuminance_Batch, prefix):
                            await asyncio.sleep_ms(500)
                    except Exception as e:
                        if DEBUG: print(f"⚠️ Fallo en flush_async de Illuminance: {e}")

                if has_temp:
                    try:
                        prefix = "└─" if not has_hum else "├─"
                        if publish_single_batch("temperature", temperature_Batch, prefix):
                            await asyncio.sleep_ms(500)
                    except Exception as e:
                        if DEBUG: print(f"⚠️ Fallo en flush_async de Temperature: {e}")

                if has_hum:
                    try:
                        if publish_single_batch("humidity", humidity_Batch, "└─"):
                            await asyncio.sleep_ms(500)
                    except Exception as e:
                        if DEBUG: print(f"⚠️ Fallo en flush_async de Humidity: {e}")

    except Exception as _e:
        if DEBUG: print(f"⚠️ Fallo general en flush_telemetry_batches_async: {_e}")
        force_disconnect_mqtt()
        await check_critical_mqtt_errors(_e)

def flush_telemetry_batches():
    try:
        if not (client and getattr(client, 'sock', None) and wlan and wlan.isconnected()):
            return
        from utime import sleep_ms

        has_lux  = illuminance_Batch.count > 0
        has_temp = temperature_Batch.count > 0
        has_hum  = humidity_Batch.count > 0

        # Vaciado síncrono para apagado
        if has_lux:
            try:
                prefix = "└─" if not (has_temp or has_hum) else "├─"
                if publish_single_batch("illuminance", illuminance_Batch, prefix):
                    sleep_ms(500)
            except Exception as e:
                if DEBUG: print(f"⚠️ Fallo en flush síncrono de Illuminance: {e}")

        if has_temp:
            try:
                prefix = "└─" if not has_hum else "├─"
                if publish_single_batch("temperature", temperature_Batch, prefix):
                    sleep_ms(500)
            except Exception as e:
                if DEBUG: print(f"⚠️ Fallo en flush síncrono de Temperature: {e}")

        if has_hum:
            try:
                if publish_single_batch("humidity", humidity_Batch, "└─"):
                    sleep_ms(500)
            except Exception as e:
                if DEBUG: print(f"⚠️ Fallo en flush síncrono de Humidity: {e}")

    except Exception as _e:
        if DEBUG: print(f"⚠️ Fallo general en flush_telemetry_batches: {_e}")

# ---- CORUTINA: Consumidor de Comandos MQTT ----
async def command_processor_task():
    global IS_SAMPLING_LUX, CONNECTED_ALLOWED
    from gc import collect

    while True:
        try:
            if not mqtt_message_buffer:
                await mqtt_msg_event.wait()
                mqtt_msg_event.clear()

            if not mqtt_message_buffer:
                continue

            topic, msg, retained, dup = mqtt_message_buffer.pop(0)

            msg_str = msg.decode('utf-8')
            m_low   = msg.lower()

            # Acuse de recibo de comando (eco)
            try:
                if client and wlan and wlan.isconnected():
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=1)
            except: pass

            if topic == MQTT_TOPIC_CMD:
                # 1. Reset
                if m_low == b"reset":
                    if DEBUG: print(f"    └─ Cmd: reset")
                    try:
                        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                            async with mqtt_lock:
                                client.publish(MQTT_TOPIC_STATUS, b"rebooting", retain=True, qos=1)
                    except: pass
                    
                    from machine import reset
                    from utime   import sleep
                    sleep(2)
                    reset()

                # 2. Control de Muestreo de Iluminancia (Día/Noche)
                elif m_low.startswith(b"lux_sampling:"):
                    action = m_low.split(b":")[1]
                    if action == b"on":
                        IS_SAMPLING_LUX = True
                        if DEBUG: print("    └─ Bh1750: ON")
                    elif action == b"off":
                        IS_SAMPLING_LUX = False
                        if DEBUG: print("    └─ Bh1750: OFF")

                # 3. Comandos de Auditoría (Prefix: audit_)
                elif m_low.startswith(b"audit_") and m_low.endswith((b"_on", b"_off")):
                    parts = m_low.split(b"_")
                    if len(parts) == 3:
                        category = parts[1].decode('utf-8')
                        action   = parts[2]

                        if category in AUDIT_MODE:
                            if action == b"on":
                                if not AUDIT_MODE.get(category):
                                    was_asleep = not any(AUDIT_MODE.values())
                                    AUDIT_MODE[category] = True
                                    AUDIT_COUNTERS[category] = 0
                                    if category in audit_events:
                                        audit_events[category].set()
                                    if was_asleep:
                                        audit_master_event.set()
                                        CONNECTED_ALLOWED = True # Forzar radio encendida
                                    if DEBUG: print(f"    └─ AUDIT {category.upper()}: ON")
                            elif action == b"off":
                                AUDIT_MODE[category] = False
                                if category in audit_events:
                                    audit_events[category].clear()
                                if DEBUG: print(f"    └─ AUDIT {category.upper()}: OFF")

                            await publish_audit_state()
                            
            del topic, msg, retained, dup
            collect()

        except Exception as e:
            if DEBUG: print(f"⚠️  Error en command_processor: {e}")
            await asyncio.sleep(1)

# ---- CORUTINA: Trabajador Unificado de Auditoría ----
async def unified_audit_task():
    from gc import collect

    while True:
        try:
            active_keys = [k for k, v in AUDIT_MODE.items() if v]

            if not active_keys:
                await audit_master_event.wait()
                audit_master_event.clear()
                await asyncio.sleep(1)
                active_keys = [k for k, v in AUDIT_MODE.items() if v]

            if not active_keys: continue

            fragments = []
            dirty = False
            dht_data = None

            for category in active_keys:
                sample_fn = AUDIT_SAMPLE_FNS.get(category)
                if not sample_fn: continue

                try:
                    if category in ("temp", "hum"):
                        if dht_data is None:
                            dht_data = get_dht_sample()
                        val = dht_data
                    else:
                        res = sample_fn()
                        if type(res).__name__ == 'generator':
                            val = await res
                        else:
                            val = res
                except Exception as e:
                    if DEBUG: print(f"⚠️ Error muestreando {category}: {e}")
                    val = None

                if val is not None:
                    if category == "wifi":
                        fragments.append('"%s":{"rssi":%d,"ip":"%s"}' % (category, val[0], val[1]))
                    elif category == "ram":
                        fragments.append('"%s":{"f":%d,"a":%d}' % (category, val[0], val[1]))
                    elif category == "temp":
                        fragments.append('"temperature":%s' % (str(val[0])))
                    elif category == "hum":
                        fragments.append('"humidity":%s' % (str(val[1])))
                    elif category == "lux":
                        fragments.append('"illuminance":%s' % (str(val)))

                    AUDIT_COUNTERS[category] += 1
                    dirty = True

                    if DEBUG: print(f"\n🔍  [Batch] {category.upper()} #{AUDIT_COUNTERS[category]}: {val}")

                    if AUDIT_COUNTERS[category] >= 10:
                        AUDIT_MODE[category] = False
                        AUDIT_COUNTERS[category] = 0
                        if category in audit_events:
                            audit_events[category].clear()
                        if DEBUG: print(f"\n📡  Auto-OFF: {category.upper()}")
                        await publish_audit_state()

            if dirty and client and getattr(client, 'sock', None):
                payload = "{" + ",".join(fragments) + "}"
                try:
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            client.publish(MQTT_TOPIC_AUDIT, payload, qos=0)
                except Exception as e:
                    if DEBUG: log_mqtt_exception("Fallo publicación Batch de Auditoría", e)
                    force_disconnect_mqtt()
                    await check_critical_mqtt_errors(e)
                del fragments, payload
                collect()

            await asyncio.sleep(60)

        except Exception as e:
            if DEBUG: print(f"⚠️ Error en unified_audit: {e}")
            await asyncio.sleep(10)

# ---- CORUTINA: Muestreo Periódico de Sensores y Ahorro de Energía ----
async def sensor_publish_task():
    global CONNECTED_ALLOWED
    from gc import collect

    await asyncio.sleep(5)

    while True:
        temp, hum, lux = None, None, None

        # 1. DHT22
        if dht_sensor is not None:
            try:
                clean_dht_line()
                await asyncio.sleep_ms(1500)
                dht_sensor.measure()
                temp = round(dht_sensor.temperature(), 1)
                hum  = round(dht_sensor.humidity(), 1)
            except: pass

        # 2. BH1750
        if IS_SAMPLING_LUX and illuminance_sensor is not None:
            try:
                lux_raw = illuminance_sensor.get_auto_luminance()
                if lux_raw is not None:
                    lux = round(lux_raw, 1)
            except: pass

        # 3. Acumular en buffers
        if temp is not None: temperature_Batch.append(temp)
        if hum is not None:  humidity_Batch.append(hum)
        if lux is not None:  illuminance_Batch.append(lux)

        if DEBUG:
            c = max(temperature_Batch.count, illuminance_Batch.count)
            print(f"📝 Muestreo ({c}/{BATCH_SIZE}): Temp={temp}°C, Hum={hum}%, Lux={lux}")

        # 4. Transmitir si se completa el lote
        if temperature_Batch.count >= BATCH_SIZE or illuminance_Batch.count >= BATCH_SIZE:
            if DEBUG: print(f"🚀 Lote de telemetría completo ({BATCH_SIZE}). Activando radio WiFi...")
            CONNECTED_ALLOWED = True

            ready = False
            for _ in range(60):
                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    ready = True
                    break
                await asyncio.sleep(1)

            if ready:
                await flush_telemetry_batches_async()
            else:
                if DEBUG: print("⚠️ No se pudo conectar para transmitir el lote. Se reintentará luego.")

            # Apagar radio tras el intento si no hay auditorías activas
            if not any(AUDIT_MODE.values()):
                CONNECTED_ALLOWED = False
                shutdown()
        else:
            # Apagar si el WiFi quedó encendido por una auditoría que ya terminó
            if CONNECTED_ALLOWED and not any(AUDIT_MODE.values()):
                CONNECTED_ALLOWED = False
                shutdown()

        await asyncio.sleep(60)

# ---- CORUTINA: Programa Principal ----
async def main():
    from gc        import collect
    from machine   import WDT
    from network   import STA_IF, WLAN
    from ubinascii import hexlify

    # Identificación única
    mac_address = hexlify(WLAN(STA_IF).config('mac')).decode()
    client_id = f"ESP32-Environmental-Monitor-ZONA_A-{mac_address}"

    # Inicialización del Hardware (Logical)
    await setup_sensors()

    # Tareas Asíncronas
    asyncio.create_task(wifi_coro())
    asyncio.create_task(mqtt_connector_task(client_id))
    asyncio.create_task(command_processor_task())
    asyncio.create_task(sensor_publish_task())
    asyncio.create_task(unified_audit_task())

    # Watchdog Timer
    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        if DEBUG:
            print(f"🐕  Watchdog Activado: {Colors.MAGENTA}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        if DEBUG:
            print(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None

    while True:
        if wdt: wdt.feed()
        collect()
        await asyncio.sleep(13)

# ---- Detención local de Emergencia ----
def stopped_program():
    if DEBUG:
        print(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")

    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            flush_telemetry_batches()
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error en flush_telemetry_batches en stopped_program: {e}")
        from utime import sleep_ms
        sleep_ms(500)

        try:
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error publicando offline en stopped_program: {e}")
        sleep_ms(500)

    force_disconnect_mqtt(silent=False)

    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            wlan.active(False)
            if DEBUG: print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

# ---- safe_reset ----
def safe_reset():
    from machine import reset
    from utime   import sleep_ms
    try:
        shutdown()
    except: pass
    sleep_ms(1000)
    reset()

# ---- Punto de Entrada ----
if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        stopped_program()
    except Exception as e:
        if DEBUG:
            print(f"\n\n❌  Error fatal no capturado: {Colors.RED}{e}{Colors.RESET}\n\n")
        try:
            safe_reset()
        except:
            pass

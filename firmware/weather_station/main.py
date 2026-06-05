# -----------------------------------------------------------------------------# # Weather Station: Environmental Monitoring Firmware (ZONA_A)
# Descripción: Nodo de Monitoreo Ambiental del Orquideario (ZONA_A).
# Fecha: 26-05-2026
# Versión: v0.10.0
# notes_release: [Coordinación de Sensores]: Optimización de conectividad MQTT, resiliencia ante caídas y control de bajo consumo adaptado del Actuador.
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
DEBUG = False

# ---- Configuración MQTT (const() para ahorro de RAM) ----
# El broker esperará ~1.5x este valor antes de desconectar al cliente.
MQTT_KEEPALIVE       = const(90) # ~1.5x = 135 seg
# Intervalo para enviar pings de 'keepalive' al broker MQTT.
MQTT_PING_INTERVAL   = const(29) # seg (garantiza 4 pings en 120s con holgura de 15s)
# Intervalo para revisar mensajes MQTT entrantes.
MQTT_CHECK_INTERVAL  = const(5)  # seg
# Timeout para operaciones (check_msg, ping, publish)
# Optimizado para fallar rápido y reintentar.
MQTT_SOCKET_TIMEOUT  = const(45) # seg
# tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
# [WDT Safety]: Debe ser MENOR que el Watchdog de Hardware (125s)
MQTT_MESSAGE_TIMEOUT = const(90) # seg

# ---- Configuración Resiliencia / Watchdog ----
# Tiempo máximo sin conexión MQTT/WiFi antes de forzar un Hard Reset (10 minutos)
MAX_OFFLINE_RESET_SEC = const(600)
# Tiempo del Watchdog Timer (Hardware) en milisegundos (125 segundos (2 min 5 seg))
# [WDT Safety]: Debe ser mayor que SOCKET_TIMEOUT y MESSAGE_TIMEOUT para evitar reinicios durante operaciones lentas.
WDT_TIMEOUT_MS = const(125000)
# Tamaño máximo de la cola de mensajes MQTT para evitar OOM
MAX_BUFFER_SIZE = const(15)
# Tamaño de lote de telemetría (12 muestras = 1 hora con frecuencia de 5 min)
BATCH_SIZE = const(12)

# ---- Hardware: Pines de Alimentación y Datos de Sensores (Centralizados) ----
PIN_DHT_VCC      = const(15)
PIN_DHT_DATA     = const(4)
PIN_BH1750_VCC   = const(23)
PIN_I2C_SCL      = const(22)
PIN_I2C_SDA      = const(21)

# ---- Tópicos MQTT Pre-calculados (Optimización de RAM) ----
# Usamos b"" (bytes) y constantes para evitar concatenación en tiempo de ejecución.

# ---- Sistema y Conectividad (Diagnóstico/LWT) ----
# [LWT/Status]: Indica si el dispositivo está "online" u "offline" (usado para Last Will).
MQTT_TOPIC_STATUS         = const(b"PristinoPlant/Weather_Station/ZONA_A/status")

# [Audit Data]: Canal para streaming de datos unificados (RAM, lux, temp, hum).
MQTT_TOPIC_AUDIT          = const(b"PristinoPlant/Weather_Station/ZONA_A/audit")

# [Audit Flag]: Indica qué tareas de auditoría están activas internamente (para sincronización de UI).
MQTT_TOPIC_AUDIT_STATE    = const(b"PristinoPlant/Weather_Station/ZONA_A/audit/state")

# ---- Control y Comandos (RPC/Feedback) ----
# [General Cmd]: Recibe comandos de sistema (reset, audit_on, etc).
MQTT_TOPIC_CMD            = const(b"PristinoPlant/Weather_Station/ZONA_A/cmd")

# [Feedback]: Confirmación inmediata con el payload original de recepción de comando para la UI.
MQTT_TOPIC_CMD_RECEIVED   = const(b"PristinoPlant/Weather_Station/ZONA_A/cmd/received")

# ---- Telemetría del Nodo EMA (Estación Meteorológica Automática) ----
# [ZONA_A Metrics]: Batch de lecturas ambientales (lux, temp, hum).
MQTT_TOPIC_METRICS = const(b"PristinoPlant/Weather_Station/ZONA_A/readings")

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = const(b"lwt_disconnect")

# ---- Hardware: Sensores ----
dht_sensor    = None # DHT22 (Temp + Humedad)
bh1750_sensor = None # BH1750 (I2C)
i2c_bus       = None # Bus I2C global para diagnóstico

# ---- Variables Globales de Estado ----
# Buffer de mensajes MQTT para el patrón Productor-Consumidor
mqtt_message_buffer = []

# Evento maestro para despertar al Ticker Unificado de Auditoría
audit_master_event = asyncio.Event()

# Evento asíncrono para despertar a la tarea de procesamiento de mensajes MQTT
mqtt_msg_event = asyncio.Event()

# Evento asíncrono para indicar que la conexión MQTT está establecida y lista
mqtt_connected_event = asyncio.Event()

# Evento asíncrono para solicitar reset de WiFi de forma coordinada
wifi_reset_event = asyncio.Event()

# Evento asíncrono para esperar comandos de sincronización
sync_event = asyncio.Event()

# Evento asíncrono para indicar que el WiFi está listo (IP/DNS asignados) y MQTT limpio
wifi_ready_event = asyncio.Event()

# Variable de estado para indicar que el Scheduler ha solicitado suspender la radio
sleep_received = False

# Candado asíncrono para evitar colisiones en el socket SSL
mqtt_lock = asyncio.Lock()

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# Control de ahorro de energía (True = Radio encendida, False = Radio apagada)
CONNECTED_ALLOWED = True

# Control del primer arranque
IS_BOOT_STATUS = True

# ---- Configuración del muestreo de Iluminancia ----
# Flag de control para la sincronización del monitoreo de iluminancia (Día/Noche)
# Si es False, se suspende el muestreo del sensor BH1750 para evitar registros de 0 lux.
# (Se inicializa en OFF por defecto; el Scheduler sincronizará el estado real tras conectar)
IS_SAMPLING_LUX = False

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

# ---- Importación Segura de Secretos ----
try:
    from secrets import WIFI_SSID, WIFI_PASS, MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS
except ImportError:
    if DEBUG:
        print(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_SSID, WIFI_PASS = "", ""
    MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS = "", "", "", 1883, False, {}

# ------------------------------- Lógica de Sistema & Utilidades -------------------------------

# Modo de Auditoría (Bajo Demanda). Diccionario granular por tipo.
AUDIT_MODE = {
    "lux": False,
    "wifi": False,
    "ram": False,
    "temp": False,
    "hum": False
}

# Funciones de Muestreo Unificadas para Auditoría (Lazy Reference)
def get_lux_sample():
    if bh1750_sensor:
        try: return round(bh1750_sensor.get_auto_luminance(), 1)
        except: return None
    return None

def get_wifi_sample():
    from network import WLAN, STA_IF # type: ignore
    w = WLAN(STA_IF)
    if w.isconnected():
        # Retornamos tupla (RSSI, IP) para ahorrar RAM (evita dict)
        return (w.status('rssi'), w.ifconfig()[0])
    return None

def get_ram_sample():
    from gc import collect, mem_alloc, mem_free
    collect()
    # Retornamos tupla (Free, Alloc) para ahorrar RAM (evita dict)
    return (mem_free(), mem_alloc())

def get_dht_sample():
    """Lectura bajo demanda del DHT22 para auditoría."""
    if dht_sensor is None: return None
    try:
        # [Harden]: Atomic Fix obligatorio por estabilidad de cable largo
        clean_dht_line()
        from utime import sleep_ms
        sleep_ms(1500)
        
        dht_sensor.measure()
        return (round(dht_sensor.temperature(), 1), round(dht_sensor.humidity(), 1))
    except:
        return None

AUDIT_SAMPLE_FNS = {
    "lux":      get_lux_sample,
    "wifi":     get_wifi_sample,
    "ram":      get_ram_sample,
    "temp":     get_dht_sample,
    "hum":      get_dht_sample
}

# Contadores para el Auto-Apagado de auditorías (RAM)
AUDIT_COUNTERS = {
    "lux": 0,
    "wifi": 0,
    "ram": 0,
    "temp": 0,
    "hum": 0
}

# ---- Utilidades de Telemetría ----
class RingBuffer:
    def __init__(self, size):
        self.size = size
        self.buffer = [None] * size
        self.index = 0

    def clear(self):
        # Liberamos la lista de la RAM completamente (GC la recogerá)
        self.buffer = []
        self.index = 0

    def ensure_init(self):
        # Inicializamos el buffer solo cuando se va a usar
        if not self.buffer:
            self.buffer = [None] * self.size
            self.index = 0

    def append(self, item):
        self.ensure_init()
        from utime import time # type: ignore
        # Almacenamos el timestamp de Unix (segundos desde 1970)
        # Esto permite al frontend formatear la hora local del usuario.
        self.buffer[self.index] = (time(), item)
        self.index = (self.index + 1) % self.size

    def append_raw(self, timestamp, item):
        self.ensure_init()
        self.buffer[self.index] = (timestamp, item)
        self.index = (self.index + 1) % self.size

    def get_all(self):
        if not self.buffer: return []
        # Retorna los elementos en orden cronológico (del más viejo al más nuevo)
        res = []
        for i in range(self.size):
            idx = (self.index + i) % self.size
            if self.buffer[idx] is not None:
                res.append(self.buffer[idx])
        return res

    @property
    def count(self):
        """Cuenta los slots ocupados (no-None) del buffer."""
        if not self.buffer: return 0
        n = 0
        for item in self.buffer:
            if item is not None:
                n += 1
        return n

# ---- Gestión del RTC RAM (Deep Sleep) ----
def load_rtc_buffer():
    from machine import RTC
    import json
    rtc = RTC()
    try:
        data = rtc.memory()
        if data:
            return json.loads(data.decode('utf-8'))
    except Exception as e:
        if DEBUG: print("⚠️ Error al cargar RTC RAM:", e)
    # Inicialización por defecto
    return {
        "temp": [],
        "hum": [],
        "lux": [],
        "audit": {
            "lux": False,
            "wifi": False,
            "ram": False,
            "temp": False,
            "hum": False
        },
        "is_sampling_lux": False,
        "wifi_failures": 0,
        "dht_failures": 0,
        "lux_failures": 0
    }

def save_rtc_buffer(buffer_data):
    from machine import RTC
    import json
    rtc = RTC()
    try:
        serialized = json.dumps(buffer_data).encode('utf-8')
        if len(serialized) <= 2048:
            rtc.memory(serialized)
        else:
            if DEBUG: print("⚠️ Buffer excede los 2048 bytes del RTC RAM")
    except Exception as e:
        if DEBUG: print("⚠️ Error al guardar RTC RAM:", e)

# Buffers de Telemetría (RingBuffer)
illuminance_Batch = RingBuffer(BATCH_SIZE)
temperature_Batch = RingBuffer(BATCH_SIZE)
humidity_Batch    = RingBuffer(BATCH_SIZE)

# ---- Función Auxiliar: Sincronizar Estado de RAM (Audit Mode) ----
async def publish_audit_state():
    """Publica el estado de AUDIT_MODE usando formateo de strings para ahorrar RAM."""
    try:
        # Sincronización MQTT con validación de socket
        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            # Mapeo de estados de auditoría a strings JSON
            lux_on    = "true" if AUDIT_MODE["lux"]    else "false"
            wifi_on   = "true" if AUDIT_MODE["wifi"]   else "false"
            ram_on    = "true" if AUDIT_MODE["ram"]    else "false"
            temp_on   = "true" if AUDIT_MODE["temp"]   else "false"
            hum_on    = "true" if AUDIT_MODE["hum"]    else "false"

            # Mapeo de presencia de hardware
            hw_lux  = "true" if bh1750_sensor  else "false"
            hw_dht  = "true" if dht_sensor          else "false"

            # Construcción manual de JSON: Mucho más eficiente que dumps() para dicts anidados
            payload = '{"lux":%s,"wifi":%s,"ram":%s,"temp":%s,"hum":%s,"lux_hw":%s,"temp_hw":%s,"hum_hw":%s}' % (
                lux_on, wifi_on, ram_on, temp_on, hum_on,
                hw_lux, hw_dht, hw_dht
            )

            from umqtt.simple2 import MQTTException # type: ignore
            try:
                # 🔒 Pedimos permiso para usar el socket
                async with mqtt_lock:
                    # [Escudo de Concurrencia]: Previene AttributeError si otra tarea 
                    # invalidó el cliente durante la espera del lock.
                    if client and getattr(client, 'sock', None):
                        # Publicamos directo (MQTT convierte string a bytes)
                        client.publish(MQTT_TOPIC_AUDIT_STATE, payload, retain=True, qos=0)
                await asyncio.sleep_ms(500)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo sincronización estado auditoría", e)
                await check_critical_mqtt_errors(e)
            except Exception as e:
                if DEBUG: print(f"⚠️  Error inesperado en publish_audit_state: {e}")

    except Exception as e:
        if DEBUG: print(f"⚠️  Error preparando payload de auditoría: {e}")

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

# ---- Excepciones Personalizadas ----
class MQTTSessionZombie(OSError):
    """Excepción para identificar sesiones MQTT que han dejado de responder."""
    pass

# ---- Función Auxiliar: Interpretación de Errores MQTT ----
def log_mqtt_exception(context, e):
    """ Interpreta y loguea excepciones MQTT o de Red de forma humana. """
    if not DEBUG: return

    # Si es MQTTException, extraemos el código (e.args[0])
    if type(e).__name__ == 'MQTTException':
        code = e.args[0] if e.args else -1
        
        # [Optimización RAM]: Mapeo con if/elif en vez de dict literal.
        # Un dict temporal de 17 keys asigna ~400 bytes de heap en cada invocación
        # y fragmenta la RAM durante tormentas de errores de red consecutivos.
        # Los condicionales if/elif se resuelven en bytecode estático (0 bytes heap).
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
    
    # Si es OSError (Problemas de TCP/IP base, DNS, WiFi caído)
    elif isinstance(e, OSError):
        err_msg = str(e)
        code = e.args[0] if e.args else 0
        
        # Identificación de Zombie
        if isinstance(e, MQTTSessionZombie):
            prefix = "Zombie"
        else:
            prefix = f"Red-{code}"

        # Identificación rápida por enteros (Humanizado)
        if code == 110:   err_msg = "ETIMEDOUT (Internet demasiado lento o desconectado en silencio)"
        elif code == 113: err_msg = "EHOSTUNREACH (No hay ruta hacia el servidor, posible falla del proveedor de internet)"
        elif code == 104: err_msg = "ECONNRESET (El router o el proveedor de internet cerró la sesión inactiva)"
        elif code == 16:  err_msg = "EBUSY (Chip WiFi ocupado limpiando la conexión anterior)"
        elif code == 12:  err_msg = "ENOMEM (Memoria RAM insuficiente para esta operación)"
        elif code == -202: err_msg = "SSL Failed (Fallo al negociar la conexión segura, la red está muy inestable)"
        elif code == -17040: err_msg = "SSL RAM Error (Falta memoria RAM para procesar el certificado de seguridad)"
        elif code == -29312: err_msg = "SSL EOF (El servidor cerró la conexión antes de terminar la validación de seguridad)"
        
        print(f"\n❌  {context}: {Colors.RED}[{prefix}] {err_msg}{Colors.RESET}\n")
    
    # Cualquier otra excepción fatal (Python bugs, MemoryError)
    else:
        print(f"\n❌  {context}: {Colors.RED}{type(e).__name__}: {e}{Colors.RESET}\n")

# ---- Función Auxiliar: Limpieza Atómica de Línea DHT22 ----
def clean_dht_line():
    """
    Aplica el 'Atomic Fix' para limpiar la capacitancia residual en la línea de datos.
    Fuerza un estado HIGH controlado antes de ceder el control al driver DHT.
    """
    from machine import Pin
    from utime import sleep_ms
    # PIN_DHT_DATA es el estándar para el DHT22 en el Nodo EMA (ZONA_A)
    p = Pin(PIN_DHT_DATA, Pin.IN, Pin.PULL_UP)
    p.init(Pin.OUT)
    p.value(1)
    sleep_ms(1500)
    p.init(Pin.IN, Pin.PULL_UP)

# ---- Función Auxiliar: Setup del BH1750 ----
def setup_bh1750_sync():
    """Inicializa el bus I2C y el sensor BH1750 buscando en múltiples configuraciones."""
    global bh1750_sensor, i2c_bus
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
        if DEBUG: print(f"\n☀️  Verificando {Colors.YELLOW}BH1750{Colors.RESET}")
        for i, (bus_type, freq, timeout, label) in enumerate(BUS_CONFIGS):
            if sensor_connected: break
            try:
                if bus_type == "soft":
                    i2c_bus = SoftI2C(scl=Pin(PIN_I2C_SCL), sda=Pin(PIN_I2C_SDA), freq=freq, timeout=timeout)
                else:
                    i2c_bus = I2C(0, scl=Pin(PIN_I2C_SCL), sda=Pin(PIN_I2C_SDA), freq=freq)
                sleep_ms(150)
                i2c_bus.writeto(addr, b'')
                try: from bh1750 import BH1750 # type: ignore
                except ImportError:
                     if DEBUG: print(f"    ├─ ❌ Error: no se encontró bh1750.py")
                     return
                bh1750_sensor = BH1750(bus=i2c_bus, addr=addr)
                sleep_ms(200)
                lux_test = round(bh1750_sensor.get_auto_luminance(), 1)
                if lux_test is not None:
                    illuminance_Batch.append(lux_test)
                if DEBUG:
                    print(f"    ├─ ✅ {Colors.GREEN}Conectado{Colors.RESET} [{label}]")
                    print(f"    └─ 📊 Valor: {Colors.YELLOW}{lux_test} lux{Colors.RESET}")
                sensor_connected = True
            except OSError:
                if DEBUG: print(f"    ├─ ❌ {Colors.RED}No detectado{Colors.RESET} en [{label}]")
                continue
        if not sensor_connected:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}Desconectado{Colors.RESET}")
            bh1750_sensor = None
            i2c_bus = None
    except Exception as e:
        if DEBUG: print(f"    └─ ❌ Exception: {Colors.RED}[{e}]{Colors.RESET}")
        bh1750_sensor = None
        i2c_bus = None

async def hard_reset_sensors_physical():
    from machine import Pin
    import uasyncio as asyncio
    if DEBUG: print("    ├─ ⚡ Reiniciando")
    Pin(PIN_DHT_VCC, Pin.OUT).value(0)
    Pin(PIN_BH1750_VCC, Pin.OUT).value(0)
    await asyncio.sleep(3)
    # Volver a encender
    Pin(PIN_DHT_VCC, Pin.OUT).value(1)
    if IS_SAMPLING_LUX:
        Pin(PIN_BH1750_VCC, Pin.OUT).value(1)
    await asyncio.sleep(3) # Estabilización

# ---- Función Auxiliar: Inicializar y Restablecer Sensores ----
async def setup_sensors(force_hard_reset=False):
    """
    #### Inicialización Unificada de los sensores (Lógica)
    * Configura e instancia secuencialmente: DHT22 y BH1750.
    * Controla los pines de alimentación GPIO.
    * Si force_hard_reset=True, realiza un hard reset de alimentación física.
    """
    global dht_sensor, bh1750_sensor
    from machine import Pin
    import uasyncio as asyncio

    # 0. Fase Física: Hard Reset por Corte de Energía
    if force_hard_reset:
        if DEBUG:
            print(f"\n⚡  {Colors.YELLOW}Hard Reset {Colors.RESET} [ DHT22 + BH1750 ]")
        dht_sensor = None
        bh1750_sensor = None

        # Cortamos la energía
        Pin(PIN_DHT_VCC, Pin.OUT).value(0)
        Pin(PIN_BH1750_VCC, Pin.OUT).value(0)
        # Esperamos que se descargue la capacitancia
        await asyncio.sleep(5)

        # Restauramos la energía
        Pin(PIN_DHT_VCC, Pin.OUT).value(1)
        if IS_SAMPLING_LUX:
            Pin(PIN_BH1750_VCC, Pin.OUT).value(1)
        else:
            Pin(PIN_BH1750_VCC, Pin.OUT).value(0)
        # Esperamos que se estabilice la capacitancia
        await asyncio.sleep(5)

    else:
        # 1. Configurar y encender alimentación
        Pin(PIN_DHT_VCC, Pin.OUT).value(1)
        if IS_SAMPLING_LUX:
            Pin(PIN_BH1750_VCC, Pin.OUT).value(1)
        else:
            Pin(PIN_BH1750_VCC, Pin.OUT).value(0)
        await asyncio.sleep(2) # Espera obligatoria para estabilización de sensores (LDO/DHT)

    # 2. Configuración de Sensor DHT22 (Clima Interior)
    dht_boot_ok = False
    try:
        from dht import DHT22
        if DEBUG: print(f"\n🌡️  Verificando {Colors.YELLOW}DHT22{Colors.RESET}")
  
        dht_sensor = DHT22(Pin(PIN_DHT_DATA, Pin.IN, Pin.PULL_UP))

        # Verificación de lectura rápida
        try:
            clean_dht_line()
            await asyncio.sleep_ms(1500) # Estabilización post-limpieza
            dht_sensor.measure()
            temp, hum = dht_sensor.temperature(), dht_sensor.humidity()
            if -10 <= temp <= 60 and 0 <= hum <= 100:
                dht_boot_ok = True
                temperature_Batch.append(round(temp, 1))
                humidity_Batch.append(round(hum, 1))
                if DEBUG:
                    print(f"    ├─ ✅ {Colors.GREEN}Conectado{Colors.RESET}")
                    print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                    print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
            else:
                if DEBUG: print(f"    ├─ ⚠️ {Colors.YELLOW}Fuera de rango en lectura inicial{Colors.RESET}")
        except Exception:
            if DEBUG: print(f"    ├─ ⚠️ {Colors.YELLOW}Sin respuesta en lectura inicial{Colors.RESET}")
    except Exception as e:
        if DEBUG: print(f"    ├─ ❌ Fallo inicialización DHT22: {e}")
        dht_sensor = None

    # [Plan B]: Rescate lógico si la verificación inicial falló en boot (bucle de hasta 3 rescates)
    if not dht_boot_ok and not force_hard_reset:
        for attempt in range(1, 4):
            if DEBUG: print(f"    ├─ 🔄 {Colors.CYAN}Hard Reset Sensors (Intento {attempt}/3).{Colors.RESET}")
            
            # Reset físico de alimentación para limpiar los sensores
            await hard_reset_sensors_physical()
            dht_sensor = None
            
            try:
                clean_dht_line()
                await asyncio.sleep(1.5)
                from dht import DHT22
                dht_sensor = DHT22(Pin(PIN_DHT_DATA, Pin.IN, Pin.PULL_UP))
                dht_sensor.measure()
                temp, hum = dht_sensor.temperature(), dht_sensor.humidity()
                if -10 <= temp <= 60 and 0 <= hum <= 100:
                    temperature_Batch.append(round(temp, 1))
                    humidity_Batch.append(round(hum, 1))
                    dht_boot_ok = True
                    if DEBUG:
                        print(f"    ├─ ✅ {Colors.GREEN}Recuperado tras Reset Físico (Intento {attempt}){Colors.RESET}")
                        print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                        print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
                    break
                else:
                    if DEBUG: print(f"    ├─ ⚠️ {Colors.YELLOW}Fuera de rango tras reset (Intento {attempt}/3){Colors.RESET}")
            except Exception:
                if DEBUG: print(f"    ├─ ⚠️ {Colors.YELLOW}Sin respuesta tras reset (Intento {attempt}/3){Colors.RESET}")
        
        if not dht_boot_ok:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}No se pudo recuperar el DHT22 tras 3 intentos. El Scheduler sincronizará.{Colors.RESET}")
            dht_sensor = None

    # 3. Inicializar el Sensor de Iluminancia (BH1750 / I2C) (Solo si IS_SAMPLING_LUX es True)
    if IS_SAMPLING_LUX:
        setup_bh1750_sync()
    else:
        if DEBUG: print("\n🌙  Muestreo de BH1750 Suspendido (Noche). Saltando inicialización.")
        bh1750_sensor = None

    # Seteo final de seguridad para el DHT22 si no está inicializado
    if not dht_boot_ok:
        dht_sensor = None
        if force_hard_reset:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}Desconectado / Fallo tras restablecimiento síncrono{Colors.RESET}")

# ---- Función Auxiliar: Callback de estado ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""
    if not DEBUG: return

    from umqtt import errno as umqtt_errno # type: ignore

    # Ignoramos SDELIVERED (Éxito silencioso)
    if status == umqtt_errno.SDELIVERED:
        return

    if status == umqtt_errno.STIMEOUT:
        if DEBUG:
            print(f"\n⚠️  {Colors.YELLOW}Timeout de entrega{Colors.RESET} (PID: {pid}): El broker no confirmó.")
        return

    if status == umqtt_errno.SUNKNOWNPID:
        if DEBUG:
            print(f"\n❌  {Colors.RED}PID Desconocido{Colors.RESET} (PID: {pid}): Respuesta inesperada del broker.")
        return

# ---- CORRUTINA: Consumidor de Mensajes MQTT ---- 
async def mqtt_processor_task():
    """**CONSUMIDOR MQTT: Procesa mensajes fuera del hilo del socket (Event-Driven).**"""
    # Gestión de variables globales
    global mqtt_message_buffer, AUDIT_MODE, bh1750_sensor, CONNECTED_ALLOWED, IS_SAMPLING_LUX, sync_event, sleep_received

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc    import collect
    from machine import reset
    from utime import sleep

    try:
        from umqtt.simple2 import MQTTException # type: ignore
    except ImportError:
        class MQTTException(Exception): pass

    while True:
        # Si el búfer está vacío, dormimos la corrutina hasta que el callback nos despierte
        if not mqtt_message_buffer:
            mqtt_msg_event.clear()
            await mqtt_msg_event.wait()
            continue

        # Extraemos el mensaje más antiguo
        topic, msg, retained, dup = mqtt_message_buffer.pop(0)

        try:
            # El parsing de JSON y decodificación de strings fragmenta la memoria.
            collect()

            if DEBUG:
                # Decodificación tardía para ahorrar RAM en producción
                topic_str = topic.decode('utf-8')
                msg_str = msg.decode('utf-8')
                header = f"\n📡  {Colors.BLUE}Procesando{Colors.RESET}"
                if retained: header += f" {Colors.YELLOW}[Retained]{Colors.RESET}"
                if dup:      header += f" {Colors.MAGENTA}[Duplicate]{Colors.RESET}"

                print(header)
                print(f"    ├─ Tópico: {Colors.GREEN}{topic_str}{Colors.RESET}")
                print(f"    ├─ Msg:    {Colors.BLUE}{msg_str}{Colors.RESET}")
                del topic_str, msg_str

            # ---- ACUSE DE RECIBO (ACK) ----
            # Hacemos eco del comando crudo (raw) para el Scheduler y el Frontend
            try:
                if client and wlan and wlan.isconnected():
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        # [Escudo de Concurrencia]: Validación de socket post-await
                        if client and getattr(client, 'sock', None):
                            # Cambiado a QoS 0 para estabilizar la entrega asíncrona sobre TLS
                            client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=0)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo en el ACK del comando", e)
                await check_critical_mqtt_errors(e)
            except Exception: pass

            # ---- 🛡️ Lógica del Sistema de Comandos (/cmd) ----
            if topic == MQTT_TOPIC_CMD:
                sync_event.set()

                # Pre-procesamiento de mensaje para ahorrar RAM y ciclos
                m_low = msg.lower()

                # 1. Comando: RESET
                if m_low == b"reset":
                    if DEBUG: print(f"    └─ Acción: {Colors.CYAN}Reboot the Device{Colors.RESET}")
                    collect()
                    if DEBUG: print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}")
                    sleep(3) # Pausa breve para flush de logs
                    safe_reset()

                # 2. Comando: SLEEP
                elif m_low == b"sleep":
                    if DEBUG: print("    └─ Acción: Apagar radio por orden del Scheduler")
                    sleep_received = True
                    # Apagamos todas las auditorías locales para consistencia
                    for cat in AUDIT_MODE:
                        AUDIT_MODE[cat] = False
                        AUDIT_COUNTERS[cat] = 0
                    # Persistir en RTC
                    rtc_data = load_rtc_buffer()
                    rtc_data["audit"] = AUDIT_MODE
                    save_rtc_buffer(rtc_data)
                    sync_event.set()

                # 3. Sincronización Horaria (Scheduler -> Firmware)
                elif msg.startswith(b'{"time"'):
                    try:
                        import json
                        from machine import RTC
                        data = json.loads(msg.decode('utf-8'))
                        if "time" in data:
                            RTC().datetime(data["time"])
                            if DEBUG: print(f"    └─ RTC Sincronizado: {data['time']}")
                    except Exception as e:
                        if DEBUG: print(f"    └─ ❌ Error sincronizando RTC: {e}")

                # 4. Control de Muestreo de Iluminancia (Día/Noche)
                elif m_low.startswith(b"lux_sampling:"):
                    action = m_low.split(b":")[1]
                    if action == b"on":
                        IS_SAMPLING_LUX = True
                        if DEBUG: print("    └─ Bh1750: ON")
                    elif action == b"off":
                        IS_SAMPLING_LUX = False
                        # Al apagar, limpiamos el buffer para no arrastrar basura de 0 lux
                        illuminance_Batch.clear()
                        if DEBUG: print("    └─ Bh1750: OFF")
                    
                    # Persistir en RTC
                    rtc_data = load_rtc_buffer()
                    rtc_data["is_sampling_lux"] = IS_SAMPLING_LUX
                    save_rtc_buffer(rtc_data)

                # 5. Comandos de Auditoría (Prefix: audit_)
                elif m_low.startswith(b"audit_") and m_low.endswith((b"_on", b"_off")):
                    parts = m_low.split(b"_")
                    if len(parts) == 3:
                        # [Lazy Decoding]: Decodificamos solo la categoría para el diccionario
                        category = parts[1].decode('utf-8')
                        action   = parts[2]
                        
                        if category in AUDIT_MODE:
                            if action == b"on":
                                # [Idempotencia]: Solo actuamos si no está ya encendido
                                if not AUDIT_MODE.get(category):
                                    was_asleep = not any(AUDIT_MODE.values())
                                    AUDIT_MODE[category] = True
                                    AUDIT_COUNTERS[category] = 0
                                    if was_asleep:
                                        audit_master_event.set()
                                        # Encendemos la radio wifi
                                        CONNECTED_ALLOWED = True 
                                    if DEBUG: print(f"    └─ AUDIT {category.upper()}: ON")
                            elif action == b"off":
                                AUDIT_MODE[category] = False
                                collect()
                                if DEBUG: print(f"    └─ AUDIT {category.upper()}: OFF")
                            
                            # Persistir en RTC
                            rtc_data = load_rtc_buffer()
                            rtc_data["audit"] = AUDIT_MODE
                            save_rtc_buffer(rtc_data)
                            
                            await publish_audit_state()

                        del category, action
                    del parts

                # 4. Comando: Sincronización de Clima (Scheduler → Firmware)
                elif m_low == b"sync_climate":
                    if DEBUG: print(f"    └─ Acción: {Colors.CYAN}Sync Climate (Re-Setup de Sensores){Colors.RESET}")
                    try:
                        await setup_sensors()

                        # Publicamos las lecturas frescas obtenidas durante la inicialización
                        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                            await flush_telemetry_batches_async()
                            if DEBUG: print("    └─ ✅ Sync exitoso: publicado en canal estándar")
                    except (MQTTException, OSError) as e:
                        if DEBUG: log_mqtt_exception("Fallo en sync_climate", e)
                        await check_critical_mqtt_errors(e)
                    except Exception as e:
                        if DEBUG: print(f"    └─ ❌ Error en sync_climate: {e}")

                del m_low

            collect()

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Fallo en bucle principal MQTT (Processor)", e)
            await check_critical_mqtt_errors(e)
        except Exception as e:
            if DEBUG: print(f"\n❌  Error en mqtt_processor_task: {Colors.RED}{e}{Colors.RESET}")
        
        del topic, msg, retained, dup
        collect()

def sub_callback(topic, msg, retained, dup):
    """**PRODUCTOR MQTT: Encola mensajes para procesamiento asíncrono.**"""
    global mqtt_message_buffer

    mqtt_message_buffer.append((topic, msg, retained, dup))
    
    if len(mqtt_message_buffer) > MAX_BUFFER_SIZE:
        mqtt_message_buffer.pop(0)
        if DEBUG:
            print(f"⚠️  {Colors.YELLOW}Buffer MQTT lleno{Colors.RESET} (Descartando antiguo)")

    # Despierta a la corrutina mqtt_processor_task para procesar el nuevo mensaje
    mqtt_msg_event.set()

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt(silent=True):
    """**Cierra forzosamente el socket MQTT e invalida el cliente.**"""
    # Gestión de variables globales
    global client

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc import collect

    if client is not None:
        # 1. Intentamos desconectarnos.
        try:
            if wlan and wlan.isconnected():
                client.disconnect()
        except Exception: pass


        # 2. Forzamos el cierre de los sockets internos de MicroPython.
        try:
            if hasattr(client, 'sock') and client.sock:
                client.sock.close()
        except Exception: pass

        try:
            if hasattr(client, 'sock_raw') and client.sock_raw:
                client.sock_raw.close()
        except Exception: pass

        # 3. Rompemos la referencia de forma atómica
        try:
            client.sock = None
            client.sock_raw = None
        except Exception: pass
        
        client = None

        # Notificamos que MQTT ya no está conectado
        mqtt_connected_event.clear()

        collect()

        # Solo imprimimos el log si NO se solicitó silencio y DEBUG está activo
        if DEBUG and not silent:
            print(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

# ---- CORUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    """**Gestiona la (re)conexión asíncrona del WiFi (Ahorro de Batería)**"""
    # Gestión de variables globales
    global wlan

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from network import STA_IF, WLAN # type: ignore
    from utime   import time         # type: ignore

    # Inicialización del objeto WLAN
    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = wlan.isconnected()
    was_connected = wlan.isconnected()
    if was_connected:
        wifi_ready_event.set()
    else:
        wifi_ready_event.clear()

    wifi_disconnect_start = None # Marca de tiempo para calcular la duración de la desconexión

    while True:
        if not CONNECTED_ALLOWED:
            wifi_ready_event.clear()
            was_connected = False
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

        if not wlan.isconnected() or wifi_reset_event.is_set():
            wifi_ready_event.clear()
            # Limpiamos el evento inmediatamente al iniciar el ciclo de desconexión/reset
            wifi_reset_event.clear()

            if connected_once and was_connected:
                if DEBUG:
                    print(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")
            was_connected = False

            # ---- Verificación Previa (Safety Check) ----
            # Iniciamos el contador de desconexión por primera vez
            if wifi_disconnect_start is None:
                wifi_disconnect_start = time()

            # Verificamos AQUI por si el bloque try falla repetidamente (la primera vez)
            if (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                if DEBUG:
                    print(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                    print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                await asyncio.sleep(1)
                safe_reset()

            try:
                # fuerza a la capa de red a limpiar todos los estados internos, timers y handshakes pendientes antes de intentar una nueva conexión
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(2)
                wlan.active(True)

                if DEBUG: print(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_SSID}{Colors.RESET}", end="")
                wlan.connect(WIFI_SSID, WIFI_PASS)

                while not wlan.isconnected():
                    # ---- Verificación de falla crítica por tiempo ----
                    # Si llevamos mucho tiempo intentando conectar (inicio de desconexión + tiempo actual)
                    # Forzamos un reinicio para limpiar el stack TCP/IP / Hardware
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

                    # Inyección de DNS
                    try:
                        cloudflare_dns = "1.1.1.1"
                        ip, subnet, gateway, dns = wlan.ifconfig()
                        wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
                        if DEBUG:
                            print(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
                    except Exception as e:
                        if DEBUG: print(f"⚠️  Error forzando DNS en Boot: {e}")

                    # Resetear contador de falla
                    wifi_disconnect_start = None

                    # Invalidamos el cliente MQTT forzando una reconexión completa.
                    force_disconnect_mqtt()

                    # Setear que WiFi está listo
                    wifi_ready_event.set()

                    # Primera Conexión Establecida.
                    connected_once = True
                    was_connected = True

            except Exception as e:
                # OSErrors durante la conexión WiFi (ej: hardware no disponible, fallo de IP)
                if DEBUG:
                    print(f"\n❌  No se pudo establecer la conexión WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            # Conectado: Reseteamos contador
            wifi_disconnect_start = None
            was_connected = True
            if not wifi_ready_event.is_set():
                wifi_ready_event.set()
            # Revisamos la conexion cada 20 segundos
            await asyncio.sleep(20)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    """Callback del Timer de Hardware: Reinicia si la conexión se cuelga."""
    from utime import sleep # type: ignore

    if DEBUG:
        print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Timeout en conexión MQTT {Colors.RED}(Socket Bloqueado){Colors.RESET}")
        print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
        sleep(1)

    safe_reset()

# ---- CORRUTINA: Manejo centralizado de Errores Críticos MQTT ----
async def check_critical_mqtt_errors(e):
    """Evalúa si la excepción es crítica y requiere un reinicio por HW/SW."""
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -30592, 12]:
        if DEBUG:
            print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Fallo crítico de SSL/Red/RAM ({e.args[0]}).")
            print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n")
        await asyncio.sleep(5)
        safe_reset()

# ---- Funciones Auxiliares: Vaciar y Publicar Telemetría (DRY) ----
def publish_single_batch(metric_name, ring_buffer):
    """Construye y publica un lote de telemetría de forma síncrona."""
    if ring_buffer.count > 0:
        count = ring_buffer.count
        data_str = ",".join('[%d,{"%s":%s}]' % (it[0], metric_name, str(it[1])) for it in ring_buffer.get_all())
        payload_batch = '{"data":[%s]}' % data_str
        client.publish(MQTT_TOPIC_METRICS, payload_batch, qos=0)
        
        if DEBUG:
            name = metric_name.decode() if isinstance(metric_name, bytes) else metric_name
            print(f"📊  [Batch] {name} enviado con éxito ({count} muestras)")
            
        ring_buffer.clear()
        return True
    return False

# ---- Utilidades de Telemetría: Publica de manera asincrona todos los batches ----
async def flush_telemetry_batches_async():
    """Vaciado asíncrono de buffers (evita bloquear el event loop cooperativo de uasyncio)."""
    if not (client and getattr(client, 'sock', None) and wlan and wlan.isconnected()):
        return

    # 1. Illuminance
    try:
        async with mqtt_lock:
            if client and getattr(client, 'sock', None):
                if publish_single_batch("illuminance", illuminance_Batch):
                    await asyncio.sleep_ms(500)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando illuminance batch: {e}")
        await check_critical_mqtt_errors(e)

    # 2. Temperature
    try:
        async with mqtt_lock:
            if client and getattr(client, 'sock', None):
                if publish_single_batch("temperature", temperature_Batch):
                    await asyncio.sleep_ms(500)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando temperature batch: {e}")
        await check_critical_mqtt_errors(e)

    # 3. Humidity
    try:
        async with mqtt_lock:
            if client and getattr(client, 'sock', None):
                if publish_single_batch("humidity", humidity_Batch):
                    await asyncio.sleep_ms(500)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando humidity batch: {e}")
        await check_critical_mqtt_errors(e)

# ---- Utilidades de Telemetría: Publica de manera sincrona todos los batches ----
def flush_telemetry_batches():
    """Vaciado síncrono de buffers (exclusivo para detención segura / stopped_program)."""
    if not (client and getattr(client, 'sock', None) and wlan and wlan.isconnected()):
        return
    from utime import sleep_ms

    # 1. Illuminance
    try:
        if client and getattr(client, 'sock', None):
            if publish_single_batch("illuminance", illuminance_Batch):
                sleep_ms(300)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando illuminance batch (síncrono): {e}")

    # 2. Temperature
    try:
        if client and getattr(client, 'sock', None):
            if publish_single_batch("temperature", temperature_Batch):
                sleep_ms(300)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando temperature batch (síncrono): {e}")

    # 3. Humidity
    try:
        if client and getattr(client, 'sock', None):
            if publish_single_batch("humidity", humidity_Batch):
                sleep_ms(300)
    except Exception as e:
        if DEBUG: print(f"⚠️ Fallo publicando humidity batch (síncrono): {e}")

# ---- CORRUTINA: Gestión de Conexión MQTT (Nodo EMA) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    from gc            import collect
    from machine       import Timer
    from umqtt.simple2 import MQTTClient, MQTTException  # type: ignore
    from utime         import ticks_diff, ticks_ms, time # type: ignore

    wd_timeout_ms = (MQTT_SOCKET_TIMEOUT + 15) * 1000
    mqtt_disconnect_start = None
    last_manual_ping = ticks_ms()
    consecutive_mqtt_failures = 0
    heartbeat_failures = 0

    while True:
        # Si el ahorro de energía está apagando el WiFi, dormimos
        if not CONNECTED_ALLOWED:
            await asyncio.sleep(5)
            continue

        if not wifi_ready_event.is_set():
            try:
                await asyncio.wait_for(wifi_ready_event.wait(), 10)
            except asyncio.TimeoutError:
                continue

        # 🔄 Gestionamos la (Re)conexión
        if client is None:
            if mqtt_disconnect_start is None:
                mqtt_disconnect_start = time()
            
            if (time() - mqtt_disconnect_start > MAX_OFFLINE_RESET_SEC):
                if DEBUG:
                    print(f"\n💀  {Colors.RED}DEATH: El MQTT no conectó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}")
                await asyncio.sleep(1)
                safe_reset()

            try:
                force_disconnect_mqtt() 
                collect()
                from gc import mem_free

                if mem_free() < 48000:
                    if DEBUG: print(f"⚠️  RAM insuficiente para SSL ({mem_free()//1024}KB). Forzando GC profundo.")
                    collect()
                    await asyncio.sleep(3)
                    if mem_free() < 45000:
                        if DEBUG: print(f"💀  RAM crítica persistente ({mem_free()//1024}KB). Hard-Reset de emergencia.")
                        await asyncio.sleep(1)
                        safe_reset()

                # Inicializamos el Cliente MQTT
                client = MQTTClient(
                    client_id=client_id,
                    server=MQTT_SERVER,
                    port=MQTT_PORT,
                    user=MQTT_USER,
                    password=MQTT_PASS,
                    keepalive=MQTT_KEEPALIVE,
                    ssl=MQTT_SSL,
                    ssl_params=MQTT_SSL_PARAMS,
                    socket_timeout=MQTT_SOCKET_TIMEOUT,
                    message_timeout=MQTT_MESSAGE_TIMEOUT
                )

                client.set_last_will(LWT_TOPIC, LWT_MESSAGE, retain=True, qos=1)
                client.set_callback(sub_callback)
                client.set_callback_status(sub_status_callback)
                
                # [SEGURIDAD] Watchdog de conexión síncrona
                wd_timer = Timer(0)
                wd_timer.init(period=wd_timeout_ms, mode=Timer.ONE_SHOT, callback=_connection_timeout_handler)

                if DEBUG:
                    log_disk_usage()
                    log_ram_usage()
                    print(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

                try:
                    client.connect(clean_session=True)
                except (MQTTException, OSError) as e_connect:
                    wd_timer.deinit()
                    force_disconnect_mqtt()
                    wifi_reset_event.set()
                    raise e_connect
                finally:
                    try: wd_timer.deinit()
                    except: pass

                mqtt_disconnect_start = None

                if DEBUG:
                    print(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                client.last_cpacket = ticks_ms()
                last_manual_ping = ticks_ms()
                consecutive_mqtt_failures = 0

                # Suscripción inmediata a cmd (QoS 1) para evitar perder el primer comando de sincronización
                try:
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            client.subscribe(MQTT_TOPIC_CMD, qos=1)
                    await asyncio.sleep_ms(500)
                except Exception as sub_err:
                    if DEBUG: print(f"⚠️ Error en suscripciones: {sub_err}")
                    raise sub_err

                # 📡 Señalizamos el estado al Scheduler.
                try:
                    global IS_BOOT_STATUS
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            if IS_BOOT_STATUS:
                                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)
                                IS_BOOT_STATUS = False
                                if DEBUG: print(f"\n📡  NODO {Colors.GREEN}Online{Colors.RESET}", end="\n\n")
                            else:
                                client.publish(MQTT_TOPIC_STATUS, b"reboot", retain=True, qos=1)
                                if DEBUG: print(f"\n📡  NODO {Colors.GREEN}Reboot{Colors.RESET}", end="\n\n")
                    await asyncio.sleep_ms(500)
                except Exception as _e:
                    if DEBUG: print(f"⚠️ Fallo publicando estado: {_e}")

                # Métricas Ambientales (Batches): Vaciamos los RingBuffers
                await flush_telemetry_batches_async()
                await asyncio.sleep_ms(500)

                mqtt_connected_event.set()

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo la Conexión MQTT", e)
                await check_critical_mqtt_errors(e)
                consecutive_mqtt_failures += 1
                force_disconnect_mqtt()
                wifi_reset_event.set()

                # ---- Backoff Adaptativo Unificado ----
                wait_time = min(30 * consecutive_mqtt_failures, 120)
                if DEBUG:
                    print(f"⚠️  {Colors.YELLOW}Backoff:{Colors.RESET} {consecutive_mqtt_failures} fallos de conexión seguidos.")
                    print(f"    └─ Esperando {wait_time}s para liberar RAM y estabilizar red.")
                
                collect()
                await asyncio.sleep(wait_time)
                while wlan is None or not wlan.isconnected():
                    await asyncio.sleep(1)
                continue

        # 🔄 Gestionamos la Conexión Activa
        if client:
            try:
                lock_acquired = False
                try:
                    await asyncio.wait_for(mqtt_lock.acquire(), 5)
                    lock_acquired = True
                except asyncio.TimeoutError:
                    pass

                if lock_acquired:
                    try:
                        if client and getattr(client, 'sock', None):
                            for _ in range(10):
                                if client.check_msg() is None:
                                    break
                    finally:
                        mqtt_lock.release()

                now_ms = ticks_ms()
                
                # ---- Heartbeat ----
                if client and ticks_diff(now_ms, last_manual_ping) > (MQTT_PING_INTERVAL * 1000):
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            try:
                                client.publish(MQTT_TOPIC_STATUS, b"ping", retain=False, qos=0)
                                if DEBUG: print(f"{Colors.BLUE}.{Colors.RESET}", end="")
                                client.last_cpacket = now_ms
                                heartbeat_failures = 0
                            except (MQTTException, OSError) as e_pub:
                                if DEBUG: print(f"\n⚠️  Fallo en Heartbeat: {e_pub}")
                                heartbeat_failures += 1
                                if heartbeat_failures >= 2:
                                    raise MQTTException("Heartbeat falló de forma persistente.")
                                last_manual_ping = now_ms

                # Control de sesión Zombie
                if client and ticks_diff(now_ms, client.last_cpacket) > (MQTT_KEEPALIVE * 1500):
                    raise MQTTSessionZombie("Inactividad del broker MQTT excedida")

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Error en Operación MQTT", e)
                await check_critical_mqtt_errors(e)
                force_disconnect_mqtt()
                consecutive_mqtt_failures += 1
                wait_time = min(30 * consecutive_mqtt_failures, 120)
                if DEBUG:
                    print(f"⚠️  Sesión MQTT perdida. Esperando {wait_time}s.")
                await asyncio.sleep(wait_time)
                continue

        await asyncio.sleep(MQTT_CHECK_INTERVAL)

# ---- CORUTINA AUXILIAR: Transmisión y Sincronización ----
async def transmit_and_sync():
    """
    Gestiona la conexión por evento, publica telemetrías acumuladas,
    espera comandos del Scheduler (30s) y desconecta la radio WiFi.
    """
    global CONNECTED_ALLOWED, sync_event, sleep_received
    from utime import ticks_ms, ticks_diff
    
    wlan_active = False
    try:
        if wlan and wlan.isconnected() and CONNECTED_ALLOWED:
            wlan_active = True
    except:
        pass

    if not wlan_active:
        if DEBUG: print(f"\n📡  Activando {Colors.BLUE}radio WiFi{Colors.RESET}")
        CONNECTED_ALLOWED = True

    sleep_received = False

    try:
        # Espera asíncrona limpia mediante evento (Máximo 45 segundos)
        await asyncio.wait_for(mqtt_connected_event.wait(), 45)
        
        # Conexión exitosa: Publicar lotes acumulados
        await flush_telemetry_batches_async()
        
        # Ventana de sincronización de 60s
        sync_event.clear()
        start_time = ticks_ms()
        timeout_ms = const(60000)

        while not sleep_received:
            elapsed = ticks_diff(ticks_ms(), start_time)
            remaining_ms = timeout_ms - elapsed
            if remaining_ms <= 0:
                if DEBUG: print("\n⚠️  Timeout de sincronización con el Scheduler (30s)")
                break
                
            sync_event.clear()
            try:
                # Esperamos al evento en segundos
                await asyncio.wait_for(sync_event.wait(), remaining_ms / 1000.0)
                
                # Si se recibió un comando que no es sleep, extendemos la ventana de vigilia
                if not sleep_received:
                    if DEBUG: print("🔄 Comando recibido. Extendiendo ventana de sincronización por 60 segundos.")
                    start_time = ticks_ms()
            except asyncio.TimeoutError:
                if DEBUG: print("\n⚠️  Timeout de sincronización con el Scheduler")
                break
            except Exception as e:
                if DEBUG: print(f"⚠️  Error esperando comandos: {e}")
                break

    except asyncio.TimeoutError:
        if DEBUG: print("\n⚠️  No se pudo establecer conexión (Timeout 45s)")
    except Exception as e:
        if DEBUG: print(f"\n⚠️ Error en transmisión/sincronización: {e}")
    finally:
        # Apagar radio tras el intento si no hay auditorías activas
        if not any(AUDIT_MODE.values()):
            CONNECTED_ALLOWED = False
            shutdown(status=b"sleep")

# ---- CORUTINA: Muestreo Periódico de Sensores en Modo Continuo ----
async def sensor_publish_task():
    """
    Muestreo offline del DHT22 y BH1750 cada 5 minutos (300s).
    Acumula en RingBuffers y gatilla transmisión al completar el lote.
    """
    global CONNECTED_ALLOWED
    dht_read_failures = 0
    lux_read_failures = 0

    # Retardo inicial para estabilidad del regulador de voltaje (LDO)
    await asyncio.sleep(5)

    # === Fase de Arranque Inicial ===
    # Publica reportes pendientes al encenderse
    await transmit_and_sync()

    # === Bucle de Muestreo Periódico ===
    while True:
        await asyncio.sleep(300) # Muestreo cada 5 minutos (producción)

        temp, hum, lux = None, None, None

        # 1. Lectura DHT22 (Clima)
        dht_ok = False
        if dht_sensor is not None:
            try:
                clean_dht_line()
                await asyncio.sleep_ms(1500)
                dht_sensor.measure()
                temp = round(dht_sensor.temperature(), 1)
                hum  = round(dht_sensor.humidity(), 1)
                dht_ok = True
                dht_read_failures = 0
            except: pass

        if not dht_ok:
            dht_read_failures += 1
            if DEBUG: print(f"⚠️  DHT22: Fallo de lectura. Fallos: {dht_read_failures}")

        # 2. Lectura BH1750 (Solo si IS_SAMPLING_LUX es True)
        lux_ok = False
        if IS_SAMPLING_LUX and bh1750_sensor is not None:
            try:
                lux_raw = bh1750_sensor.get_auto_luminance()
                if lux_raw is not None:
                    lux = round(lux_raw, 1)
                    lux_ok = True
                    lux_read_failures = 0
            except: pass
        else:
            lux_ok = True 

        if not lux_ok:
            lux_read_failures += 1
            if DEBUG: print(f"⚠️  BH1750: Fallo de lectura. Fallos: {lux_read_failures}")

        # 2.1 Re-setup si hay fallos repetidos (Reducido a 3 fallos)
        if dht_read_failures >= 3 or lux_read_failures >= 3:
            if DEBUG:
                    print(f"\n⚠️  Se detecto un {Colors.YELLOW}FALLO{Colors.RESET} en los Sensores\n\n")
                    print(f"\n🔄  {Colors.BLUE}Re-inicializando Sensores{Colors.RESET}\n\n")
            await setup_sensors()
            dht_read_failures = 0
            lux_read_failures = 0

        # 3. Acumulación en RingBuffers
        if temp is not None: temperature_Batch.append(temp)
        if hum is not None:  humidity_Batch.append(hum)
        if lux is not None:  illuminance_Batch.append(lux)

        if DEBUG:
            c = max(temperature_Batch.count, illuminance_Batch.count)
            print(f"📊 Data ({c}/{BATCH_SIZE}): Temperature: {Colors.MAGENTA}{temp}°C{Colors.RESET}  Humidity: {Colors.BLUE}{hum}%{Colors.RESET}  Illuminance: {Colors.YELLOW}{lux} lux{Colors.RESET}")

        # 4. Transmitir si se completa el lote o en la hora en punto (minuto 0) con muestras acumuladas
        from machine import RTC
        dt = RTC().datetime()
        is_clock_synced = (dt[0] >= 2026)
        is_top_of_hour = (dt[5] == 0) if is_clock_synced else False
        has_samples = temperature_Batch.count > 0
        if temperature_Batch.count >= BATCH_SIZE or (IS_SAMPLING_LUX and illuminance_Batch.count >= BATCH_SIZE) or (is_top_of_hour and has_samples):
            await transmit_and_sync()
        else:
            # Apagar si la radio quedó encendida por una auditoría que terminó
            if CONNECTED_ALLOWED and not any(AUDIT_MODE.values()):
                CONNECTED_ALLOWED = False
                shutdown(status=b"sleep")

# ---- CORRUTINA: Sincronización y Batching de Auditorías ----
async def unified_audit_task():
    """
    Gestiona todas las auditorías activas en un solo ciclo sincronizado de 60s,
    publicando un único paquete MQTT con todos los datos recolectados.
    """
    from gc import collect

    while True:
        try:
            # Verificamos si hay alguna auditoría activa
            active_keys = [k for k, v in AUDIT_MODE.items() if v]

            if not active_keys:
                # Si no hay nada que auditar, dormimos hasta que un comando nos despierte
                await audit_master_event.wait()
                audit_master_event.clear()
                # Pequeño delay de cortesía para dejar que se procesen otros comandos
                await asyncio.sleep(1)
                active_keys = [k for k, v in AUDIT_MODE.items() if v]

            if not active_keys: continue

            fragments = []
            dirty = False
            dht_data = None # Cache temporal para evitar doble lectura del sensor en el mismo ciclo

            for category in active_keys:
                sample_fn = AUDIT_SAMPLE_FNS.get(category)
                if not sample_fn: continue

                try:
                    # Optimización DHT: Si es temp o hum, usamos la caché del ciclo o leemos una vez
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
                    # Construcción manual de la categoría en JSON PLANO (Snapshot)
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
                    
                    if DEBUG: print(f"\n🔍  [Batch] {category.upper()} Nro. {AUDIT_COUNTERS[category]}: {val}")

                    # Lógica de Auto-Off (10 muestras)
                    if AUDIT_COUNTERS[category] >= 10:
                        AUDIT_MODE[category] = False
                        AUDIT_COUNTERS[category] = 0
                        if DEBUG: print(f"\n📡  Auto-OFF: {category.upper()}")
                        await publish_audit_state()

            # Publicación Única (Minimiza contención de Lock y overhead de red)
            if dirty and client and getattr(client, 'sock', None):
                # Construcción manual de JSON para el bundle de auditoría
                payload = "{" + ",".join(fragments) + "}"
                try:
                    async with mqtt_lock:
                        if client and getattr(client, 'sock', None):
                            client.publish(MQTT_TOPIC_AUDIT, payload, qos=0)
                except Exception as e:
                    if DEBUG: log_mqtt_exception("Fallo publicación Batch de Auditoría", e)

                # Liberamos memoria de los fragmentos inmediatamente
                del fragments, payload
                collect()

            # ---- Ciclo de 60s (sin interrupciones) ----
            await asyncio.sleep(60)

        except Exception as e:
            if DEBUG: print(f"⚠️ Error en unified_audit: {e}")

# ---- Watchdog de Conexión WiFi (60s) ----
async def watchdog_wifi_connection():
    import uasyncio as asyncio
    from network import WLAN, STA_IF # type: ignore
    await asyncio.sleep(60)
    w = WLAN(STA_IF)
    if not w.isconnected():
        if DEBUG: print("\n⚠️ [Watchdog WiFi] No se pudo conectar en 60s. Entrando en deep sleep de recuperación (10 min).")
        # Incrementar fallas en RTC
        rtc_data = load_rtc_buffer()
        rtc_data["wifi_failures"] = rtc_data.get("wifi_failures", 0) + 1
        save_rtc_buffer(rtc_data)
        try:
            w.disconnect()
            w.active(False)
        except: pass
        import machine
        machine.deepsleep(600 * 1000) # 10 minutos de deep sleep

# ---- CORUTINA: Transmisión y Sincronización en Deep Sleep ----
async def main_transmission():
    from gc        import collect
    from machine   import WDT
    from network   import STA_IF, WLAN # type: ignore
    from ubinascii import hexlify      # type: ignore
    import utime

    mac_address = hexlify(WLAN(STA_IF).config('mac')).decode()
    client_id = f"__Nodo__EMA__Zona_A__{mac_address[-3:]}__"

    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
    except:
        wdt = None

    try:
        # Sincronización de boot inicial: si el reloj no está en hora,
        # leemos los sensores físicos para presentarnos al Scheduler con telemetrías válidas.
        from machine import RTC
        if RTC().datetime()[0] < 2026:
            if DEBUG: print("\n🌡️  Primer boot: Inicializando y leyendo sensores físicos de prueba...")
            global IS_SAMPLING_LUX
            old_sampling = IS_SAMPLING_LUX
            IS_SAMPLING_LUX = True
            await setup_sensors()
            IS_SAMPLING_LUX = old_sampling

        # Iniciar tareas de red (Secuencial tras el setup de sensores para evitar colisiones de RF y solapes de terminal)
        asyncio.create_task(wifi_coro())
        asyncio.create_task(mqtt_connector_task(client_id))
        asyncio.create_task(mqtt_processor_task())
        asyncio.create_task(watchdog_wifi_connection())

        # Esperar conexión MQTT
        await asyncio.wait_for(mqtt_connected_event.wait(), 60)
        if DEBUG: print("\n📡 Conectado a MQTT. Esperando que finalice el envío de batches...")

        # Esperar que los RingBuffers de batches se vacíen
        for _ in range(30):
            if temperature_Batch.count == 0 and humidity_Batch.count == 0 and (not IS_SAMPLING_LUX or illuminance_Batch.count == 0):
                if DEBUG: print("📊 Telemetrías enviadas con éxito a Ingest.")
                break
            await asyncio.sleep(1)
            if wdt: wdt.feed()

        # Ventana de sincronización inteligente (espera a sleep o timeout de 20s)
        if DEBUG: print("⏰ Ventana de sincronización abierta...")
        sync_event.clear()
        start_time = utime.ticks_ms()
        sync_timeout_ms = 20000

        while not sleep_received:
            elapsed = utime.ticks_diff(utime.ticks_ms(), start_time)
            remaining_ms = sync_timeout_ms - elapsed
            if remaining_ms <= 0:
                if DEBUG: print("\n⚠️  Timeout de ventana de sincronización con el Scheduler")
                break
                
            sync_event.clear()
            try:
                # Esperamos al evento en segundos
                await asyncio.wait_for(sync_event.wait(), remaining_ms / 1000.0)
                if wdt: wdt.feed()
                
                # Si se recibió un comando que no es sleep, extendemos la ventana de vigilia
                if not sleep_received:
                    if DEBUG: print("🔄 Comando recibido. Extendiendo ventana de sincronización por 20 segundos.")
                    start_time = utime.ticks_ms()
            except asyncio.TimeoutError:
                break
            except Exception as e:
                if DEBUG: print(f"⚠️  Error esperando comandos en ventana: {e}")
                break

        # Limpiar buffers de telemetría transmitida en el RTC RAM
        rtc_data = load_rtc_buffer()
        rtc_data["temp"] = []
        rtc_data["hum"] = []
        rtc_data["lux"] = []
        rtc_data["wifi_failures"] = 0
        save_rtc_buffer(rtc_data)

    except Exception as e:
        if DEBUG: print(f"⚠️ Error durante transmisión/sincronización horaria: {e}")
    finally:
        # Desconectar red
        global CONNECTED_ALLOWED
        CONNECTED_ALLOWED = False
        shutdown(status=b"sleep")

        # Calcular tiempo para el siguiente ciclo exacto (múltiplo de 5 min)
        sec_to_next = 300 - (utime.time() % 300)
        if sec_to_next < 30:
            sec_to_next += 300

        if DEBUG: print(f"💤 Transmisión terminada. Entrando en Deep Sleep por {sec_to_next} segundos.")
        await asyncio.sleep_ms(200) # Flush sockets
        import machine
        machine.deepsleep(sec_to_next * 1000)

# ---- CORUTINA: Modo Continuo (Auditoría) ----
async def main_async():
    from gc        import collect
    from machine   import WDT
    from network   import STA_IF, WLAN # type: ignore
    from ubinascii import hexlify      # type: ignore

    mac_address = hexlify(WLAN(STA_IF).config('mac')).decode()
    client_id = f"__Nodo__EMA__Zona_A__{mac_address[-3:]}__"

    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        if DEBUG:
            print(f"\n🐕  Watchdog: {Colors.YELLOW}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        if DEBUG:
            print(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None

    # Inicialización del Hardware (Secuencial y limpia antes de iniciar red)
    await setup_sensors()

    # Tareas Asíncronas de Red y Lógica
    asyncio.create_task(wifi_coro())
    asyncio.create_task(mqtt_connector_task(client_id))
    asyncio.create_task(mqtt_processor_task())
    asyncio.create_task(sensor_publish_task())
    asyncio.create_task(unified_audit_task())

    # Bucle de Supervisión y persistencia de estado en RTC
    while True:
        if wdt: wdt.feed()
        collect()

        # Guardar periódicamente el estado actual en RTC RAM por si hay reboot inesperado
        rtc_data = load_rtc_buffer()
        rtc_data["audit"] = AUDIT_MODE
        rtc_data["is_sampling_lux"] = IS_SAMPLING_LUX
        save_rtc_buffer(rtc_data)

        # Si ya no hay ninguna auditoría activa, forzamos un reinicio seguro para ir a deepsleep normal
        if not any(AUDIT_MODE.values()):
            if DEBUG: print("\n🔍 No hay auditorías activas. Reiniciando para entrar en Deep Sleep normal.")
            await asyncio.sleep(1)
            safe_reset()

        await asyncio.sleep(20)

# ---- Punto de Entrada Principal (Bajo Consumo / Auditorías) ----
def run_cycle():
    global IS_SAMPLING_LUX, AUDIT_MODE
    import utime
    import machine
    from machine import Pin

    # 1. Cargar el buffer del RTC RAM
    rtc_data = load_rtc_buffer()

    # 2. Configurar estados globales a partir de la memoria RTC
    IS_SAMPLING_LUX = rtc_data.get("is_sampling_lux", False)
    for k, v in rtc_data.get("audit", {}).items():
        if k in AUDIT_MODE:
            AUDIT_MODE[k] = v

    is_auditing = any(AUDIT_MODE.values())

    # Determinar si es de día basándonos de forma autónoma en el RTC
    from machine import RTC
    dt = RTC().datetime()
    current_hour = dt[4]

    # Determinar si el reloj está sincronizado (año >= 2026)
    is_clock_synced = (dt[0] >= 2026)

    # 3. Reporte Inicial / Sincronización de Primer Arranque
    # Si el reloj no está sincronizado, forzamos una conexión inmediata no bloqueante para
    # presentarnos al Scheduler, sincronizar el RTC y obtener el estado real de is_sampling_lux.
    if not is_clock_synced:
        if DEBUG: print("🚀 Primer arranque o desincronización horaria detectada. Conectando al Scheduler...")
        try:
            asyncio.run(main_transmission())
            # Recargar estados del RTC tras sincronización exitosa
            rtc_data = load_rtc_buffer()
            IS_SAMPLING_LUX = rtc_data.get("is_sampling_lux", False)
            for k, v in rtc_data.get("audit", {}).items():
                if k in AUDIT_MODE:
                    AUDIT_MODE[k] = v
            is_auditing = any(AUDIT_MODE.values())
            dt = RTC().datetime()
            current_hour = dt[4]
            is_clock_synced = (dt[0] >= 2026)
        except Exception as e:
            if DEBUG: print(f"❌ Error fatal en transmisión de primer arranque: {e}")
            safe_reset()

    if is_clock_synced:
        # Horario de día: de 5:00 AM a 6:59 PM (5 <= hour < 19)
        is_daytime = (5 <= current_hour < 19)
    else:
        # Si no está sincronizado, por seguridad muestreamos lux para no perder datos iniciales
        is_daytime = True

    # El sensor se lee si es de día (o si no se ha sincronizado el reloj aún)
    # y además el Scheduler tiene habilitado el muestreo, o si hay diagnóstico activo.
    should_sample_lux = (IS_SAMPLING_LUX and is_daytime) or is_auditing

    # CASO A: Modo Auditoría Activa (Runtime asíncrono permanente)
    if is_auditing:
        if DEBUG: print("\n🔍 Modo Auditoría Activo. Iniciando Runtime Asíncrono Completo.")
        # Hidratar batches con los datos acumulados
        for ts, val in rtc_data.get("temp", []):
            temperature_Batch.append_raw(ts, val)
        for ts, val in rtc_data.get("hum", []):
            humidity_Batch.append_raw(ts, val)
        for ts, val in rtc_data.get("lux", []):
            illuminance_Batch.append_raw(ts, val)
        
        try:
            asyncio.run(main_async())
        except KeyboardInterrupt:
            stopped_program()
        except Exception as e:
            if DEBUG: print(f"❌ Error fatal en runtime asíncrono: {e}")
            safe_reset()
        return

    # CASO B: Muestreo en Deep Sleep (Bajo Consumo)
    if DEBUG: print(f"\n💤 [Bajo Consumo] Iniciando toma de muestras offline... Lux sampling: {should_sample_lux} (RTC hora: {current_hour}h)")

    # Configurar y energizar sensores
    Pin(PIN_DHT_VCC, Pin.OUT).value(1)
    if should_sample_lux:
        Pin(PIN_BH1750_VCC, Pin.OUT).value(1)
    else:
        Pin(PIN_BH1750_VCC, Pin.OUT).value(0)

    utime.sleep_ms(2000) # Estabilización post-energización

    # Leer DHT22
    temp, hum = None, None
    try:
        clean_dht_line()
        utime.sleep_ms(1500)
        from dht import DHT22
        d_sensor = DHT22(Pin(PIN_DHT_DATA, Pin.IN, Pin.PULL_UP))
        d_sensor.measure()
        temp = round(d_sensor.temperature(), 1)
        hum = round(d_sensor.humidity(), 1)
        rtc_data["dht_failures"] = 0
    except Exception as e:
        if DEBUG: print("⚠️ Fallo lectura DHT22:", e)
        rtc_data["dht_failures"] = rtc_data.get("dht_failures", 0) + 1

    # Leer BH1750
    lux = None
    if should_sample_lux:
        try:
            from machine import SoftI2C
            from bh1750 import BH1750
            i2c = SoftI2C(scl=Pin(PIN_I2C_SCL), sda=Pin(PIN_I2C_SDA), freq=100000)
            utime.sleep_ms(100)
            b_sensor = BH1750(bus=i2c, addr=0x23)
            utime.sleep_ms(200)
            lux = round(b_sensor.get_auto_luminance(), 1)
            rtc_data["lux_failures"] = 0
        except Exception as e:
            if DEBUG: print("⚠️ Fallo lectura BH1750:", e)
            rtc_data["lux_failures"] = rtc_data.get("lux_failures", 0) + 1

    # Apagar alimentación de sensores
    Pin(PIN_DHT_VCC, Pin.OUT).value(0)
    Pin(PIN_BH1750_VCC, Pin.OUT).value(0)

    # Lógica de Hard Reset físico (3 fallos seguidos)
    dht_fail = rtc_data.get("dht_failures", 0)
    lux_fail = rtc_data.get("lux_failures", 0)
    if dht_fail >= 3 or (should_sample_lux and lux_fail >= 3):
        if DEBUG: print("⚠️ Fallos de sensores consecutivos. Ejecutando Hard Reset Físico...")
        utime.sleep_ms(2000)
        # Volver a alimentar
        Pin(PIN_DHT_VCC, Pin.OUT).value(1)
        if should_sample_lux:
            Pin(PIN_BH1750_VCC, Pin.OUT).value(1)
        utime.sleep_ms(2000)

        # Reintento DHT22
        try:
            clean_dht_line()
            utime.sleep_ms(1500)
            from dht import DHT22
            d_sensor = DHT22(Pin(PIN_DHT_DATA, Pin.IN, Pin.PULL_UP))
            d_sensor.measure()
            temp = round(d_sensor.temperature(), 1)
            hum = round(d_sensor.humidity(), 1)
            rtc_data["dht_failures"] = 0
        except Exception as e:
            if DEBUG: print("⚠️ Reintento DHT22 fallido tras reset:", e)

        # Reintento BH1750
        if should_sample_lux:
            try:
                from machine import SoftI2C
                from bh1750 import BH1750
                i2c = SoftI2C(scl=Pin(PIN_I2C_SCL), sda=Pin(PIN_I2C_SDA), freq=100000)
                utime.sleep_ms(100)
                b_sensor = BH1750(bus=i2c, addr=0x23)
                utime.sleep_ms(200)
                lux = round(b_sensor.get_auto_luminance(), 1)
                rtc_data["lux_failures"] = 0
            except Exception as e:
                if DEBUG: print("⚠️ Reintento BH1750 fallido tras reset:", e)

        # Apagar alimentación nuevamente
        Pin(PIN_DHT_VCC, Pin.OUT).value(0)
        Pin(PIN_BH1750_VCC, Pin.OUT).value(0)

    # 3. Guardar las muestras tomadas en el RTC RAM
    now_ts = utime.time()
    if temp is not None:
        rtc_data["temp"].append([now_ts, temp])
    if hum is not None:
        rtc_data["hum"].append([now_ts, hum])
    if lux is not None and should_sample_lux:
        rtc_data["lux"].append([now_ts, lux])

    # Limitar tamaño de seguridad de los arrays
    for key in ["temp", "hum", "lux"]:
        if len(rtc_data[key]) > 24:
            rtc_data[key] = rtc_data[key][-24:]

    # 4. Decidir transmisión o deepsleep
    samples_count = max(len(rtc_data["temp"]), len(rtc_data["lux"]))
    if DEBUG: print(f"📊 Muestras en buffer RTC: {samples_count}/{BATCH_SIZE}")

    is_top_of_hour = (dt[5] == 0) if is_clock_synced else False
    if samples_count >= BATCH_SIZE or (is_top_of_hour and samples_count > 0):
        if DEBUG: print("🚀 Límite de muestras o alineación horaria alcanzado. Iniciando transmisión asíncrona...")
        
        # Hidratar colas globales de RingBuffer para transmisión
        for ts, val in rtc_data["temp"]:
            temperature_Batch.append_raw(ts, val)
        for ts, val in rtc_data["hum"]:
            humidity_Batch.append_raw(ts, val)
        for ts, val in rtc_data["lux"]:
            illuminance_Batch.append_raw(ts, val)

        # Guardar de forma persistente en RTC antes de intentar conectar
        save_rtc_buffer(rtc_data)

        # Iniciar transmisión asíncrona
        try:
            asyncio.run(main_transmission())
        except KeyboardInterrupt:
            stopped_program()
        except Exception as e:
            if DEBUG: print(f"❌ Error fatal en main_transmission: {e}")
            safe_reset()
    else:
        # Guardar en RTC e ir a Deep Sleep
        save_rtc_buffer(rtc_data)
        
        # Calcular segundos para el próximo ciclo múltiplo de 5 min (300 segundos)
        sec_to_next = 300 - (utime.time() % 300)
        if sec_to_next < 30:
            sec_to_next += 300

        if DEBUG: print(f"💤 Ciclo finalizado. Entrando en Deep Sleep por {sec_to_next} segundos.")
        utime.sleep_ms(100) # Pausa breve para vaciar UART
        machine.deepsleep(sec_to_next * 1000)

# ---- Detener Programa (Ctrl+C) ----
def stopped_program():
    """
    #### Detener el programa desde la terminal (Ctrl+C)
    * Log de parada.
    * Publica 'offline' explícitamente para evitar latencias de LWT.
    """
    from utime import sleep_ms

    if DEBUG:
        print(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")

    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            flush_telemetry_batches()
            sleep_ms(500)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error en flush_telemetry_batches en stopped_program: {e}")

        try:
            # retain=True para que el estado persista en el broker tras el DISCONNECT.
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
            sleep_ms(500)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error publicando offline en stopped_program: {e}")

    # Invalidamos el cliente MQTT
    force_disconnect_mqtt(silent=False)

    # Desconectamos el WiFi.
    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            wlan.active(False)
            if DEBUG: print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

# ---- Detención Segura ----
def shutdown(status=b"offline"):
    from utime import sleep_ms
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            flush_telemetry_batches()
            sleep_ms(500)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error en flush_telemetry_batches en shutdown: {e}")
        try:
            client.publish(MQTT_TOPIC_STATUS, status, retain=True, qos=1)
            sleep_ms(500)
        except Exception as e:
            if DEBUG:
                print(f"⚠️  Error publicando {status.decode() if hasattr(status, 'decode') else status} en shutdown: {e}")
    force_disconnect_mqtt(silent=False)
    # Retardo de cortesía (300ms) para vaciado del buffer físico de red/SSL
    sleep_ms(300)
    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            wlan.active(False)
            if DEBUG: print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

def safe_reset():
    from machine import reset
    from utime   import sleep_ms
    try:
        shutdown()
    except: pass
    sleep_ms(1000)
    reset()

def main():
    run_cycle()

if __name__ == '__main__':
    run_cycle()

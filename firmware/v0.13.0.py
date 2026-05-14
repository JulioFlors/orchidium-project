# -----------------------------------------------------------------------------
# Relay Modules: Actuator Controller Firmware.
# Descripcion: Firmware dedicado para el control de las electrovalvulas, la bomba
#              y la estacion meteorologica exterior (lluvia e iluminancia).
# Fecha: 08-05-2026
# Version: v0.13.0
# notes_release: [🔥 MQTT Stabilization]: Parche SSL no-bloqueante en simple2.py, retry interno, timeout dual (handshake/operación), tolerancia MQTT-3 en telemetría.
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
# Timeout para operaciones normales (check_msg, ping, publish)
# Optimizado para fallar rápido y reintentar.
MQTT_SOCKET_TIMEOUT  = const(45) # seg (operación normal)
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


# ---- Tópicos MQTT Pre-calculados (Optimización de RAM) ----
# Usamos b"" (bytes) y constantes para evitar concatenación en tiempo de ejecución.

# ---- Sistema y Conectividad (Diagnóstico/LWT) ----
# [LWT/Status]: Indica si el dispositivo está "online" u "offline" (usado para Last Will).
MQTT_TOPIC_STATUS         = const(b"PristinoPlant/Actuator_Controller/status")

# [Audit Data]: Canal para streaming de datos unificados (RAM, NVS, Lux, rain, etc).
MQTT_TOPIC_AUDIT          = const(b"PristinoPlant/Actuator_Controller/audit")

# [Audit Flag]: Indica qué tareas de auditoría están activas internamente (para sincronización de UI).
MQTT_TOPIC_AUDIT_STATE    = const(b"PristinoPlant/Actuator_Controller/audit/state")


# ---- Control y Comandos (RPC/Feedback) ----
# [General Cmd]: Recibe comandos de sistema (reset, audit_on, etc).
MQTT_TOPIC_CMD            = const(b"PristinoPlant/Actuator_Controller/cmd")

# [Feedback]: Confirmación inmediata con el payload original de recepción de comando para la UI.
MQTT_TOPIC_CMD_RECEIVED   = const(b"PristinoPlant/Actuator_Controller/cmd/received")

# [Irrigation Cmd]: Recibe órdenes específicas de riego (circuitos, duraciones, estados).
MQTT_TOPIC_IRRIGATION_CMD = const(b"PristinoPlant/Actuator_Controller/irrigation/cmd")


# ---- Telemetría del Estado de los Relays ----
# [State Snapshot]: Publica el estado actual de TODOS los relés y sus IDs de tareas activas.
MQTT_TOPIC_STATE          = const(b"PristinoPlant/Actuator_Controller/irrigation/state")

# ---- Telemetría de la Estación Exterior (Weather Station) ----
# [Rain State]: Estado binario en tiempo real (Raining / Dry) con histéresis.
MQTT_TOPIC_RAIN_STATE     = const(b"PristinoPlant/Weather_Station/EXTERIOR/rain/state")

# [Rain Measurement]: Envío de fin de evento. Incluye duración (segundos) e intensidad promedio (%).
MQTT_TOPIC_RAIN_EVENT     = const(b"PristinoPlant/Weather_Station/EXTERIOR/rain/event")

# [Exterior Metrics]: Batch de lecturas ambientales (lux, lluvia, etc).
MQTT_TOPIC_EXTERIOR_METRICS = const(b"PristinoPlant/Weather_Station/EXTERIOR/readings")

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = const(b"lwt_disconnect")

# ---- Topología del Circuito de Riego (Edge Computing) ----
# Delay de cebado de la bomba (segundos). La bomba se enciende
# después de que las válvulas ya estén abiertas para evitar
# presurizar tuberías vacías.
PUMP_PRIME_DELAY = const(10)

# Mapa de circuitos: cada propósito de riego se descompone en
# una válvula fuente (source) y una línea de distribución (line).
# La bomba (pump) es implícita y se activa siempre.
IRRIGATION_CIRCUITS = {
    "IRRIGATION":     {"source": "main_water",   "line": "sprinkler"},
    "FERTIGATION":    {"source": "agrochemical", "line": "fertigation"},
    "FUMIGATION":     {"source": "agrochemical", "line": "fertigation"},
    "HUMIDIFICATION": {"source": "main_water",   "line": "fogger"},
    "SOIL_WETTING":   {"source": "main_water",   "line": "soil_wet"},
}

# ---- Hardware: Actuadores ----
# Diccionario que mapea un (actuator_id) a otro diccionario que contiene todos los atributos y el estado de ese actuador.
relays = {}

# ---- Hardware: Sensores ----
dht_sensor             = None # DHT22 (Temp + Humedad)
illuminance_sensor     = None # BH1750 (I2C)
rain_sensor_analog     = None # Sensor de gotas de lluvia (ADC)
i2c_bus                = None # Bus I2C global para diagnóstico
BH1750                 = None # Clase del driver del sensor de luz

# ---- Variables Globales de Estado ----
# Lista de temporizadores de riego activos
active_irrigation_timers = []

# Diccionario para rastrear tareas de encendido diferido
pending_start_tasks = {}

# Buffer de mensajes MQTT para el patrón Productor-Consumidor
mqtt_message_buffer = []

# Evento asíncrono para notificar cambios de estado de un actuador
state_changed = asyncio.Event()

# Diccionario de Sincronización para Auditorías Independientes
audit_events = {
    "lux":      asyncio.Event(),
    "rain":     asyncio.Event(),
    "ram":      asyncio.Event(),
    "health":   asyncio.Event(),
    "temp":     asyncio.Event(),
    "hum":      asyncio.Event()
}
# Evento maestro para despertar al Ticker Unificado de Auditoría
audit_master_event = asyncio.Event()

# Evento asíncrono para despertar a la tarea de procesamiento de mensajes MQTT
mqtt_msg_event = asyncio.Event()

# Evento asíncrono para despertar al gestor de temporizadores
timer_wake_event = asyncio.Event()

# Evento asíncrono para despertar a la corrutina de monitoreo de iluminancia
illuminance_wake_event = asyncio.Event()

# Candado asíncrono para evitar colisiones en el socket SSL
mqtt_lock = asyncio.Lock()

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# ---- Globales de Telemetría & Recuperación ----
last_rain_raw = 4095 # Última lectura cruda (Seco por defecto)
restored_rain_start_ticks = 0
restored_rain_state = 'Dry'
RAIN_TARGET_SAMPLES = const(10)

# Flag de control para la sincronización del monitoreo de iluminancia (Día/Noche)
# Si es False, se suspende el muestreo del sensor BH1750 para evitar registros de 0 lux.
# (Se inicializa en ON por defecto; el Scheduler sincronizará el estado real tras conectar)
IS_SAMPLING_LUX = True

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
    "rain": False,
    "lux": False,
    "health": False,
    "ram": False,
    "temp": False,
    "hum": False
}

# Funciones de Muestreo Unificadas para Auditoría (Lazy Reference)
def get_lux_sample():
    if illuminance_sensor:
        try: return round(illuminance_sensor.get_auto_luminance(), 1)
        except: return None
    return None

async def fetch_rain_raw():
    """Realiza el oversampling físico del sensor (10 muestras en 500ms)."""
    global rain_sensor_analog

    if rain_sensor_analog is None: return None
    
    try:
        raw_sum = 0
        valid_samples = 0
        for _ in range(RAIN_TARGET_SAMPLES):
            try:
                raw_sum += rain_sensor_analog.read()
                valid_samples += 1
            except: pass
            await asyncio.sleep_ms(50)
        
        return int(raw_sum / valid_samples) if valid_samples > 0 else None
    except:
        return None

async def get_rain_sample():
    """Auditoría bajo demanda: Realiza una lectura fresca."""
    global last_rain_raw

    val = await fetch_rain_raw()
    if val is not None:
        last_rain_raw = val
    return last_rain_raw

def get_health_sample():
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
        dht_sensor.measure()
        return (round(dht_sensor.temperature(), 1), round(dht_sensor.humidity(), 1))
    except: return None

AUDIT_SAMPLE_FNS = {
    "lux":      get_lux_sample,
    "rain":     get_rain_sample,
    "health":   get_health_sample,
    "ram":      get_ram_sample,
    "temp":     get_dht_sample,
    "hum":      get_dht_sample
}

# Contadores para el Auto-Apagado de auditorías (RAM)
AUDIT_COUNTERS = {
    "rain": 0,
    "lux": 0,
    "health": 0,
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

# Buffers de Telemetría (RingBuffer)
illuminance_Batch = RingBuffer(10)
rain_Batch        = RingBuffer(10)
temperature_Batch = RingBuffer(10)
humidity_Batch    = RingBuffer(10)

# ---- Función Auxiliar: NVS Manager (Gestión de Estado Persistente optimizada con Caché) ----
class NVSManager:
    """Gestiona el guardado de tareas protegiendo la memoria Flash mediante Caché en RAM."""
    FILE_PATH = "recovery.json"
    _cache = None  # Almacena el diccionario en RAM para acceso instantáneo
    _dirty = False # Bandera (True) si la caché tiene cambios que no se han guardado en Flash

    @classmethod
    def _load_cache(cls):
        """Carga el archivo del disco a la RAM solo la primera vez que se necesita."""
        if cls._cache is None:
            try:
                # (Optimización de memoria RAM)
                # Lazy Imports (Importación tardía)
                from os    import listdir # type: ignore
                from ujson import load    # type: ignore
                if cls.FILE_PATH in listdir():
                    with open(cls.FILE_PATH, "r") as f:
                        cls._cache = load(f)
                else:
                    cls._cache = {}
            except Exception as e:
                if DEBUG:
                    print(f"\n⚠️  Error leyendo NVS: {e}")
                cls._cache = {}

    @classmethod
    def load_tasks(cls):
        """Devuelve el estado actual de las tareas desde la caché rápida."""
        cls._load_cache()
        return cls._cache

    @classmethod
    def save_task(cls, task_data):
        """Agrega o actualiza una tarea en la Caché RAM y levanta la bandera de escritura."""
        cls._load_cache()
        key = task_data.get('key')
        if key is None:
            key = str(task_data['actuator_id'])
        cls._cache[key] = task_data
        cls._dirty = True # Hay cambios pendientes de guardar a disco
        # if DEBUG:
            # print(f"    ├─ Caché NVS: Tarea {key} encolada.") # 🔇 Comentado

    @classmethod
    def clear_task(cls, actuator_id=None):
        """Elimina tareas de la Caché RAM y levanta la bandera de escritura."""
        cls._load_cache()
        
        # Si piden borrar todo el registro
        if actuator_id is None:
            if cls._cache:
                cls._cache = {}
                cls._dirty = True
            return

        str_id = str(actuator_id)
        modified = False
        
        # Intentamos borrar la tarea normal y la diferida (_pending)
        for k in [str_id, f"{str_id}_pending"]:
            if k in cls._cache:
                del cls._cache[k]
                modified = True
        
        if modified:
            cls._dirty = True
            # if DEBUG:
                # print(f"    ├─ Caché NVS: Tarea {str_id} removida.") # 🔇 Comentado

    @classmethod
    def delete_key(cls, key):
        """Borra una key literal específica de la Caché."""
        cls._load_cache()
        if key in cls._cache:
            del cls._cache[key]
            cls._dirty = True

    @classmethod
    def clear_all_irrigation_tasks(cls):
        """Limpia SOLO las tareas de riego (activas o pendientes) sin tocar la config del sistema."""
        cls._load_cache()
        if not cls._cache: return
        
        # Filtramos las llaves que corresponden a riego
        keys_to_delete = [
            k for k, v in cls._cache.items() 
            if v.get("type") in ["irrigation_run", "delayed_start"]
        ]
        
        if keys_to_delete:
            for k in keys_to_delete:
                del cls._cache[k]
            cls._dirty = True
            # if DEBUG:
                # print(f"    ├─ NVS: {len(keys_to_delete)} tareas de riego eliminadas.")

    @classmethod
    def flush(cls):
        """Vuelca la Caché RAM hacia la memoria Flash física SOLO si hubo cambios."""
        if not cls._dirty:
            return # Ahorramos un ciclo de escritura física en disco

        try:
            from os    import remove # type: ignore
            from ujson import dump   # type: ignore
            if not cls._cache:
                # Si la caché quedó vacía, borramos el archivo físico para ahorrar espacio
                try: remove(cls.FILE_PATH)
                except: pass
                # if DEBUG:
                    # print(f"    └─ 📁 File NVS {Colors.GREEN}Eliminado (Vacío){Colors.RESET}") # 🔇 Comentado
            else:
                # Escribimos el diccionario consolidado de una sola vez
                with open(cls.FILE_PATH, "w") as f:
                    dump(cls._cache, f)
                # if DEBUG:
                    # print(f"    └─ 💾 NVS Flush: {len(cls._cache)} tareas consolidadas en Flash.") # 🔇 Comentado
            
            # Limpiamos la bandera ya que estamos sincronizados con el disco
            cls._dirty = False
        except Exception as e:
            if DEBUG:
                print(f"\n⚠️  Error en Flush NVS: {e}")

    @classmethod
    def prepare_reset_backup(cls):
        """Prepara el backup calculando tiempos restantes justo antes de un reinicio."""
        # Gestión de variables globales
        global active_irrigation_timers

        if not active_irrigation_timers: return

        # (Optimización de memoria RAM)
        # Lazy Imports (Importación tardía)
        from utime import time # type: ignore

        current_time = time()
        
        cls._load_cache()
        
        for actuator_id, end_time in active_irrigation_timers:
            remaining = end_time - current_time
            if remaining > 60:
                str_id = str(actuator_id)
                
                # Modificamos la tarea en caché para marcarla como PAUSADA (0)
                if str_id in cls._cache:
                    task = cls._cache[str_id]
                    task['start_epoch'] = 0 
                    task['duration'] = int(remaining)
                    task['saved_at_epoch'] = int(current_time)
                    cls._cache[str_id] = task
                    cls._dirty = True

                    # if DEBUG:
                        # print(f"💾  Backup Creado: ID:{actuator_id} Restan:{int(remaining)}s") # 🔇 Comentado
        
        # Forzamos la escritura física inmediatamente porque el sistema está muriendo
        cls.flush()

# ---- Función Auxiliar: Sincronizar Estado de RAM (Audit Mode) ----
async def publish_audit_state():
    """Publica el estado de AUDIT_MODE usando formateo de strings para ahorrar RAM."""
    try:
        # Sincronización MQTT con validación de socket
        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            # Mapeo de estados de auditoría a strings JSON
            rain_on   = "true" if AUDIT_MODE["rain"]   else "false"
            lux_on    = "true" if AUDIT_MODE["lux"]    else "false"
            health_on = "true" if AUDIT_MODE["health"] else "false"
            ram_on    = "true" if AUDIT_MODE["ram"]    else "false"
            temp_on   = "true" if AUDIT_MODE["temp"]   else "false"
            hum_on    = "true" if AUDIT_MODE["hum"]    else "false"

            # Mapeo de presencia de hardware
            hw_lux  = "true" if illuminance_sensor  else "false"
            hw_rain = "true" if rain_sensor_analog  else "false"
            hw_dht  = "true" if dht_sensor          else "false"

            # Construcción manual de JSON: Mucho más eficiente que dumps() para dicts anidados
            # El orden de los argumentos debe coincidir exactamente con los marcadores %s
            payload = '{"rain":%s,"lux":%s,"health":%s,"ram":%s,"temp":%s,"hum":%s,"lux_hw":%s,"rain_hw":%s,"temp_hw":%s,"hum_hw":%s}' % (
                rain_on, lux_on, health_on, ram_on, temp_on, hum_on,
                hw_lux, hw_rain, hw_dht, hw_dht
            )

            from umqtt.simple2 import MQTTException # type: ignore
            try:
                # 🔒 Pedimos permiso para usar el socket
                async with mqtt_lock:
                    # [Escudo de Concurrencia]: Previene AttributeError si otra tarea 
                    # invalidó el cliente durante la espera del lock.
                    if client and getattr(client, 'sock', None):
                        # Publicamos directo (MQTT convierte string a bytes)
                        client.publish(MQTT_TOPIC_AUDIT_STATE, payload, retain=False, qos=0)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo sincronización estado auditoría", e)
                # Invalidamos el cliente para que el loop principal detecte el fallo
                force_disconnect_mqtt()
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


# ---- Función Auxiliar: Safe Reset (Reinicio Seguro) ----
def safe_reset():
    """Cierra conexiones de red, Guarda el estado de las tareas activas en NVS y reinicia el dispositivo."""
    from machine import reset # type: ignore
    from utime   import sleep_ms

    try:
        # 1. Guardamos el estado de las válvulas para que sobrevivan al reinicio
        NVSManager.prepare_reset_backup()
        # 2. Nos desconectamos educadamente del Router y del Broker
        shutdown()
    except: pass

    sleep_ms(1000) # Pausa de estabilización pre-reset
    reset()

# ---- Función Auxiliar: Boot Recovery (Recuperación Inteligente) ----
async def boot_recovery_check():
    """
    Verifica si hubo un reinicio durante una tarea activa.
    Restaura el estado solo si está dentro de la ventana de oportunidad.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import localtime, ticks_ms, time # type: ignore

    # Ventanas de oportunidad para recuperación tras reinicio
    IRRIGATION_RECOVERY_WINDOW = 1200 # 20 min
    RAIN_RECOVERY_WINDOW       = 600  # 10 min (Alineado con Scheduler)

    if DEBUG:
        print(f"\n🔍  {Colors.BLUE}Verificando NVS Recovery{Colors.RESET}")

    # ---- Restaurar Tareas de Riego ----
    all_tasks = NVSManager.load_tasks()
    task_count = len(all_tasks)

    if task_count <= 0:
        if DEBUG:
            print(f"    └─ Tareas de Riego: {Colors.GREEN}No hay tareas pendientes{Colors.RESET}")
        return

    if DEBUG:
        print(f"    ├─ Tareas Encontradas: {Colors.YELLOW}{task_count}{Colors.RESET}")

    # Validamos que tengamos hora válida (Año > 2025)
    # Si no hay hora, NO PODEMOS arriesgarnos a regar.
    current_time = time()
    current_year = localtime()[0]

    if current_year < 2026:
        if DEBUG:
            print(f"    └─ ⚠️  Error: {Colors.RED}No se pudo sincronizar la Hora del Sistema{Colors.RESET}.")
            print(f"        └─ Cancelando recuperación de Riego por seguridad.")
        
        # [🛡️ SEGURIDAD]: Solo limpiamos tareas de riego, NO la configuración global.
        NVSManager.clear_all_irrigation_tasks()
        NVSManager.flush()
        return

    # ---- Análisis Temporal (Iterando todas las tareas) ----
    # 2026-Fix: Iteramos sobre los values del diccionario
    for task_data in all_tasks.values():
        # 🛡️ EXCLUSIÓN: Ignorar configuraciones de sistema (no hay otra logica activa)
        # dentro de la lógica de restauración de actuadores.
        if task_data.get("type") == "system_config":
            continue
            
        start_epoch = task_data.get("start_epoch", 0)
        duration = task_data.get("duration", 0)
        actuator_id = task_data.get("actuator_id")
        task_id = task_data.get("task_id", "")
        
        # ---- Caso C: Tarea Pendiente (Diferida) ----
        if "_pending" in str(actuator_id) or task_data.get("type") == "delayed_start":
            real_actuator_id = int(str(actuator_id).replace("_pending", ""))
            target_start = task_data.get("target_start_epoch", 0)
            delay_remaining = target_start - current_time
            
            if delay_remaining > 0:
                if DEBUG:
                    print(f"    ├─ {Colors.CYAN}RESTAURANDO DIFERIDO{Colors.RESET} ID:{real_actuator_id}")
                    print(f"    │   └─ Esperar: {delay_remaining}s")

                if real_actuator_id in relays:
                    target_relay = relays[real_actuator_id]
                    duration = task_data.get("duration", 0)
                    
                    # Relanzamos la tarea diferida
                    task = asyncio.create_task(
                        delayed_start_task(target_relay, real_actuator_id, delay_remaining, duration, task_id)
                    )
                    pending_start_tasks[real_actuator_id] = task
                else:
                    NVSManager.clear_task(real_actuator_id)
            else:
                # Si ya pasó el tiempo de espera ¿Debería arrancar?
                # Asumimos que si expiró hace poco (dentro de ventana), arranca YA.
                # Si expiró hace horas, se ignora.
                time_failed_start = current_time - target_start
                if time_failed_start < IRRIGATION_RECOVERY_WINDOW:
                    if DEBUG:
                        print(f"    ├─ {Colors.GREEN}EJECUTANDO DIFERIDO ATRASADO{Colors.RESET} ID:{real_actuator_id}")
                    if real_actuator_id in relays:
                        target_relay = relays[real_actuator_id]
                        duration = task_data.get("duration", 0)
                        # Arrancamos inmediatamente (delay=0)
                        task = asyncio.create_task(
                            delayed_start_task(target_relay, real_actuator_id, 0, duration, task_id)
                        )
                        pending_start_tasks[real_actuator_id] = task
                else:
                    if DEBUG:
                        print(f"    └─ 🗑️  {Colors.YELLOW}Diferido Vencido{Colors.RESET} ID{real_actuator_id}")
                    NVSManager.clear_task(real_actuator_id)

            continue

        expected_end = start_epoch + duration
        
        remaining_time = expected_end - current_time
        
        # [Smart Recovery] Caso E: Tarea Pausada (start_epoch == 0)
        # Significa que se guardó el "remaining" en "duration" antes de un reset.
        if start_epoch == 0:
            # [Smart Recovery Fix] Verificación de ventana de oportunidad
            # Si el corte duró demasiado, no reanudamos.
            saved_at_epoch = task_data.get('saved_at_epoch', 0)
            
            if saved_at_epoch > 0:
                elapsed_offline = current_time - saved_at_epoch
                 
                # Si estuvo apagado demasiado tiempo (más de 20 min), se cancela.
                if elapsed_offline > IRRIGATION_RECOVERY_WINDOW:
                    if DEBUG:
                        print(f"    └─ 🗑️  {Colors.YELLOW}Tarea Pausada (Vencida){Colors.RESET} ID:{actuator_id} (Offline: {elapsed_offline}s)")
                    if actuator_id in relays:
                        relays[actuator_id]['task_id'] = ""
                    NVSManager.clear_task(actuator_id)
                    continue
            
            if DEBUG:
                print(f"    ├─ {Colors.GREEN}REANUDANDO PAUSA{Colors.RESET} ID:{actuator_id}")
                print(f"    │   └─ Restante: {duration}s")
            
            # Restaurar Relé
            if actuator_id in relays:
                target_relay = relays[actuator_id]
                target_relay['pin'].value(1) # ON
                target_relay['state'] = 'ON'
                target_relay['task_id'] = task_id
                state_changed.set()
                
                # Reprogramar Timer (Ahora + Duración guardada)
                active_irrigation_timers.append((actuator_id, current_time + duration))
                if DEBUG:
                    print(f"    └─ Actuador: {target_relay['name']} -> ON")
                
                # ACTUALIZAMOS NVS con el nuevo tiempo real para que si se corta la luz AHORA,
                # la lógica normal funcione (Caso A).
                # start_epoch = current, duration = same
                task_data['start_epoch'] = int(current_time)
                try: 
                    NVSManager.save_task(task_data)
                    if DEBUG: print(f"    │   └─ NVS: Tarea re-actualizada con nuevo inicio.")
                except: pass
                
            else:
                NVSManager.clear_task(actuator_id)

            continue # Salta el resto de la lógica para este task

        # [Smart Recovery] Casos de Riego (A y B)
        elif task_data.get("type") in ["irrigation_run", "delayed_start"]:
            # 1. Definimos el Fin Teórico y el Fin de la Ventana de Gracia
            if start_epoch == 0:
                # Caso Software Reset: El nodo guardó el backup calculando el remanente
                saved_at = task_data.get('saved_at_epoch', 0)
                theoretical_end = saved_at + duration
                grace_end = theoretical_end + IRRIGATION_RECOVERY_WINDOW
                remanente_real = duration # Lo que el NVS dice que faltaba físicamente
            else:
                # Caso Hard Reset: Solo tenemos el plan original (inicio + duración)
                theoretical_end = start_epoch + duration
                grace_end = theoretical_end + IRRIGATION_RECOVERY_WINDOW
                remanente_real = theoretical_end - current_time # Lo que falta del reloj

            # 2. Decisión de Recuperación Elástica
            if current_time < grace_end:
                # [🛡️ Protección de Stress]: Si el remanente es negativo o muy corto, descartar
                if remanente_real < 60:
                    if DEBUG:
                        msg = "Expirada" if remanente_real <= 0 else "Insignificante"
                        print(f"    └─ 🗑️  {Colors.YELLOW}Tarea {msg}{Colors.RESET} ID:{actuator_id} ({remanente_real}s)")
                    if actuator_id in relays:
                        relays[actuator_id]['task_id'] = ""
                    NVSManager.clear_task(actuator_id)
                    continue

                if DEBUG:
                    status_text = "RECUPERANDO" if (start_epoch == 0 or current_time < theoretical_end) else "RECUPERACIÓN ELÁSTICA (ATRASADA)"
                    print(f"    ├─ {Colors.GREEN}{status_text}{Colors.RESET} ID:{actuator_id}")
                    print(f"    │   └─ Reanudando físicamente por: {remanente_real}s")
                
                # Restaurar Relé
                if actuator_id in relays:
                    target_relay = relays[actuator_id]
                    target_relay['pin'].value(1) # ON
                    target_relay['state'] = 'ON'
                    target_relay['task_id'] = task_id
                    state_changed.set()
                    
                    # Reprogramar Timer
                    active_irrigation_timers.append((actuator_id, current_time + remanente_real))
                    if DEBUG:
                        print(f"    └─ Actuador: {target_relay['name']} -> ON")
                else:
                    if DEBUG:
                        print(f"    └─ ⚠️  Error: Actuador {actuator_id} no encontrado.")
                    NVSManager.clear_task(actuator_id)

            # Caso C: Tarea Expirada (Fuera de los 20 min de gracia)
            else:
                if DEBUG:
                    print(f"    └─ 🗑️  {Colors.YELLOW}Tarea Expirada{Colors.RESET} ID:{actuator_id} (Fuera de ventana de gracia)")
                if actuator_id in relays:
                    relays[actuator_id]['task_id'] = ""
                NVSManager.clear_task(actuator_id)

        # [Smart Recovery] Caso F: Evento de Lluvia Activo
        elif task_data.get("type") == "rain_event":
            start_epoch = task_data.get("start_epoch", 0)
            if start_epoch > 0:
                elapsed = current_time - start_epoch
                # Si la desconexión fue breve (menos de 10 min), reanudamos.
                if elapsed < RAIN_RECOVERY_WINDOW:
                    global restored_rain_start_ticks, restored_rain_state
                    restored_rain_start_ticks = ticks_ms() - (int(elapsed) * 1000)
                    restored_rain_state = 'Raining'
                    if DEBUG:
                        print(f"    ├─ {Colors.CYAN}REANUDANDO LLUVIA{Colors.RESET} Iniciada hace {int(elapsed)}s")
                else:
                    if DEBUG:
                        print(f"    └─ 🗑️  {Colors.YELLOW}Evento de Lluvia Expirado{Colors.RESET} (Offline: {elapsed}s)")
                    # ---- Limpieza de Bitácora (NVS) ----
                    NVSManager.delete_key("rain_event")

    # ---- Escritura Física en Disco ----
    # Guardamos los nuevos tiempos recalibrados y las tareas expiradas eliminadas
    NVSManager.flush()

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
        
        # Mapeo Local
        error_map = {
            -1: "Error Desconocido", 
            1:  "Conn Reset (El router o servidor cortó la conexión de golpe)", 
            2:  "Error de Lectura (Datos incompletos por caída de red)", 
            3:  "Corte de Red (No se pudo terminar de enviar la información al servidor)", 
            4:  "Mensaje muy largo (Supera el límite de memoria permitido)", 
            5:  "PID Mismatch (Desincronización de mensajes con el servidor)",
            28: "Sin Conexión (El ESP32 no detecta acceso a la red)", 
            29: "Respuesta Inválida (El servidor MQTT respondió datos corruptos)", 
            30: "Timeout (El servidor tardó demasiado en responder)",
            20: "Rechazado (El servidor MQTT denegó la conexión)", 
            21: "Versión MQTT Incompatible", 
            22: "ID de Cliente Rechazado",
            23: "Servidor MQTT No Disponible (Apagado o reiniciándose)", 
            24: "Credenciales MQTT Incorrectas (Revisa el Usuario/Contraseña)", 
            25: "No Autorizado (El usuario no tiene permisos en el servidor MQTT)",
            40: "Error de Suscripción (Tópico denegado)", 
            44: "Suscripción Rechazada"
        }
        
        msg = error_map.get(code, f"Error desconocido ({code})")
        print(f"\n❌  {context}: {Colors.RED}[MQTT-{code}] {msg}{Colors.RESET}\n")
        del error_map
    
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

# ---- Función Auxiliar: Inicializar Relays ----
def setup_relays():
    """Inicializa los pines físicos y el mapa de actuadores en RAM."""
    # Gestión de variables globales
    global relays

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from machine import  Pin # type: ignore

    # Diccionario que contiene todos los atributos y el estado de cada actuador.
    # Pin(X, Pin.OUT, value=0) -> activo-HIGH, inicia apagado
    relays = {
        1: {
            'name':  'main_water',
            'pin':   Pin(13, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },
        2: {
            'name':  'agrochemical',
            'pin':   Pin(14, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },
        3: {
            'name':  'pump',
            'pin':   Pin(27, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },
        4: {
            'name':  'fogger',
            'pin':   Pin(26, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },

        5: {
            'name':  'fertigation',
            'pin':   Pin(25, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },

        6: {
            'name':  'sprinkler',
            'pin':   Pin(33, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },

        7: {
            'name':  'soil_wet',
            'pin':   Pin(32, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'task_id': ''
        },
    }

# ---- Función Auxiliar: Inicializar Sensores ----
def setup_sensors():
    """Inicializa los sensores cableados al nodo actuador de forma segura."""
    # Gestión de variables globales
    global dht_sensor, illuminance_sensor, rain_sensor_analog, i2c_bus, BH1750

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from machine import ADC, I2C, Pin, SoftI2C # type: ignore
    from utime import sleep_ms # type: ignore

    # 0. Sensor DHT22
    try:
        from dht import DHT22 # type: ignore
        # Activamos PULL_UP interno por software para estabilizar la señal en cables largos
        dht_pin = Pin(23, Pin.IN, Pin.PULL_UP)
        dht_test = DHT22(dht_pin)
        
        if DEBUG:
            print(f"\n🌡️  Conectando {Colors.YELLOW}DHT22{Colors.RESET}")

        # Bucle de reintentos (Máximo 5 intentos de inicialización)
        dht_success = False
        for attempt in range(1, 6):
            if attempt > 1:
                if DEBUG: print(f"    ├─ 🔄 Reintentando ({attempt}/5)")

            try:
                sleep_ms(2000) # Estabilización del sensor
                dht_test.measure()
                temp = dht_test.temperature()
                hum  = dht_test.humidity()

                # Validación de rango físico razonable (descarta pines flotantes)
                if -10 < temp < 60 and 0 < hum < 100:
                    dht_sensor = dht_test
                    dht_success = True
                    if DEBUG:
                        print(f"    ├─ ✅ {Colors.GREEN}Conectado{Colors.RESET}")
                        print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                        print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
                    break # Éxito, salimos del bucle
                else:
                    if DEBUG:
                        print(f"    ├─ ❌ {Colors.RED}Fuera de rango{Colors.RESET}")
                        print(f"    ├─ 📊 Valor: {Colors.YELLOW}{temp:.1f} °C{Colors.RESET}")
                        print(f"    └─ 📊 Valor: {Colors.BLUE}{hum:.1f} %{Colors.RESET}")
            except Exception as e:
                if attempt == 5: raise # Si falla el último intento, propagamos el error
                
                # [Software Fix para Cables Largos]: 
                # Forzamos la línea a HIGH fuertemente para limpiar capacitancia parásita
                # y "destrabar" el bus de datos del DHT22 antes del próximo sleep_ms(2000).
                try:
                    dht_pin.init(Pin.OUT)
                    dht_pin.value(1)
                except: pass
                
                continue # Reintentar silenciosamente
        
        if not dht_success:
            dht_sensor = None

    except Exception as e:
        if DEBUG:
            # Error 116 (ETIMEDOUT) suele indicar que el sensor no está conectado físicamente
            if isinstance(e, OSError) and e.args and e.args[0] == 116:
                print(f"    └─ ❌ {Colors.RED}Desconectado (Timeout){Colors.RESET}")
            else:
                print(f"    └─ ❌ {Colors.RED}Fallo tras reintentos: {e}{Colors.RESET}")
        dht_sensor = None

    # 1. Sensor de Iluminancia (BH1750 / I2C)
    # [Diagnóstico Exhaustivo]: Prueba múltiples configuraciones, SoftI2C y Hardware I2C.
    try:
        # Direcciones I2C estándar del BH1750
        addr = 0x23 
        sensor_connected = False

        # Configuraciones de bus: (tipo_bus, freq_hz, timeout_us, label)
        # Probamos primero Hardware I2C y luego SoftI2C si el primero falla.
        BUS_CONFIGS = [
            ("hw",   100000,   0,       "Hardware I2C"),
            ("soft", 50000,    200000,  "SoftI2C Robusto"),
            ("soft", 10000,    500000,  "SoftI2C Lento (10m)"),
        ]

        if DEBUG:
            print(f"\n☀️  Conectando {Colors.YELLOW}BH1750{Colors.RESET}")

        for i, (bus_type, freq, timeout, label) in enumerate(BUS_CONFIGS):
            if sensor_connected:
                break

            # Determinar prefijo inteligente
            is_last = (i == len(BUS_CONFIGS) - 1)
            prefix = "    └─" if is_last else "    ├─"

            try:
                # Crear bus
                if bus_type == "soft":
                    i2c_bus = SoftI2C(scl=Pin(22), sda=Pin(21), freq=freq, timeout=timeout)
                else:
                    i2c_bus = I2C(0, scl=Pin(22), sda=Pin(21), freq=freq)

                sleep_ms(150) # Settle time

                # Intento de comunicación directa
                i2c_bus.writeto(addr, b'')

                # Importar driver e instanciar
                try:
                    from bh1750 import BH1750 # type: ignore
                except ImportError:
                    if DEBUG: print(f"{prefix} ❌ Error: no se encontró bh1750.py")
                    return

                illuminance_sensor = BH1750(bus=i2c_bus, addr=addr)
                sleep_ms(200)
                lux_test = round(illuminance_sensor.get_auto_luminance(), 1)

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

    # 2. Sensor de Lluvia (Salida Analógica)
    try:
        if DEBUG: print(f"\n💧  Conectando {Colors.BLUE}Sensor de Lluvia{Colors.RESET}")

        adc_rain = ADC(Pin(35))
        adc_rain.atten(ADC.ATTN_11DB) # Rango 0-3.3V
        
        # [Oversampling Robusto]: Tomamos 10 muestras para descartar ruido y absorber fallos del ADC
        raw_sum = 0
        valid_samples = 0
        for _ in range(10):
            try:
                raw_sum += adc_rain.read()
                valid_samples += 1
            except Exception:
                pass
            sleep_ms(50)

        if valid_samples == 0:
            if DEBUG: print(f"    └─ ❌ {Colors.RED}Desconectado{Colors.RESET} (Fallo lectura ADC)")
            rain_sensor_analog = None
        else:
            r_avg = raw_sum // valid_samples
            
            # Validación Inicial (Sondeo):
            # El sensor SECO debería leer 4095.
            # El sensor con LLUVIA Residual o Garuando puede leer entre 3000 y 3300
            if r_avg > 1400:
                rain_sensor_analog = adc_rain
                if DEBUG:
                    print(f"    ├─ ✅ {Colors.GREEN}Conectado{Colors.RESET}")
                    print(f"    └─ 📊 Valor: {Colors.BLUE}{r_avg}{Colors.RESET}")
            else:
                if DEBUG:
                    print(f"    ├─ ❌ {Colors.RED}Desconectado{Colors.RESET}")
                    print(f"    └─ 📊 Valor: {Colors.BLUE}{r_avg}{Colors.RESET}")
                rain_sensor_analog = None

    except Exception as e:
        if DEBUG: print(f"    └─ ❌ Exception: {Colors.RED}{e}{Colors.RESET}")
        rain_sensor_analog = None

# ---- Función Auxiliar: Callback de estado ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""
    if not DEBUG: return

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
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
    global mqtt_message_buffer, AUDIT_MODE, illuminance_sensor

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc    import collect
    from ujson import dumps, loads # type: ignore
    from umqtt.simple2 import MQTTException # type: ignore

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

            # Análisis del Payload (JSON vs TEXTO) -loads soporta bytes nativamente-
            try:
                parsed_json = loads(msg)
                type_label = "JSON"
            except:
                parsed_json = None
                type_label = "TEXT"

            if DEBUG:
                # Decodificación tardía para ahorrar RAM en producción
                topic_str = topic.decode('utf-8')
                msg_str = msg.decode('utf-8')
                header = f"\n📡  {Colors.BLUE}Procesando{Colors.RESET}"
                if retained: header += f" {Colors.YELLOW}[Retained]{Colors.RESET}"
                if dup:      header += f" {Colors.MAGENTA}[Duplicate]{Colors.RESET}"

                print(header)
                print(f"    ├─ Tópico: {Colors.GREEN}{topic_str}{Colors.RESET}")
                print(f"    ├─ {type_label}:   {Colors.BLUE}{msg_str}{Colors.RESET}")
                del topic_str, msg_str

            # ---- ACUSE DE RECIBO (ACK) ----
            # Hacemos eco del comando crudo (raw) para el Scheduler y el Frontend
            try:
                if client and wlan and wlan.isconnected():
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        # [Escudo de Concurrencia]: Validación de socket post-await
                        if client and getattr(client, 'sock', None):
                            client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=1)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo en el ACK del comando", e)
                force_disconnect_mqtt()
            except Exception: pass

            # ---- 🛡️ Lógica del Sistema de Comandos (/cmd) ----
            if topic == MQTT_TOPIC_CMD:
                # Pre-procesamiento de mensaje para ahorrar RAM y ciclos
                m_low = msg.lower()

                # 1. Comando: RESET
                if m_low == b"reset":
                    if DEBUG: print(f"    └─ Acción: {Colors.CYAN}Reboot the Device{Colors.RESET}")
                    try:
                        # Sincronización MQTT con validación de socket
                        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                            try:
                                # 🔒 Pedimos permiso para usar el socket
                                async with mqtt_lock:
                                    client.publish(MQTT_TOPIC_STATUS, b"rebooting", retain=True, qos=1)
                            except (MQTTException, OSError) as e:
                                if DEBUG: log_mqtt_exception("Fallo publicación estado reinicio", e)
                                force_disconnect_mqtt()
                                await check_critical_mqtt_errors(e)
                                await asyncio.sleep(2)
                        collect()
                    except Exception: pass
                    if DEBUG: print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}")
                    from utime import sleep # type: ignore
                    sleep(3) # Pausa breve para flush de logs
                    safe_reset()

                # 2. Comando: audit_nvs (Dump recovery.json por Chunks)
                if m_low == b"audit_nvs":
                    if DEBUG: print(f"    └─ Acción: {Colors.CYAN}Dump NVS Content (Chunked){Colors.RESET}")
                    try:
                        tasks = NVSManager.load_tasks()
                        
                        # ---- CASO A: NVS Vacío ----
                        if not tasks:
                            if client and wlan and wlan.isconnected():
                                # 🔒 Pedimos permiso para usar el socket
                                async with mqtt_lock:
                                    client.publish(MQTT_TOPIC_AUDIT, dumps({"nvs": {"chunk":1,"total":1,"data":{}}}).encode('utf-8'), qos=0)
                            if DEBUG: print("    └─ 📁 NVS Vacío enviado.")
                        
                        # ---- CASO B: NVS con Tareas (Paginación) ----
                        else:
                            keys = list(tasks.keys())
                            chunk_size = 3 # Máximo 3 tareas por mensaje
                            total_chunks = (len(keys) + chunk_size - 1) // chunk_size
                            
                            for i in range(total_chunks):
                                # 1. Extraemos las llaves correspondientes a esta "página"
                                chunk_keys = keys[i * chunk_size : (i + 1) * chunk_size]
                                
                                # 2. Construimos el sub-diccionario solo con esas tareas
                                chunk_data = {k: tasks[k] for k in chunk_keys}
                                
                                # 3. Empaquetamos el JSON final (consolidado en 'nvs' para AUDIT)
                                payload_nvs = dumps({"nvs": {"chunk": i + 1, "total": total_chunks, "data": chunk_data}})
                                
                                # Sincronización MQTT con validación de socket
                                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                                    # 🔒 Pedimos permiso para usar el socket
                                    async with mqtt_lock:
                                        client.publish(MQTT_TOPIC_AUDIT, payload_nvs.encode('utf-8'), qos=0)
                                
                                if DEBUG: print(f"    └─ 📦 Chunk {i + 1}/{total_chunks} enviado.")
                                
                                # ---- 5. Limpieza Agresiva de RAM (CRÍTICO) ----
                                del payload_nvs, chunk_data, chunk_keys
                                collect()
                                
                                # 6. Pausa para no saturar el buffer TCP del ESP32 ni al Broker
                                await asyncio.sleep_ms(150)
                                
                            # Limpieza final tras enviar todos los chunks
                            del keys, tasks
                            collect()

                    except (MQTTException, OSError) as e:
                        if DEBUG: log_mqtt_exception("Error de red en Auditoría NVS", e)
                        # No invalidamos el cliente desde aquí. Dejamos que el loop principal lo detecte.
                        await asyncio.sleep(5)
                    except Exception as e:
                        if DEBUG: print(f"    └─ ⚠️  Error enviando NVS: {e}")

                # 3. Comandos de Auditoría (Prefix: audit_)
                if m_low.startswith(b"audit_") and m_low.endswith((b"_on", b"_off")):
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
                                    if category in audit_events:
                                        audit_events[category].set()
                                    
                                    if was_asleep:
                                        audit_master_event.set()
                                    
                                    if DEBUG: print(f"    └─ AUDIT {category.upper()}: {Colors.GREEN}ON{Colors.RESET}")
                                else:
                                    if DEBUG: print(f"    └─ AUDIT {category.upper()}: Ya está {Colors.GREEN}ON{Colors.RESET}")
                            elif action == b"off":
                                AUDIT_MODE[category] = False
                                if category in audit_events:
                                    audit_events[category].clear() # Detenemos la corrutina específica

                                collect()
                                if DEBUG: print(f"    └─ AUDIT {category.upper()}: {Colors.RED}OFF{Colors.RESET}")
                            
                            await publish_audit_state()

                        del category, action
                    del parts

                # 4. Muestreo Inteligente (Prefix: lux_sampling:)
                if m_low.startswith(b"lux_sampling:"):
                    parts = m_low.split(b":")
                    if len(parts) == 2:
                        action = parts[1]
                        global IS_SAMPLING_LUX
                        
                        if action == b"on":
                            if DEBUG: print(f"    └─ Bh1750: {Colors.GREEN}ON{Colors.RESET}")
                            IS_SAMPLING_LUX = True
                            illuminance_wake_event.set()
                        elif action == b"off":
                            if DEBUG: print(f"    └─ Bh1750: {Colors.RED}OFF{Colors.RESET}")
                            IS_SAMPLING_LUX = False
                            illuminance_wake_event.clear()
                            # Al apagar, limpiamos el buffer para no arrastrar basura de 0 lux
                            illuminance_Batch.clear()
                        
                        del action
                    del parts

                # Cierre de bloque de comandos y limpieza de RAM
                del m_low

            # ---- 💦 Lógica de Riego (irrigation/cmd) ----
            if topic == MQTT_TOPIC_IRRIGATION_CMD and parsed_json:
                try:
                    data = parsed_json
                    state = data.get('state', '').strip().upper()
                    if state in ["ON", "OFF"]:
                        circuit_name = data.get('circuit')
                        actuator_ref = data.get('actuator')
                        commands_to_execute = []

                        if circuit_name:
                            circuit_name = circuit_name.strip().upper()
                            circuit_def = IRRIGATION_CIRCUITS.get(circuit_name)
                            if circuit_def:
                                duration = data.get('duration', 0)
                                task_id = data.get('task_id', '')
                                valve_duration = duration + PUMP_PRIME_DELAY
                                commands_to_execute.append({'actuator': circuit_def['source'], 'state': state, 'duration': valve_duration if state == 'ON' else 0, 'start_delay': 0, 'task_id': task_id})
                                commands_to_execute.append({'actuator': circuit_def['line'], 'state': state, 'duration': valve_duration if state == 'ON' else 0, 'start_delay': 0, 'task_id': task_id})
                                commands_to_execute.append({'actuator': 'pump', 'state': state, 'duration': duration if state == 'ON' else 0, 'start_delay': PUMP_PRIME_DELAY if state == 'ON' else 0, 'task_id': task_id})
                        elif actuator_ref:
                            commands_to_execute.append({'actuator': actuator_ref, 'state': state, 'duration': data.get('duration', 0), 'start_delay': data.get('start_delay', 0), 'task_id': data.get('task_id', '')})

                        for cmd in commands_to_execute:
                            cmd_actuator, cmd_state, cmd_duration, cmd_delay, cmd_task_id = cmd['actuator'], cmd['state'], cmd['duration'], cmd['start_delay'], cmd['task_id']
                            target_relay, actuator_id = None, None
                            try:
                                num_actuator = int(cmd_actuator)
                                if num_actuator in relays: target_relay, actuator_id = relays[num_actuator], num_actuator
                            except:
                                if isinstance(cmd_actuator, str):
                                    for id, info in relays.items():
                                        if info['name'] == cmd_actuator.lower(): target_relay, actuator_id = info, id; break
                            
                            if target_relay is None: continue

                            if actuator_id in pending_start_tasks:
                                pending_start_tasks[actuator_id].cancel()
                                if actuator_id in relays:
                                    relays[actuator_id]['task_id'] = "" # Limpiamos ID de tarea tras cancelar delay
                                NVSManager.clear_task(actuator_id)
                                if not circuit_name: break

                            if cmd_state == "ON" and cmd_delay > 0:
                                from utime import time
                                target_start = time() + cmd_delay
                                NVSManager.save_task({"actuator_id": actuator_id, "key": f"{actuator_id}_pending", "target_start_epoch": target_start, "type": "delayed_start", "duration": cmd_duration, "task_id": cmd_task_id})
                                pending_start_tasks[actuator_id] = asyncio.create_task(delayed_start_task(target_relay, actuator_id, cmd_delay, cmd_duration, cmd_task_id))
                                continue

                            relay_value = 1 if cmd_state == "ON" else 0
                            if target_relay['state'] != cmd_state:
                                target_relay['pin'].value(relay_value)
                                target_relay['state'] = cmd_state
                                target_relay['task_id'] = cmd_task_id
                            
                            if cmd_state == "OFF":
                                NVSManager.clear_task(actuator_id)
                                # Gestión de variables globales
                                global active_irrigation_timers
                                active_irrigation_timers = [(id, t) for id, t in active_irrigation_timers if id != actuator_id]
                            
                            if cmd_state == "ON" and isinstance(cmd_duration, int) and cmd_duration > 0:
                                from utime import time
                                end_time = time() + cmd_duration
                                active_irrigation_timers = [(id, t) for id, t in active_irrigation_timers if id != actuator_id]
                                active_irrigation_timers.append((actuator_id, end_time))
                                NVSManager.save_task({"actuator_id": actuator_id, "start_epoch": time(), "duration": cmd_duration, "type": "irrigation_run", "task_id": cmd_task_id})
                                timer_wake_event.set() # Sincronizar despertador de timers

                        state_changed.set()
                        NVSManager.flush()
                except Exception as e:
                    if DEBUG: print(f"    └─ {Colors.RED}Error procesando Riego: {e}{Colors.RESET}")

            # Limpieza de variables de este ciclo
            del parsed_json
            collect()

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Fallo en bucle principal MQTT (Processor)", e)
            # El loop principal de conectividad se encargará del reset
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"\n❌  Error en mqtt_processor_task: {Colors.RED}{e}{Colors.RESET}")
        
        # Limpieza final del mensaje procesado
        del topic, msg, retained, dup
        collect()

def sub_callback(topic, msg, retained, dup):
    """**PRODUCTOR MQTT: Encola mensajes para procesamiento asíncrono.**"""
    # Gestión de variables globales
    global mqtt_message_buffer

    mqtt_message_buffer.append((topic, msg, retained, dup))
    
    if len(mqtt_message_buffer) > MAX_BUFFER_SIZE:
        mqtt_message_buffer.pop(0)
        if DEBUG:
            print(f"⚠️  {Colors.YELLOW}Buffer MQTT lleno{Colors.RESET} (Descartando antiguo)")
    
    # Despierta a la corrutina mqtt_processor_task para procesar el nuevo mensaje
    mqtt_msg_event.set()

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt():
    """**Cierra forzosamente el socket MQTT e invalida el cliente.**"""
    # Gestión de variables globales
    global client
    
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc import collect

    try:
        if client and hasattr(client, 'sock') and client.sock:
             # Solo intentamos desconectar "limpiamente" si hay WiFi
            if wlan and wlan.isconnected():
                try: client.disconnect()
                except OSError: pass
            
            try: client.sock.close()
            except OSError: pass
    except Exception:
        pass
    finally:
        # Invalida el cliente y libera RAM de forma agresiva
        client = None
        collect()
        if DEBUG: print(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

# ---- Función Auxiliar: Flush de Batches de Telemetría (Pre-Shutdown) ----
def flush_telemetry_batches():
    """Publica los batches acumulados en RAM antes de perder la conexión MQTT."""
    if not (client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected()):
        return

    from utime import sleep_ms
    try:
        # Batch Iluminancia
        if illuminance_Batch.count > 0:
            items = illuminance_Batch.get_all()
            if items:
                data_str = ",".join(['[%d,{"illuminance":%s}]' % (it[0], str(it[1])) for it in items])
                client.publish(MQTT_TOPIC_EXTERIOR_METRICS, '{"data":[%s]}' % data_str, qos=0)
                illuminance_Batch.clear()
                if DEBUG: print(f"    ├─ ☀️  Flush Lux: {len(items)} muestras")
                sleep_ms(500) # Pequeña pausa para el stack de red
    except: pass

    try:
        # Batch Temperatura
        if temperature_Batch.count > 0:
            items = temperature_Batch.get_all()
            if items:
                data_str = ",".join(['[%d,{"temperature":%s}]' % (it[0], str(it[1])) for it in items])
                client.publish(MQTT_TOPIC_EXTERIOR_METRICS, '{"data":[%s]}' % data_str, qos=0)
                temperature_Batch.clear()
                if DEBUG: print(f"    ├─ 🌡️  Flush Temp: {len(items)} muestras")
                sleep_ms(500) # Pequeña pausa para el stack de red
    except: pass

    try:
        # Batch Humedad
        if humidity_Batch.count > 0:
            items = humidity_Batch.get_all()
            if items:
                data_str = ",".join(['[%d,{"humidity":%s}]' % (it[0], str(it[1])) for it in items])
                client.publish(MQTT_TOPIC_EXTERIOR_METRICS, '{"data":[%s]}' % data_str, qos=0)
                humidity_Batch.clear()
                if DEBUG: print(f"    └─ 💧  Flush Hum: {len(items)} muestras")
    except: pass

# ---- FUNCIÓN AUXILIAR: Gestión de desconexión (Graceful Shutdown - Relay Modules) ----
def shutdown():
    """
    **Apagado Controlado (Relay Modules))**
    * Publica `offline` explícitamente.
    * Apaga fisicamente todos los relés.
    * Publica el estado `OFF` de todos los relés.
    * Flush de batches de telemetría acumulados.
    * Desconecta MQTT y WiFi.
    """
    from utime import sleep_ms

    # Apagamos todos los actuadores
    for relay_info in relays.values():
        try:
            relay_info['pin'].value(0)
            relay_info['state'] = 'OFF'
        except Exception:
            pass # Ignoramos errores de hardware al apagar

    # Publicamos en MQTT (Solo si hay conexión)
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            # Flush de batches acumulados antes de desconectar
            flush_telemetry_batches()
            sleep_ms(300)

            # Publicamos el LWT explícitamente para que el broker lo retenga.
            # El LWT para el cliente MQTT solo se envía si el cliente se desconecta inesperadamente. 
            # Si nos desconectamos limpiamente,
            # el broker no lo envía automáticamente.
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
            sleep_ms(300)

            # Publicamos 'OFF' para cada relé que haya cambiado de estado.
            for relay_info in relays.values():
                if relay_info['last_published_state'] != 'OFF':
                    client.publish(relay_info['topic'], b"OFF", retain=True, qos=1)
                    sleep_ms(300)
        except: pass

    # Invalidamos el cliente MQTT forzando una reconexión completa.
    force_disconnect_mqtt()

    # Desconectamos el WiFi.
    if wlan:
        try:
            if wlan.isconnected():
                wlan.disconnect()

            # Reset de Hardware Limpio: Apaga físicamente la radio del ESP32.
            # Esto limpia el stack TCP/IP y evita errores EBUSY tras el reinicio.
            wlan.active(False)
            sleep_ms(2000) # Tiempo para que la radio del ESP32 se asiente

            if DEBUG:
                print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass # Ignoramos errores de hardware al apagar

# ---- CORRUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    """**Gestiona la (re)conexión asíncrona del WiFi**"""
    # Gestión de variables globales
    global wlan

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from network import STA_IF, WLAN # type: ignore
    from utime   import time         # type: ignore

    # Inicialización del objeto WLAN
    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = False # Conexión inicial.
    wifi_disconnect_start = None # Marca de tiempo para calcular la duración de la desconexión

    while True:
        if not wlan.isconnected():

            if connected_once:
                if DEBUG: print(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")

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
                await asyncio.sleep(1)
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

                    if DEBUG:
                        print(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)

                if DEBUG:
                    print(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                # Inyección de DNS
                try:
                    # google_dns = "8.8.4.4"
                    cloudflare_dns = "1.1.1.1"
                    ip, subnet, gateway, dns = wlan.ifconfig()
                    wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
                    if DEBUG:
                        print(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
                except Exception as e:
                    if DEBUG: 
                        print(f"⚠️  Error forzando DNS en Boot: {e}")

                # Resetear contador de falla
                wifi_disconnect_start = None

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()

                # Primera Conexión Establecida.
                connected_once = True

            except Exception as e:
                # OSErrors durante la conexión WiFi (ej: hardware no disponible, fallo de IP)
                if DEBUG:
                    print(f"\n❌  No se pudo establecer la conexión WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            # Conectado: Reseteamos contador
            wifi_disconnect_start = None
            # Revisamos la conexion cada 20 segundos
            await asyncio.sleep(20)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    """Callback del Timer de Hardware: Reinicia si la conexión se cuelga."""

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import sleep # type: ignore

    if DEBUG:
        print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Timeout en conexión MQTT {Colors.RED}(Socket Bloqueado){Colors.RESET}")
        print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
        sleep(1)

    safe_reset()

# ---- CORRUTINA: Manejo centralizado de Errores Críticos MQTT ----
async def check_critical_mqtt_errors(e):
    """Evalúa si la excepción es crítica y requiere un reinicio por HW/SW."""
    from umqtt.simple2 import MQTTException # type: ignore
    
    # [CRÍTICO] Errores de MbedTLS/RAM que NO se recuperan con gc.collect():
    #   -17040  = MBEDTLS_ERR_SSL_FATAL_ALERT (contexto TLS corrupto a nivel C)
    #   -16256  = MBEDTLS_ERR_PK_ALLOC_FAILED (sin RAM para claves RSA)
    #   -30592  = MBEDTLS_ERR_SSL_ALLOC_FAILED (sin RAM para contexto SSL)
    #   12      = ENOMEM (heap de MicroPython agotada, fragmentación crítica)
    # NOTA: -202 (SSL Handshake Failed) es TRANSITORIO y se recupera con reconexion.
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -16256, -30592, 12]:
        if DEBUG:
            print(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Fallo crítico de SSL/Red/RAM ({e.args[0]}).")
            print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n")
        await asyncio.sleep(5)
        safe_reset()

# ---- CORRUTINA: Gestión de Conexión MQTT (Relay Modules) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    # Gestión de variables globales
    global client

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc            import collect
    from machine       import Timer
    from umqtt.simple2 import MQTTClient, MQTTException  # type: ignore
    from utime         import sleep_ms, ticks_diff, ticks_ms, time # type: ignore

    # =========================================================================

    # Definimos el timeout del watchdog del Timer de Hardware (ms)
    wd_timeout_ms = (MQTT_SOCKET_TIMEOUT + 15) * 1000

    # Cronómetro de fallas de conexión MQTT
    mqtt_disconnect_start = None
    last_manual_ping = ticks_ms()
    
    # Contador de errores de conexiones consecutivas
    consecutive_mqtt_failures = 0

    while True:
        # Esperamos a que el WiFi esté conectado
        if wlan is None or not wlan.isconnected():
            # Cedemos el control y esperamos a que la tarea wifi_coro haga su trabajo
            await asyncio.sleep(5)
            continue

        # 🔄 Gestionamos la (Re)conexión
        if client is None:
            # Verificación de falla crítica por tiempo (5 Minutos)
            if mqtt_disconnect_start is None:
                mqtt_disconnect_start = time()
            
            if (time() - mqtt_disconnect_start > MAX_OFFLINE_RESET_SEC):
                if DEBUG:
                    print(f"\n💀  {Colors.RED}DEATH: El MQTT no conectó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}")
                    print(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                await asyncio.sleep(1)
                safe_reset()

            try:
                collect()

                # ---- Bucle de reintentos internos (evita reboot por fallo transitorio) ----
                max_connect_attempts = 2
                connect_success = False

                for connect_attempt in range(max_connect_attempts):
                    # Inicializa el Cliente MQTT (con timeout largo para handshake SSL)
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

                    # Configura Last Will and Testament (LWT)
                    client.set_last_will(LWT_TOPIC, LWT_MESSAGE, retain=True, qos=1)
                    
                    # Configura el callback para mensajes entrantes
                    client.set_callback(sub_callback)

                    # Configura el callback de estado
                    client.set_callback_status(sub_status_callback)
                    
                    # [SEGURIDAD] Watchdog para conexión síncrona bloqueante
                    # Si client.connect() se BLOQUEA (socket blocking), 
                    # el Timer nos reiniciará.
                    wd_timer = Timer(0)
                    wd_timer.init(period=wd_timeout_ms, mode=Timer.ONE_SHOT, callback=_connection_timeout_handler)

                    # [Optimización Crítica] Limpieza de RAM antes de SSL Handshake
                    # El handshake SSL requiere mucha RAM contigua para claves RSA.
                    collect()
                    if DEBUG:
                        if connect_attempt == 0:
                            log_disk_usage()
                            log_ram_usage()
                            print(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")
                        else:
                            print(f"📡  Reintento {Colors.YELLOW}{connect_attempt + 1}/{max_connect_attempts}{Colors.RESET}")

                    try:
                        # Para persistencia, clean_session debe ser False. 
                        # Esto permite que el Broker guarde las suscripciones y mensajes QOS 1 mientras estemos offline.
                        client.connect(clean_session=True)
                        connect_success = True
                        break  # Éxito, salimos del bucle
                    except (MQTTException, OSError) as e_connect:
                        if connect_attempt < max_connect_attempts - 1:
                            # Limpiamos socket residual antes de reintentar
                            if DEBUG: log_mqtt_exception("Intento de conexión fallido", e_connect)
                            try: client.disconnect()
                            except: pass
                            client = None
                            collect()

                            # [Anti-EBUSY] Si el error es EBUSY (-16), el stack LwIP tiene sockets
                            # TCP en TIME_WAIT que bloquean nuevos File Descriptors.
                            # Reseteamos la interfaz WiFi para forzar la limpieza a nivel kernel.
                            if isinstance(e_connect, OSError) and e_connect.args and e_connect.args[0] == -16:
                                if wlan:
                                    try:
                                        wlan.disconnect()
                                        wlan.active(False)
                                        await asyncio.sleep(2)
                                        wlan.active(True)
                                        wlan.connect(WIFI_SSID, WIFI_PASS)
                                        # Esperamos reconexión WiFi (máx 15s)
                                        for _ in range(15):
                                            if wlan.isconnected(): break
                                            await asyncio.sleep(1)
                                    except Exception:
                                        pass
                            
                            await asyncio.sleep(3)
                        else:
                            raise e_connect  # Último intento: propagar al handler externo
                    finally:
                        # Desactivamos el timer de seguridad (siempre, éxito o fallo)
                        wd_timer.deinit()

                if not connect_success:
                    raise MQTTException(30)  # Forzar reconexión por timeout

                # [Nivel 3.2] Reducir socket_timeout tras connect exitoso
                # El handshake SSL necesita timeout largo, pero operaciones normales no.
                client.socket_timeout = MQTT_SOCKET_TIMEOUT

                # Solo tras conexión EXITOSA
                # Reseteamos el cronómetro de fallas MQTT
                mqtt_disconnect_start = None

                if DEBUG:
                    print(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Reseteamos relojes para evitar zombie instantáneo tras reconexión
                client.last_cpacket = ticks_ms()
                last_manual_ping = ticks_ms()

                # Reseteamos el contador tras conexión exitosa
                consecutive_mqtt_failures = 0

                # Publicamos evento explícito de BOOT para que el scheduler detecte reinicios rápidos
                client.publish(MQTT_TOPIC_STATUS + "/boot", b"reboot", retain=False, qos=1)
                await asyncio.sleep_ms(300)

                if DEBUG:
                    print(f"\n📡  Controlador {Colors.GREEN}online{Colors.RESET}", end="\n")

                # Publica el estado actual de las auditorías (Digital Twin) tras conectar.
                await publish_audit_state()
                await asyncio.sleep_ms(300)

                # Suscripción a tópicos
                client.subscribe(MQTT_TOPIC_CMD, qos=1)
                client.subscribe(MQTT_TOPIC_IRRIGATION_CMD, qos=1)

                # Resincronizamos los estados de los actuadores.
                for relay_info in relays.values():
                    relay_info['last_published_state'] = None

                # [Estabilización] Esperamos a que se envíen los paquetes de suscripción y status (QoS 1)
                # Esto "vacia" el buffer de salida TCP antes de la ráfaga de estados.
                await asyncio.sleep_ms(300)

                # Notifica el cambio de estado
                state_changed.set()

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo la Conexión MQTT", e)
                
                await check_critical_mqtt_errors(e)
                consecutive_mqtt_failures += 1

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()

                # ---- Backoff Adaptativo ----
                if consecutive_mqtt_failures >= 3:
                    # 2 minutos de Espera para que se Estabilice la red
                    wait_time = 120
                    if DEBUG:
                        print(f"⚠️  {Colors.YELLOW}Backoff:{Colors.RESET} {consecutive_mqtt_failures} fallos seguidos.")
                        print(f"    └─ Esperando {wait_time}s para liberar RAM y estabilizar red.")
                    
                    # [Anti-EBUSY] Reset preventivo del stack WiFi en backoff largo.
                    # LwIP mantiene sockets en TIME_WAIT hasta 120s (MSL×2).
                    # Reiniciar la interfaz los libera inmediatamente.
                    if wlan:
                        try:
                            wlan.disconnect()
                            wlan.active(False)
                            await asyncio.sleep(3)
                            wlan.active(True)
                            wlan.connect(WIFI_SSID, WIFI_PASS)
                            for _ in range(15):
                                if wlan.isconnected(): break
                                await asyncio.sleep(1)
                        except Exception:
                            pass

                    collect()
                    await asyncio.sleep(wait_time)
                else:
                    # Backoff estándar
                    await asyncio.sleep(10)
                continue

        # 🔄 Gestionamos la Conexión Activa
        if client:
            try:
                # 🔒 Adquirimos el lock con timeout para evitar bloqueo indefinido
                # Si otra corrutina retiene el lock (ej: publicación SSL lenta),
                # saltamos esta iteración en vez de quedarnos esperando.
                lock_acquired = False
                try:
                    # 5s: Suficiente para sobrevivir al lock del state_publisher (~1-2s en redes lentas)
                    await asyncio.wait_for(mqtt_lock.acquire(), 5)
                    lock_acquired = True
                except asyncio.TimeoutError:
                    pass

                if lock_acquired:
                    try:
                        # [Escudo de Concurrencia]: Validamos objeto y socket tras la espera del lock.
                        # Otra tarea pudo llamar a force_disconnect_mqtt() mientras esperábamos.
                        if client and getattr(client, 'sock', None):
                            # Revisamos si hay mensajes entrantes
                            # Drenamos la cola MQTT (ráfaga de hasta 15 mensajes)
                            # umqtt procesa 1 solo msj por llamada. Si se acumulan, PINGRESP se retrasa.
                            for _ in range(15):
                                client.check_msg()
                    finally:
                        mqtt_lock.release()

                # Extracción de un único timestamp global para esta iteración
                now_ms = ticks_ms()
                
                # Ping Manual + Heartbeat Integrado
                # Enviamos el ping basado en nuestro propio cronómetro para mayor control
                if client and ticks_diff(now_ms, last_manual_ping) > (MQTT_PING_INTERVAL * 1000):
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        # [Escudo de Concurrencia]: Re-validación obligatoria post-await
                        if client and getattr(client, 'sock', None):
                            client.ping()
                            # Heartbeat integrado: publicamos "online" en el MISMO lock
                            # que el ping para eliminar la contención que causaba heartbeat_task.
                            # El frontend (useDeviceHeartbeat) necesita recibir "online" cada ~30s
                            # para no declarar al dispositivo como zombie/offline.
                            # qos=0: Fire-and-forget (idempotente, tolerante a pérdida)
                            client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)
                            if DEBUG: print(f"{Colors.BLUE}.{Colors.RESET}", end="")
                            # Actualizar last_cpacket: si podemos ENVIAR, el socket está vivo
                            client.last_cpacket = now_ms
                            # Dejamos que check_msg() detecte el PINGRESP real del servidor.
                            last_manual_ping = now_ms

                # Comprobamos si ha pasado demasiado tiempo desde que OÍMOS al broker
                # Damos un margen de 1.5x el KEEPALIVE
                if client and ticks_diff(now_ms, client.last_cpacket) > (MQTT_KEEPALIVE * 1500):
                    # Lanzamos excepción personalizada para ser capturada con prefijo [Zombie]
                    raise MQTTSessionZombie("Inactividad del broker MQTT excedida")
                
                await asyncio.sleep(MQTT_CHECK_INTERVAL)

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Error en Operación MQTT", e)

                await check_critical_mqtt_errors(e)

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff mayor (10s) para dar respiro a la red
                await asyncio.sleep(10)
                continue

        # Cede el control al planificador de asyncio
        await asyncio.sleep(MQTT_CHECK_INTERVAL)

# ---- CORRUTINA: Gestión de tareas diferidas ----
async def delayed_start_task(target_relay, actuator_id, delay, duration, task_id=""):
    """
    **Activa un actuador después de un retraso especificado.**

    * `actuator_ref`: Puede ser el ID (int) o el Nombre (str) del actuador.
    * `delay`: Tiempo de espera antes de encender (segundos).
    * `duration`: Tiempo que permanecerá encendido (segundos). `0 = indefinido`.
    * `task_id`: Identificador original del JSON para telemetría state.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import time # type: ignore

    try:
        if DEBUG:
            print(f"    └─ 🕒 {Colors.YELLOW}Inicio Diferido:{Colors.RESET} Esperando {delay}s para {target_relay['name']}")

        # Esperamos el tiempo previsto
        await asyncio.sleep(delay)

        # [CRÍTICO] Al despertar, borramos la entrada "_pending" de NVS
        # Porque o ya arrancamos (y guardamos la running) o fallamos.
        # Limpieza quirúrgica de la key pendiente
        NVSManager.delete_key(f"{actuator_id}_pending")

        # Validamos si la acción es ENCENDER (Duration > 0)
        if duration > 0:
            # ---- BITÁCORA DE VUELO (NVS) ----
            # Guardamos la intención antes de ejecutar, para sobrevivir a un reinicio.
            try:
                task_data = {
                    "actuator_id": actuator_id,
                    "start_epoch": time(),
                    "duration": duration,
                    "type": "irrigation_run",
                    "task_id": task_id
                }
                NVSManager.save_task(task_data)
                
            except Exception as e:
                if DEBUG:
                    print(f"⚠️  Error guardando bitácora de vuelo: {e}")

        # ---- Accionamos el Relé (ENCENDIDO)----
        # Enciende el relé | active-HIGH
        target_relay['pin'].value(1)
        # Establece el state en el Diccionario de Relays
        target_relay['state'] = 'ON'
        target_relay['task_id'] = task_id
        # Notifica el cambio de estado
        state_changed.set() 

        # ---- Log Dinámico ----
        # Si hay duración definida, el encendido es intermedio (├─), si no, es final (└─)
        is_intermediate = (duration > 0)
        tree_char = "├─" if is_intermediate else "└─"
    
        if DEBUG:
            print(f"\n🚀  Ejecución {Colors.GREEN}Diferida{Colors.RESET}")
            print(f"    {tree_char} Actuador: {Colors.MAGENTA}{target_relay['name']}{Colors.RESET} -> ON")
        
        # ---- Orquestar Apagado Automático (Si aplica) ----
        if duration > 0:
            end_time = time() + duration

            # Gestión de variables globales
            global active_irrigation_timers
            # Limpiamos timers anteriores de este actuador
            active_irrigation_timers = [
                (id, t) for id, t in active_irrigation_timers if id != actuator_id
            ]

            active_irrigation_timers.append((actuator_id, end_time))
            timer_wake_event.set() # Despertar gestor de tiempos tras inicio diferido

            if DEBUG:
                print(f"    └─ Timer:    Apagar en {Colors.CYAN}{duration}s{Colors.RESET}")

        # ---- Escritura Física en Disco ----
        # Consolidamos la ejecución diferida
        NVSManager.flush()

    except asyncio.CancelledError:
        if DEBUG:
            print(f"    └─ Info: {Colors.YELLOW}Tarea diferida cancelada durante la espera.{Colors.RESET}")
        raise # Re-lanzamos para limpieza interna de asyncio si es necesario

    finally:
        # Limpiamos la referencia a esta tarea en el diccionario global
        # Gestión de variables globales
        global pending_start_tasks
        if actuator_id in pending_start_tasks:
            del pending_start_tasks[actuator_id]
        
        # [CRÍTICO] Si la tarea termina (bien o mal), asegurarse de limpiar NVS si era un delayed start que ya corrió
        # Ojo: Si era con duration > 0, ya se guardó una "irrigation_run". Si falla antes, limpiamos.
        # Simplificación: El timer_manager lo limpia al final.

# ---- CORRUTINA: Gestión de temporizadores ----
async def timer_manager_task():
    """**Gestiona los temporizadores de riego (Event-Driven idle).**"""
    # Gestión de variables globales
    global active_irrigation_timers

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import time # type: ignore

    while True:
        # Si no hay riegos activos, dormimos la corrutina
        if not active_irrigation_timers:
            timer_wake_event.clear()
            await timer_wake_event.wait()
            continue

        # Si hay riegos activos, revisamos cada segundo
        await asyncio.sleep(1)

        current_time = time() # tiempo actual
        timers_to_keep = [] # lista auxiliar
        expired_relays = [] # lista de actuadores que terminaron en este ciclo

        # Revisamos cada temporizador
        for actuator_id, end_time in active_irrigation_timers:
            # Si el tiempo ya pasó (se venció el timer)
            if current_time >= end_time:
                # verificamos que exista
                target_relay = relays.get(actuator_id)
                # verificamos que este ON
                if target_relay and target_relay['state'] == "ON":
                    target_relay['pin'].value(0) # Apaga el relé | active-HIGH
                    target_relay['state'] = "OFF" # Reestablece el state en el Diccionario de Relays
                    state_changed.set() # Notifica el cambio de estado
                    
                    # Guardamos el nombre para el log agrupado
                    expired_relays.append(target_relay['name'])
                    
                    # ---- Limpieza de Bitácora (NVS) ----
                    # La tarea terminó exitosamente, borramos el registro ESPECÍFICO.
                    NVSManager.clear_task(actuator_id)
            else:
                # Si no ha vencido, lo conservamos en la lista
                timers_to_keep.append((actuator_id, end_time))

        # Actualizamos la lista global solo con los pendientes
        active_irrigation_timers = timers_to_keep

        # ---- Notificación de Logs Agrupados ----
        if expired_relays:
            if DEBUG:
                print(f"\n⏰  {Colors.YELLOW}Temporizador Finalizado{Colors.RESET}")
                for name in expired_relays:
                    print(f"    └─ Acción: Apagando {Colors.MAGENTA}{name}{Colors.RESET}")
            
            # ---- Escritura Física en Disco ----
            # Si algún timer terminó y borró tareas de la caché, consolidamos en disco.
            NVSManager.flush()

# ---- CORRUTINA: Publicación de Estado ----
async def state_publisher_task():
    """
    **Publica los cambios de estado de los actuadores.**
    Se mantiene dormida (await state_changed.wait()) hasta que alguien activa la señal.
    """
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc import collect
    from ujson import dumps # type: ignore
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # Esperamos a que ocurra un evento
        await state_changed.wait()
        
        # Limpiamos el estado para el próximo evento
        state_changed.clear()

        # Debounce (Anti-Rebotes): Pausa para agrupar múltiples cambios simultáneos
        await asyncio.sleep_ms(50)

        # Sincronización MQTT con validación de socket
        if client is None or getattr(client, 'sock', None) is None or not (wlan and wlan.isconnected()):
            if DEBUG:
                print(f"\n❌  Publicación omitida: {Colors.RED}Cliente/WiFi no disponible{Colors.RESET}")
            continue

        # Filtramos los cambios
        updates_pending = []
        for relay_info in relays.values():
            if relay_info['state'] != relay_info['last_published_state']:
                updates_pending.append(relay_info)

        # ---- Lógica de publicación ----
        # Si No hay nada que actualizar
        if not updates_pending:
            continue
        
        # Si Hay actualizaciones -> Imprimimos encabezado
        if DEBUG:
            print(f"\n📡  Sincronizando {Colors.BLUE}Relays{Colors.RESET}")

        try:
            # Construcción manual de JSON (Zero-Dict) para el Snapshot
            # Evita duplicar la estructura de relays en RAM y reduce fragmentación
            fragments = []
            for r_id, r_info in relays.items():
                # Formato: "name":{"state":"ON","task_id":"...","id":1}
                fragments.append('"%s":{"state":"%s","task_id":"%s","id":%d}' % (
                    r_info['name'], 
                    r_info['state'], 
                    r_info.get('task_id', ''), 
                    r_id
                ))
            
            payload = "{" + ",".join(fragments) + "}"
            
            # Liberamos memoria de la lista temporal antes del Lock/Publish 
            del fragments
            collect()

            # 🔒 Pedimos permiso para usar el socket
            async with mqtt_lock:
                # [Escudo de Concurrencia]: Evita crash si la conexión murió mientras esperábamos el lock.
                if client and getattr(client, 'sock', None):
                    # Publicamos SOLO al tópico Unificado (/state)
                    # El frontend (ControlPanel) y the scheduler ya consumen exclusivamente este tópico.
                    client.publish(MQTT_TOPIC_STATE, payload, retain=True, qos=0)

            # Liberamos el payload de la RAM
            del payload
            collect()

            # Marcamos como publicadas
            for relay_info in updates_pending:
                relay_info['last_published_state'] = relay_info['state']
                # [Smart Cleanup]: Si el relé se apagó, ahora sí limpiamos su ID de la RAM 
                # tras habernos asegurado de que se envió al Broker/Scheduler en el snapshot.
                if relay_info['state'] == 'OFF':
                    relay_info['task_id'] = ""
            
            if DEBUG: 
                active_ids = [r_info.get('task_id') for r_info in relays.values() if r_info['state'] == 'ON' and r_info.get('task_id')]
                if active_ids:
                    print(f"    └─ Snapshot {Colors.GREEN}Enviado{Colors.RESET} (Relays Activos: {len(active_ids)})")
                else:
                    print(f"    └─ Snapshot {Colors.GREEN}Enviado{Colors.RESET} (Nodo en Reposo)")

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Fallo al publicar el Snapshot de los Relays", e)
            # Invalidamos el cliente inmediatamente.
            # Si el snapshot falló (MQTT-3), el socket ya no es confiable.
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"    ⚠️  Error general en Sincronización Relay: {e}")

# ---- CORRUTINA: Gestión del Sensor de Lluvia (FSM - Finite State Machine) ----
async def rain_monitor_task():
    """
    #### Monitoreo de Lluvia (Maquina de Estados Finita)
    * Oversampling de 10 muestras con esperas asíncronas para máxima eficiencia RAM/CPU.
    * Intervalos adaptativos: 10 minutos (Vigía) y 1 minuto (Ráfaga).
    * Maquina de Estados Finita con validación de histéresis.
    """

    # Estado Inicial (Soportando recuperación de NVS)
    global restored_rain_state, restored_rain_start_ticks, last_rain_raw

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps
    from utime import ticks_ms, ticks_diff, time
    from umqtt.simple2 import MQTTException # type: ignore

    # Umbrales (ADC 0-4095)
    # RAIN_START_VALUE  = 2300 # Mojado (OLD)
    # RAIN_STOP_VALUE   = 2800 # Seco (OLD)
    RAIN_START_VALUE  = 2600 # Mojado (Inicia evento)
    RAIN_STOP_VALUE   = 3200 # Seco (Finaliza evento)
    RAW_INTENSITY_MIN = 1700 # 100%

    # Tiempos de Configuración
    INTERVAL_NORMAL = 600 # 10 minutos
    INTERVAL_BURST  = 60  # 1 minuto

    # [DETECCIÓN CORRECTA DE PARADA]
    # Umbral mínimo de intensidad para considerar lluvia activa.
    # Si la intensidad cae por debajo de este valor el sensor está secándose.
    RAIN_ACTIVE_INTENSITY_THRESHOLD = 20  # < 20% = sensor secándose
    # Número de ciclos consecutivos con intensidad baja para confirmar parada.
    # Con INTERVAL_BURST=60s, 3 ciclos = 3 minutos sin lluvia antes de declarar Dry.
    RAIN_STOP_CONSECUTIVE_LOW = 3

    # [FALLBACK: TIMEOUT DE SEGURIDAD]
    # Si la intensidad se estanca (sensor húmedo residual), forzamos Dry tras 30 min.
    RAIN_STALE_TIMEOUT = 1800  # 30 minutos

    # [HEARTBEAT DE SINCRONIZACIÓN]
    # Republicamos el estado Raining cada 10 min para mantener el sistema sincronizado.
    RAIN_HEARTBEAT_INTERVAL = 600  # 10 minutos

    current_interval = INTERVAL_NORMAL
    current_state    = restored_rain_state
    rain_samples     = 0
    rain_start_ticks = restored_rain_start_ticks
    rain_total_int   = 0
    rain_publish_failures = 0  # [Tolerancia MQTT-3]: Contador de fallos consecutivos

    # [VARIABLES DE PARADA CORRECTA]
    rain_consecutive_low = 0    # Ciclos consecutivos con intensidad baja
    rain_last_intensity  = -1   # Última intensidad promedio registrada (para estabilización)

    # [VARIABLES DE FALLBACK Y HEARTBEAT]
    rain_stable_since    = 0    # Epoch cuando la intensidad se estancó (para timeout)
    rain_last_heartbeat  = 0    # Epoch del último heartbeat publicado

    # [BANDERA DE REINTENTO]
    rain_state_dirty     = False  # True si hay un cambio de estado sin publicar exitosamente
    rain_dirty_payload   = None   # Payload pendiente de republicar

    if current_state == 'Raining':
        current_interval = INTERVAL_BURST
        if DEBUG: print(f"\n🌧️  Lluvia RECUPERADA desde NVS | Modo Ráfaga: {INTERVAL_BURST}s")

    # ---- Primera Lectura Inmediata (Sincronización de Arranque) ----
    # Leemos el sensor ahora mismo para determinar el estado REAL de lluvia.
    # Si NVS dice "Raining" pero el sensor dice "seco", cerramos el evento.
    boot_state_to_publish = None # Estado a publicar por MQTT cuando esté listo
    boot_timestamp_to_publish = time() # Momento exacto de la decisión

    if rain_sensor_analog is not None:
        try:
            raw = await fetch_rain_raw()
            if raw is not None:
                last_rain_raw = raw

                if raw < RAIN_START_VALUE:
                    # ---- Sensor confirma lluvia ----
                    if current_state != 'Raining':
                        # NVS no tenía evento → nuevo evento
                        current_state = 'Raining'
                        current_interval = INTERVAL_BURST
                        rain_start_ticks = ticks_ms()
                        rain_total_int = 0
                        rain_samples = 0
                        # Persistir en NVS
                        try:
                            NVSManager.save_task({
                                "type": "rain_event",
                                "start_epoch": time(),
                                "key": "rain_event"
                            })
                            NVSManager.flush()
                        except Exception:
                            pass

                    # Si NVS ya tenía Raining, mantenemos rain_start_ticks restaurado (no perdemos duración)
                    boot_state_to_publish = 'Raining'
                    if DEBUG: print(f"    ├─ Rain Monitor: {Colors.BLUE}{raw}{Colors.RESET}")

                else:
                    # ---- Sensor dice seco ----
                    if current_state == 'Raining':
                        # NVS decía Raining pero ya paró → cerrar evento con duración calculada
                        if rain_start_ticks > 0:
                            duration_ms = ticks_diff(ticks_ms(), rain_start_ticks)
                            duration_sec = duration_ms // 1000
                            if DEBUG: print(f"    ├─ Lluvia terminó offline. Duración: {duration_sec}s")
                            # El evento finalizado se publicará cuando MQTT esté listo
                            # (en la primera iteración del while True)

                        current_state = 'Dry'
                        current_interval = INTERVAL_NORMAL
                        rain_start_ticks = 0
                        # ---- Limpieza de Bitácora (NVS) ----
                        NVSManager.delete_key("rain_event")
                        NVSManager.flush()

                    boot_state_to_publish = 'Dry'
                    if DEBUG: print(f"    ├─ Rain Monitor: {Colors.YELLOW}{raw}{Colors.RESET}")

        except Exception as e:
            if DEBUG: print(f"\n⚠️  Error en primera lectura de lluvia: {e}")

    while True:
        try:
            # Si el sensor no está conectado físicamente, suspendemos el monitoreo de forma silenciosa.
            if rain_sensor_analog is None:
                await asyncio.sleep(INTERVAL_NORMAL)
                continue

            # ---- Publicación Diferida del Estado de Arranque ----
            if boot_state_to_publish is not None:
                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    try:
                        # Usamos el timestamp capturado en el arranque, no el de "ahora"
                        payload_boot = '{"state":"%s","timestamp":%d}' % (boot_state_to_publish, boot_timestamp_to_publish)
                        async with mqtt_lock:
                            client.publish(MQTT_TOPIC_RAIN_STATE, payload_boot, retain=False, qos=0)
                        if DEBUG: print(f"    └─ Rain Monitor: {boot_state_to_publish}")
                    except Exception as e:
                        if DEBUG: print(f"    └─ ⚠️ Error publicando estado lluvia: {e}")
                        force_disconnect_mqtt()
                        await check_critical_mqtt_errors(e)
                    boot_state_to_publish = None  # Solo una vez

            # Oversampling centralizado (10 muestras cada 50ms = 500ms total)
            raw = await fetch_rain_raw()

            if raw is None:
                if DEBUG: print(f"\n⚠️  Lluvia: No hay muestras válidas (0/{RAIN_TARGET_SAMPLES})")
                await asyncio.sleep(current_interval)
                continue

            # Actualizamos caché para Auditoría (get_rain_sample)
            last_rain_raw = raw 

            # Cálculo de Intensidad
            clamped_raw = max(RAW_INTENSITY_MIN, min(raw, RAIN_STOP_VALUE))
            delta_max = RAIN_STOP_VALUE - RAW_INTENSITY_MIN
            intensity = round(((RAIN_STOP_VALUE - clamped_raw) / delta_max) * 100)

            # ---- ESTADO A: Inicia la lluvia ----
            if raw < RAIN_START_VALUE and current_state == 'Dry':
                current_state = 'Raining'
                current_interval = INTERVAL_BURST
                rain_start_ticks = ticks_ms()
                rain_total_int = 0
                rain_samples = 0
                
                # ---- BITÁCORA DE LLUVIA (NVS) ----
                # Guardamos el inicio del evento para sobrevivir a reinicios
                try:
                    NVSManager.save_task({
                        "type": "rain_event",
                        "start_epoch": time(),
                        "key": "rain_event"
                    })
                    NVSManager.flush()
                except Exception as e:
                    if DEBUG: print(f"⚠️  Error persistiendo lluvia: {e}")

                # Publicar estado 'Raining' por MQTT para que Ingest y Scheduler lo sepan
                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    try:
                        payload_raining = '{"state":"Raining","timestamp":%d}' % time()
                        # 🔒 Pedimos permiso para usar el socket
                        async with mqtt_lock:
                            # [Escudo de Concurrencia]: Validación post-await
                            if client and getattr(client, 'sock', None):
                                client.publish(MQTT_TOPIC_RAIN_STATE, payload_raining, retain=False, qos=0)
                    except Exception as e:
                        if DEBUG: print(f"⚠️  Error publicando Raining: {e}")
                        force_disconnect_mqtt()
                        await check_critical_mqtt_errors(e)

                if DEBUG: print(f"\n🌧️  Lluvia INICIADA (Raw: {raw}) | Modo Ráfaga: {INTERVAL_BURST}s")

            # ---- ESTADO B: Lloviendo (Acumulando + Detección de Parada) ----
            elif current_state == 'Raining':
                now_ts = time()

                # Siempre acumulamos en el batch si el sensor detecta humedad
                if raw <= RAIN_STOP_VALUE:
                    rain_total_int += intensity
                    rain_samples += 1
                    rain_Batch.append(intensity)

                # [HEARTBEAT DE SINCRONIZACIÓN]
                # Republicamos el estado Raining periódicamente para que el sistema
                # no quede desincronizado tras un reboot del broker o del ingest.
                if now_ts - rain_last_heartbeat >= RAIN_HEARTBEAT_INTERVAL:
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        try:
                            payload_hb = '{"state":"Raining","timestamp":%d,"heartbeat":true}' % now_ts
                            async with mqtt_lock:
                                if client and getattr(client, 'sock', None):
                                    client.publish(MQTT_TOPIC_RAIN_STATE, payload_hb, retain=False, qos=0)
                            rain_last_heartbeat = now_ts
                            if DEBUG: print(f"\n🌧️  Heartbeat Lluvia: Raining (sync)")
                        except Exception:
                            pass  # El heartbeat es no crítico, lo intentará en el próximo ciclo

                # [REINTENTO DE ESTADO SUCIO]
                if rain_state_dirty and rain_dirty_payload:
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        try:
                            async with mqtt_lock:
                                if client and getattr(client, 'sock', None):
                                    client.publish(MQTT_TOPIC_RAIN_STATE, rain_dirty_payload, retain=False, qos=0)
                            rain_state_dirty = False
                            rain_dirty_payload = None
                            if DEBUG: print(f"\n✅  Reintento de estado de lluvia exitoso")
                        except Exception:
                            pass  # Reintentar en el próximo ciclo

                # Si el batch se llena, enviamos un adelanto (cada 10 muestras)
                if rain_samples > 0 and rain_samples % 10 == 0:
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        try:
                            data_str = ",".join(['[%d,{"rain_intensity":%s}]' % (it[0], str(it[1])) for it in rain_Batch.get_all()])
                            payload_batch = '{"data":[%s]}' % data_str
                            async with mqtt_lock:
                                if client and getattr(client, 'sock', None):
                                    client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch, qos=0)
                                    rain_Batch.clear()
                                    if DEBUG: print(f"\n🌧️  Enviando Batch de Lluvia Intermedio")
                        except Exception as e:
                            if DEBUG: print(f"⚠️  Error enviando Batch Lluvia: {e}")
                            force_disconnect_mqtt()
                            await check_critical_mqtt_errors(e)

                # ================================================================
                # [LÓGICA DE DETECCIÓN DE PARADA - CORRECCIÓN PRINCIPAL]
                # ================================================================
                # MÉTODO 1 (PRIMARIO): El sensor ADC supera el umbral de seco (3200).
                # Este es el caso ideal: la plataforma del sensor se secó completamente.
                sensor_says_dry = raw > RAIN_STOP_VALUE

                # MÉTODO 2 (INTENSIDAD BAJA): La intensidad cae bajo el umbral mínimo activo.
                # Esto detecta cuando la lluvia se detiene pero el sensor aún está húmedo (< 20%).
                # Requerimos RAIN_STOP_CONSECUTIVE_LOW ciclos consecutivos para evitar falsos positivos.
                if intensity < RAIN_ACTIVE_INTENSITY_THRESHOLD:
                    rain_consecutive_low += 1
                else:
                    # Si la intensidad sube de nuevo, resetear el contador
                    rain_consecutive_low = 0
                    rain_stable_since = 0  # Resetear también el timer de estabilización

                intensity_says_dry = rain_consecutive_low >= RAIN_STOP_CONSECUTIVE_LOW

                # MÉTODO 3 (FALLBACK): La intensidad se estanca durante más de RAIN_STALE_TIMEOUT.
                # Detecta el caso del sensor húmedo por condensación (intensidad alta pero sin lluvia real).
                # Solo se activa si la intensidad actual es similar a la del ciclo anterior (±10 pts).
                if rain_last_intensity >= 0 and abs(intensity - rain_last_intensity) <= 10:
                    if rain_stable_since == 0:
                        rain_stable_since = now_ts
                elif rain_stable_since > 0:
                    rain_stable_since = 0  # Intensidad cambió, sensor aún activo

                stale_timeout_triggered = (rain_stable_since > 0 and
                                           now_ts - rain_stable_since >= RAIN_STALE_TIMEOUT)

                rain_last_intensity = intensity  # Actualizamos para el próximo ciclo

                # ---- ESTADO C: Termina la lluvia (cualquier método) ----
                if sensor_says_dry or intensity_says_dry or stale_timeout_triggered:

                    # Motivo de la transición (para debug)
                    if DEBUG:
                        if sensor_says_dry:
                            stop_reason = f"ADC seco (raw:{raw} > {RAIN_STOP_VALUE})"
                        elif intensity_says_dry:
                            stop_reason = f"Intensidad baja {RAIN_STOP_CONSECUTIVE_LOW} ciclos ({intensity}%)"
                        else:
                            stale_min = (now_ts - rain_stable_since) // 60
                            stop_reason = f"Timeout de estabilización ({stale_min} min sin variación)"

                    current_state = 'Dry'
                    current_interval = INTERVAL_NORMAL
                    rain_consecutive_low = 0
                    rain_stable_since = 0

                    duration_ms = ticks_diff(ticks_ms(), rain_start_ticks)
                    duration_sec = duration_ms // 1000
                    avg_int = round(rain_total_int / rain_samples) if rain_samples > 0 else 0

                    # Sincronización MQTT con validación de socket
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        try:
                            # Construcción de JSON manual para el evento y el batch final
                            payload = '{"duration_seconds":%d,"average_intensity_percent":%d,"timestamp":%d}' % (duration_sec, avg_int, time())

                            data_items = rain_Batch.get_all()
                            payload_batch = None
                            if data_items:
                                data_str = ",".join(['[%d,{"rain_intensity":%s}]' % (it[0], str(it[1])) for it in data_items])
                                payload_batch = '{"data":[%s]}' % data_str
                            
                            # 🔒 Pedimos permiso para usar el socket
                            payload_dry = '{"state":"Dry","timestamp":%d}' % time()
                            async with mqtt_lock:
                                # [Escudo de Concurrencia]: Validación post-await
                                if client and getattr(client, 'sock', None):
                                    client.publish(MQTT_TOPIC_RAIN_STATE, payload_dry, retain=False, qos=0)
                                    client.publish(MQTT_TOPIC_RAIN_EVENT, payload, qos=1)
                                    # Enviamos el último lote de ráfaga
                                    if payload_batch:
                                        client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch, qos=0)

                            rain_state_dirty = False
                            rain_dirty_payload = None
                            rain_Batch.clear()
                        except Exception as e:
                            if DEBUG: print(f"⚠️  Error finalizando Lluvia: {e}")
                            # [BANDERA DE REINTENTO]: Guardamos el estado para republicar
                            rain_state_dirty = True
                            rain_dirty_payload = '{"state":"Dry","timestamp":%d}' % time()
                            force_disconnect_mqtt()
                            await check_critical_mqtt_errors(e)

                    # ---- Limpieza de Bitácora (NVS) ----
                    NVSManager.delete_key("rain_event")
                    NVSManager.flush()

                    if DEBUG: print(f"\n⛅  Lluvia TERMINADA [{stop_reason}]. Dur:{duration_sec}s, Int:{avg_int}% | Modo Vigía: {INTERVAL_NORMAL}s")

        except (MQTTException, OSError) as e:
            rain_publish_failures += 1
            if DEBUG: log_mqtt_exception("Error de red en rain_monitor_task()", e)
            # [Tolerancia MQTT-3]: Solo matamos el cliente tras 2+ fallos consecutivos
            if rain_publish_failures >= 2:
                force_disconnect_mqtt()
                rain_publish_failures = 0
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"\n⚠️  Error en rain_monitor_task(): {e}")
        
        # Pausa pura de CPU (Sin spin-wait)
        await asyncio.sleep(current_interval)

# ---- CORRUTINA: Gestión del Sensor de Iluminancia (BH1750) ----
async def illuminance_monitor_task():
    """
    #### Monitoreo de Iluminancia
    * Muestra asíncrona cada 60s sin bloquear tareas críticas.
    * Envía el Batch/Lote/Paquete de 10 lecturas en Buffer (RAM) y lo publica cada 10 min.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps
    from utime import time
    from umqtt.simple2 import MQTTException # type: ignore

    last_lux_publish = time()
    _init_logged = False # Cache de log local para evitar redundancias y errores de atributo
    lux_publish_failures = 0  # [Tolerancia MQTT-3]: Contador de fallos consecutivos

    while True:
        try:
            # ---- [PROGRAMACIÓN ORIENTADA A EVENTOS] ----
            # Si el monitoreo está desactivado (Sincronización Nocturna), 
            # suspendemos la corrutina hasta recibir la señal del procesador MQTT o el arranque.
            if not IS_SAMPLING_LUX:
                if DEBUG and _init_logged:
                    print(f"\n🌙  Illuminance Monitor: {Colors.DIM}Suspended{Colors.RESET}")
                    _init_logged = False

                await illuminance_wake_event.wait()
            
            # Al llegar aquí (por arranque o despertar), si no hemos logueado el estado activo, lo hacemos.
            if DEBUG and not _init_logged:
                print(f"\n☀️  Illuminance Monitor: {Colors.GREEN}Waked{Colors.RESET}")
                _init_logged = True
            
            current_ts = time()

            if illuminance_sensor is not None:
                # Lectura de sensor BH1750 con auto-escala dinámica
                lux_raw = illuminance_sensor.get_auto_luminance()
                if lux_raw is not None:
                    lux_val = round(lux_raw, 1)
                    illuminance_Batch.append(lux_val)
                
                # Publicar Batch cada 10 minutos (600 segundos)
                if current_ts - last_lux_publish >= 600:
                    # Intento de publicación resiliente:
                    # Solo reseteamos el timer si logramos enviar los datos o si el buffer está vacío.
                    if illuminance_Batch.count == 10:
                        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                            # 🔒 Pedimos permiso para usar el socket
                            async with mqtt_lock:
                                # [Escudo de Concurrencia]: Validación de integridad post-await
                                if client and getattr(client, 'sock', None):
                                    # Construcción de JSON manual para ahorrar RAM (Zero-Dict Batching)
                                    data_str = ",".join(['[%d,{"illuminance":%s}]' % (it[0], str(it[1])) for it in illuminance_Batch.get_all()])
                                    payload_batch = '{"data":[%s]}' % data_str
                                    
                                    client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch, qos=0)
                                    
                                    # ÉXITO: Reseteamos cronómetro y limpiamos buffer
                                    last_lux_publish = current_ts
                                    illuminance_Batch.clear()
                                    lux_publish_failures = 0  # Reset en éxito
                                    if DEBUG: print(f"\n☀️  Iluminancia: {Colors.YELLOW}Batch Publicado{Colors.RESET}")
                    else:
                        # Buffer vacío: Reseteamos timer para esperar los próximos 10 min
                        last_lux_publish = current_ts

        except (MQTTException, OSError) as e:
            lux_publish_failures += 1
            if DEBUG: log_mqtt_exception("Error de red en illuminance_monitor_task()", e)
            # [Tolerancia MQTT-3]: Solo matamos el cliente tras 2+ fallos consecutivos
            if lux_publish_failures >= 2:
                force_disconnect_mqtt()
                lux_publish_failures = 0
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"\n⚠️  Error en illuminance_monitor_task(): {e}")
        
        await asyncio.sleep(60)

# ---- CORRUTINA: Gestión del Sensor DHT22 ----
async def climate_monitor_task():
    """
    #### Monitoreo de Temperatura y Humedad Relativa (DHT22)
    * Muestra asíncrona cada 60s (desplazada 5s respecto a lux).
    * Envía 2 batches independientes (temp, hum) cada 10 min.
    * Offset de 2s entre publicaciones para no saturar el stack de red
    """
    from utime import time
    from umqtt.simple2 import MQTTException # type: ignore

    last_dht_publish = time()
    dht_publish_failures = 0  # [Tolerancia MQTT-3]: Contador de fallos consecutivos

    # Offset de 5s para evitar colisión bit-bang vs I2C al inicio de los loops
    await asyncio.sleep(5)

    while True:
        try:
            if dht_sensor is not None:
                try:
                    # dht.measure() es bloqueante (~25ms) y apaga interrupciones.
                    dht_sensor.measure()
                    temp = round(dht_sensor.temperature(), 1)
                    hum  = round(dht_sensor.humidity(), 1)

                    # Validación de rango (descarta lecturas corruptas por ruido)
                    if -10 < temp < 60:
                        temperature_Batch.append(temp)
                    if 0 < hum < 100:
                        humidity_Batch.append(hum)

                except Exception:
                    pass # Lectura fallida (ruido/sensor ocupado). Se ignora.

                # Publicar Batches cada 10 minutos (600 segundos)
                current_ts = time()
                if current_ts - last_dht_publish >= 600:
                    has_temp = temperature_Batch.count > 0
                    has_hum  = humidity_Batch.count > 0

                    if (has_temp or has_hum) and client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        try:
                            # Lote A: Temperatura
                            if has_temp:
                                async with mqtt_lock:
                                    # [Escudo de Concurrencia]: Validación de socket post-await
                                    if client and getattr(client, 'sock', None):
                                        data_str = ",".join(['[%d,{"temperature":%s}]' % (it[0], str(it[1])) for it in temperature_Batch.get_all()])
                                        client.publish(MQTT_TOPIC_EXTERIOR_METRICS, '{"data":[%s]}' % data_str, qos=0)
                                        temperature_Batch.clear()

                            # Offset de 2s entre publicaciones (FUERA del lock)
                            if has_temp and has_hum:
                                await asyncio.sleep(2)

                            # Lote B: Humedad
                            if has_hum:
                                async with mqtt_lock:
                                    # [Escudo de Concurrencia]: Validación de socket post-await
                                    if client and getattr(client, 'sock', None):
                                        data_str = ",".join(['[%d,{"humidity":%s}]' % (it[0], str(it[1])) for it in humidity_Batch.get_all()])
                                        client.publish(MQTT_TOPIC_EXTERIOR_METRICS, '{"data":[%s]}' % data_str, qos=0)
                                        humidity_Batch.clear()

                            if DEBUG: print(f"\n🌡️  DHT22: {Colors.YELLOW}Batches Temp + HRL Publicados{Colors.RESET}")
                            dht_publish_failures = 0  # Reset en éxito
                        except (MQTTException, OSError) as e:
                            dht_publish_failures += 1
                            if DEBUG: log_mqtt_exception("Fallo publicando Batch DHT22", e)
                            # [Tolerancia MQTT-3]: Solo matamos el cliente tras 2+ fallos consecutivos
                            if dht_publish_failures >= 2:
                                force_disconnect_mqtt()
                                dht_publish_failures = 0
                            await check_critical_mqtt_errors(e)

                    # Siempre reseteamos el timer (evita reintentos infinitos en ventanas vacías)
                    last_dht_publish = current_ts

        except (MQTTException, OSError) as e:
            dht_publish_failures += 1
            if DEBUG: log_mqtt_exception("Error de red en climate_monitor_task()", e)
            if dht_publish_failures >= 2:
                force_disconnect_mqtt()
                dht_publish_failures = 0
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"\n⚠️  Error en climate_monitor_task(): {e}")
        
        await asyncio.sleep(60)

# ---- TRABAJADOR UNIFICADO: Sincronización y Batching de Auditorías ----
async def unified_audit_task():
    """
    **TICKER DE AUDITORÍA UNIFICADO: Optimización de Red y Recursos.**
    
    Gestiona todas las auditorías activas en un solo ciclo sincronizado de 60s,
    publicando un único paquete MQTT con todos los datos recolectados.
    """
    from gc    import collect
    from utime import time

    while True:
        try:
            # 1. Verificar si hay alguna auditoría activa
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
            current_ts = time()
            dirty = False

            dht_data = None # Cache temporal para evitar doble lectura del sensor en el mismo ciclo
            
            for category in active_keys:
                sample_fn = AUDIT_SAMPLE_FNS.get(category)
                if not sample_fn: continue

                # Ejecución del muestreo (Soporta síncronas y asíncronas)
                try:
                    # Optimización DHT: Si es temp o hum, usamos la caché del ciclo o leemos una vez
                    if category in ("temp", "hum"):
                        if dht_data is None:
                            dht_data = get_dht_sample()
                        val = dht_data
                    else:
                        res = sample_fn()
                        # En MicroPython, las corrutinas (async def) retornan un generador.
                        # Esta es la forma más ligera y compatible de detectarlas sin romper la RAM.
                        if type(res).__name__ == 'generator':
                            val = await res
                        else:
                            val = res
                except Exception as e:
                    if DEBUG: print(f"⚠️ Error muestreando {category}: {e}")
                    val = None

                if val is not None:
                    # Ensamble manual de la categoría en JSON PLANO (Snapshot)
                    if category == "health":
                        fragments.append('"%s":{"rssi":%d,"ip":"%s"}' % (category, val[0], val[1]))
                    elif category == "ram":
                        fragments.append('"%s":{"f":%d,"a":%d}' % (category, val[0], val[1]))
                    elif category == "temp":
                        fragments.append('"temperature":%s' % (str(val[0])))
                    elif category == "hum":
                        fragments.append('"humidity":%s' % (str(val[1])))
                    elif category == "lux":
                        fragments.append('"illuminance":%s' % (str(val)))
                    elif category == "rain":
                        fragments.append('"rain_intensity":%s' % (str(val)))
                    
                    AUDIT_COUNTERS[category] += 1
                    dirty = True
                    
                    if DEBUG: print(f"\n🔍  [Batch] {category.upper()} #{AUDIT_COUNTERS[category]}: {val}")

                    # Lógica de Auto-Off (10 pts)
                    if AUDIT_COUNTERS[category] >= 10:
                        AUDIT_MODE[category] = False
                        AUDIT_COUNTERS[category] = 0
                        if category in audit_events:
                            audit_events[category].clear()
                        if DEBUG: print(f"\n📡  Auto-OFF: {category.upper()}")
                        await publish_audit_state()

            # ---- 3. Publicación Única (Minimiza contención de Lock y overhead de red) ----
            if dirty and client and getattr(client, 'sock', None):
                # Construcción manual de JSON (Zero-Dict) para el bundle de auditoría
                payload = "{" + ",".join(fragments) + "}"
                try:
                    async with mqtt_lock:
                        client.publish(MQTT_TOPIC_AUDIT, payload, qos=0)
                except Exception as e:
                    if DEBUG: log_mqtt_exception("Fallo publicación Batch de Auditoría", e)
                    # Invalidamos el cliente inmediatamente.
                    force_disconnect_mqtt()
                    await check_critical_mqtt_errors(e)
                # Liberamos memoria de los fragmentos inmediatamente
                del fragments, payload
                collect()

            # ---- 4. Ciclo fijo de 60s (sin interrupciones) ----
            # Eliminamos la re-sincronización por nuevo comando.
            # Cuando ya hay auditorías activas, las nuevas se suman
            # al flujo natural sin romper la cadencia de publicación.
            # audit_master_event solo se usa para despertar al trabajador
            # cuando TODAS las auditorías estaban apagadas (paso 1).
            await asyncio.sleep(60)

        except Exception as e:
            if DEBUG: print(f"⚠️ Error en unified_audit: {e}")
            await asyncio.sleep(10)

# ---- CORRUTINA: Programa Principal ----
async def main():
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc        import collect
    from machine   import WDT
    from network   import STA_IF, WLAN # type: ignore
    from ubinascii import hexlify      # type: ignore

    # ---- Identificación unica del ESP32 ----
    # Obtenemos la MAC del dispositivo
    mac_address = hexlify(WLAN(STA_IF).config('mac')).decode()
    # Construye el client_id único
    client_id = f"ESP32-Actuator-Controller-{mac_address}"

    # ---- Watchdog Timer ----
    # Seguridad de hardware: Si el bucle principal se congela, el dispositivo se reinicia.
    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        if DEBUG:
            print(f"\n🐕  Watchdog: {Colors.YELLOW}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        if DEBUG:
            print(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None

    # ---- Tareas Asíncronas de Red ----
    # (Re)conexión WiFi (Prioridad de red)
    # Iniciamos la tarea de fondo para que gestione futuras reconexiones
    asyncio.create_task(wifi_coro())

    # ---- Inicialización del Hardware ----
    setup_relays()
    setup_sensors()

    # ---- Boot Recovery Check ----
    await boot_recovery_check()

    # ---- Resto de Tareas Asíncronas ----
    # Reconexión MQTT (Depende de WiFi)
    asyncio.create_task(mqtt_connector_task(client_id))
    # Consumidor de mensajes MQTT (Patrón Productor-Consumidor)
    asyncio.create_task(mqtt_processor_task())
    # Publicación de estados (Depende de MQTT)
    asyncio.create_task(state_publisher_task())
    # Gestión de temporizadores
    asyncio.create_task(timer_manager_task())
    # Gestion de la Estación Meteorológica Exterior (eventos de lluvia)
    asyncio.create_task(rain_monitor_task())
    # Gestion de la Estación Meteorológica Exterior (iluminancia)
    asyncio.create_task(illuminance_monitor_task())
    # Gestion del DHT22 Exterior (Clima: Temp + Humedad)
    asyncio.create_task(climate_monitor_task())

    # ---- Auditorías (Unified) ----
    asyncio.create_task(unified_audit_task())

    # ---- Bucle de Supervisión y Recolección de Basura ----
    while True:
        # Alimentar al Watchdog
        if wdt: wdt.feed()

        # Gestión de Memoria Proactiva
        collect()

        # El event loop cede control a todas las tareas asíncronas.
        # intentamos Alimentar al WDT (120s) 5 ~ 6 veces antes de que pueda fallar.
        await asyncio.sleep(20)

# ---- Función Auxiliar: Parada del Programa (Local / Rápida) ----
def stopped_program():
    """
    #### Parada Local de Emergencia
    * Log de parada.
    * Apaga físicamente todos los relés.
    * Publica 'offline' explícitamente para evitar latencias de LWT.
    """
    if DEBUG:
        print(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")

    # Apagamos todos los actuadores
    for relay_info in relays.values():
        try:
            relay_info['pin'].value(0)
            relay_info['state'] = 'OFF'
        except Exception:
            pass 

    # Publicamos 'offline' explícitamente antes de la desconexión limpia.
    # Es VITAL usar retain=True para que el estado persista tras el DISCONNECT.
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            # Flush de batches acumulados antes de desconectar
            flush_telemetry_batches()

            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
            from utime import sleep_ms
            sleep_ms(300) 
        except:
            pass

    # Invalidamos el cliente MQTT forzando una reconexión completa.
    force_disconnect_mqtt()

    # Desconectamos el WiFi.
    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            if DEBUG:
                print(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

# ---- Punto de Entrada ----
if __name__ == '__main__':
    try:
        # Iniciar loop asíncrono
        asyncio.run(main())
    except KeyboardInterrupt:
        stopped_program()
    except Exception as e:
        if DEBUG:
            print(f"\n\n❌  Error fatal no capturado: {Colors.RED}{e}{Colors.RESET}\n\n")
        # En caso de error fatal en el Loop principal, intentamos apagar y resetear
        try:
            safe_reset()
        except:
            pass

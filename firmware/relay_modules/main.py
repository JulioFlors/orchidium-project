# -----------------------------------------------------------------------------
# Relay Modules: Actuator Controller Firmware.
# Descripción: Firmware dedicado para el control de las electroválvulas, la bomba
#              y la estación meteorológica exterior (lluvia, iluminancia, presión).
# Fecha: 05-04-2026
# Versión: v0.9.1
# notes_release: [🌦️ Estación Meteorológica / 🛡️ Auditoría]: Refactorización masiva a corrutinas independientes basadas en eventos (RAM, Lux, Presión, Lluvia, Salud). Eliminación definitiva de 'unified_audit_task' y 'audit_wake_event' para optimizar RAM. Robustez MQTT optimizada (log_mqtt_exception en handlers individuales).
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

# ---- Configuración MQTT (Constantes const() para ahorro de RAM) ----
# El broker esperará ~1.5x este valor antes de desconectar al cliente.
MQTT_KEEPALIVE       = const(60) # ~1.5x = 90 seg
# Intervalo para enviar pings de 'keepalive' al broker MQTT.
MQTT_PING_INTERVAL   = const(30) # keepalive//2
# Intervalo para revisar mensajes MQTT entrantes.
MQTT_CHECK_INTERVAL  = const(1)  # seg
# tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
# Optimizado para redes lentas con latencia de subida >500ms
MQTT_SOCKET_TIMEOUT  = const(20) # seg
# tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
# [WDT Safety]: Debe ser MENOR que el Watchdog de Hardware (120s)
MQTT_MESSAGE_TIMEOUT = const(30) # seg

# ---- Configuración Resiliencia / Watchdog ----
# Tiempo máximo sin conexión MQTT/WiFi antes de forzar un Hard Reset (10 minutos)
MAX_OFFLINE_RESET_SEC = const(600)
# Tiempo del Watchdog Timer (Hardware) en milisegundos (120 segundos (2 min))
# [WDT Safety]: Debe ser mayor que SOCKET_TIMEOUT y MESSAGE_TIMEOUT para evitar reinicios durante operaciones lentas.
WDT_TIMEOUT_MS = const(120000)
# Tamaño máximo de la cola de mensajes MQTT para evitar OOM
MAX_BUFFER_SIZE = const(15)


# ---- Tópicos MQTT Pre-calculados (Optimización de RAM) ----
# Usamos b"" (bytes) y constantes para evitar concatenación en tiempo de ejecución.

# ---- Sistema y Conectividad (Diagnóstico/LWT) ----
# [LWT/Status]: Indica si el dispositivo está "online" u "offline" (usado para Last Will).
MQTT_TOPIC_STATUS         = const(b"PristinoPlant/Actuator_Controller/status")

# [Audit Data]: Canal para streaming de datos unificados (RAM, NVS, Lux history, pressure, etc).
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
MQTT_TOPIC_RAIN_STATE     = const(b"PristinoPlant/Weather_Station/Exterior/rain/state")

# [Rain Measurement]: Envío de fin de evento. Incluye duración (segundos) e intensidad promedio (%).
MQTT_TOPIC_RAIN_EVENT     = const(b"PristinoPlant/Weather_Station/Exterior/rain/event")

# [Exterior Metrics]: Batch de lecturas ambientales (lux, presión, etc).
MQTT_TOPIC_EXTERIOR_METRICS = const(b"PristinoPlant/Weather_Station/Exterior/readings")
MQTT_TOPIC_FILTER_STATUS  = const(b"PristinoPlant/Weather_Station/Exterior/filter/status")

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = const(b"offline")

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
illuminance_sensor     = None # BH1750 (I2C)
rain_sensor_analog     = None # Sensor de gotas de lluvia (ADC)
pressure_sensor_analog = None # Transductor de presión 150PSI (ADC)
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
    "pressure": asyncio.Event(),
    "rain":     asyncio.Event(),
    "ram":      asyncio.Event(),
    "health":   asyncio.Event()
}

# Evento asíncrono para despertar a la tarea de procesamiento de mensajes MQTT
mqtt_msg_event = asyncio.Event()

# Evento asíncrono para despertar al gestor de temporizadores
timer_wake_event = asyncio.Event()

# Candado asíncrono para evitar colisiones en el socket SSL
mqtt_lock = asyncio.Lock()

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

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
    "pressure": False,
    "health": False,
    "ram": False
}

# Contadores para el Auto-Apagado de auditorías (RAM)
AUDIT_COUNTERS = {
    "rain": 0,
    "lux": 0,
    "pressure": 0,
    "health": 0,
    "ram": 0
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

# Buffers de Telemetría
illuminance_Batch = RingBuffer(10)
pressure_Batch    = RingBuffer(10)
rain_Batch        = RingBuffer(20)

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
        key = task_data.get('key', str(task_data['actuator_id']))
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
def publish_audit_state():
    """Publica el diccionario AUDIT_MODE para sincronizar con el frontend."""
    from ujson import dumps
    from umqtt.simple2 import MQTTException # type: ignore
    try:
        # Sincronización MQTT con validación de socket
        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            # Creamos un payload que combina el modo de auditoría deseado
            # con el estado real de conexión del hardware
            payload_dict = AUDIT_MODE.copy()
            payload_dict["lux_hw"]      = illuminance_sensor is not None
            payload_dict["rain_hw"]     = rain_sensor_analog is not None
            payload_dict["pressure_hw"] = pressure_sensor_analog is not None
            
            payload = dumps(payload_dict)
            # 🔒 Pedimos permiso para usar el socket
            async def _publish():
                try:
                    async with mqtt_lock:
                        client.publish(MQTT_TOPIC_AUDIT_STATE, payload.encode('utf-8'), retain=True, qos=1)
                except (MQTTException, OSError) as e:
                    if DEBUG: log_mqtt_exception("Fallo sincronización estado auditoría", e)
                    force_disconnect_mqtt()
                except Exception as e:
                    if DEBUG: print(f"⚠️ Error inesperado en _publish audit: {e}")
            
            import uasyncio as asyncio # type: ignore
            asyncio.create_task(_publish())

    except Exception as e:
        if DEBUG: print(f"⚠️ Error preparando payload de auditoría: {e}")

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
    try:
        # 1. Guardamos el estado de las válvulas para que sobrevivan al reinicio
        NVSManager.prepare_reset_backup()
        # 2. Nos desconectamos educadamente del Router y del Broker
        shutdown()
    except: pass

    from machine import reset # type: ignore
    reset()

# ---- Función Auxiliar: Boot Recovery (Recuperación Inteligente) ----
async def boot_recovery_check():
    """
    Verifica si hubo un reinicio durante una tarea activa.
    Restaura el estado solo si está dentro de la ventana de oportunidad.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import localtime, time # type: ignore

    if DEBUG:
        print(f"\n🔍  {Colors.BLUE}Verificando NVS Recovery{Colors.RESET}")

    # ---- 2. Restaurar Tareas de Riego ----
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
            print(f"        └─ Cancelando recuperación por seguridad.")
        NVSManager.clear_task()
        return
    
    # Ventana de oportunidad (20 min) para recuperar un riego interrumpido.
    RECOVERY_WINDOW = 1200 

    # ---- Análisis Temporal (Iterando todas las tareas) ----
    # 2026-Fix: Iteramos sobre los values del diccionario
    for task_data in all_tasks.values():
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
                if time_failed_start < RECOVERY_WINDOW:
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
                if elapsed_offline > RECOVERY_WINDOW:
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
                try: NVSManager.save_task(task_data)
                except: pass
                
            else:
                NVSManager.clear_task(actuator_id)

            continue # Salta el resto de la lógica para este task

        # Caso A: A tiempo (Aún debería estar regando)
        if remaining_time > 0:
            if DEBUG:
                print(f"    ├─ {Colors.GREEN}RECUPERANDO{Colors.RESET} ID:{actuator_id}")
                print(f"    │   └─ Faltan: {remaining_time}s")
            
            # Restaurar Relé
            if actuator_id in relays:
                target_relay = relays[actuator_id]
                target_relay['pin'].value(1) # ON
                target_relay['state'] = 'ON'
                target_relay['task_id'] = task_id
                state_changed.set()
                
                # Reprogramar Timer
                active_irrigation_timers.append((actuator_id, current_time + remaining_time))
                if DEBUG:
                    print(f"    └─ Actuador: {target_relay['name']} -> ON")
            else:
                if DEBUG:
                    print(f"    └─ ⚠️  Error: Actuador {actuator_id} no encontrado.")
                NVSManager.clear_task(actuator_id) # Borramos solo esta mala

        # Caso B: Tarea Expirada
        else:
            if DEBUG:
                print(f"    └─ 🗑️  {Colors.YELLOW}Tarea Vencida{Colors.RESET} ID:{actuator_id} (No reanudar)")
            if actuator_id in relays:
                relays[actuator_id]['task_id'] = ""
            NVSManager.clear_task(actuator_id)

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
    global illuminance_sensor, rain_sensor_analog, pressure_sensor_analog, i2c_bus, BH1750

    # 1. Sensor de Iluminancia (BH1750 / I2C)
    # [Diagnóstico Exhaustivo]: Prueba múltiples configuraciones, ambas direcciones
    # (0x23 y 0x5C), SoftI2C y Hardware I2C, y escanea el bus completo si todo falla.
    try:
        # (Optimización de memoria RAM)
        # Lazy Imports (Importación tardía)
        from machine import ADC, I2C, Pin, SoftI2C # type: ignore
        from utime import sleep_ms # type: ignore

        # ---- FASE 0: Diagnóstico eléctrico de los pines I2C ----
        if DEBUG:
            print(f"\n☀️  BH1750: {Colors.CYAN}Diagnóstico I2C Exhaustivo{Colors.RESET}")
            # Leemos el estado eléctrico de SDA y SCL como entradas con pull-up
            pin_sda = Pin(21, Pin.IN, Pin.PULL_UP)
            pin_scl = Pin(22, Pin.IN, Pin.PULL_UP)
            sleep_ms(10)
            sda_val = pin_sda.value()
            scl_val = pin_scl.value()
            res_msg = "✅ OK" if (sda_val == 1 and scl_val == 1) else "⚠️  ALERTA: líneas en LOW (corto o falta Pull-up)"
            print("    ├─ Pins Eléctricos: SDA(21)={} SCL(22)={} -> {}".format(sda_val, scl_val, res_msg))

        BH1750_ADDRS = [0x23, 0x5C]  # LOW=0x23, HIGH=0x5C

        # Matriz de Failsafe ordenados: (tipo_bus, freq_hz, timeout_us, label)
        # Priorizamos HW I2C por eficiencia, pero bajamos a SoftI2C para robustez en 10m CAT6.
        FAILSAFE_CONFIGS = [
            ("hw",   100000,   0,       "Hardware I2C 100kHz"),
            ("soft", 50000,    200000,  "SoftI2C 50kHz (Robust)"),
            ("soft", 10000,    500000,  "SoftI2C 10kHz (Low Speed 10m)"),
        ]

        MAX_RETRIES = 3
        SETTLE_MS = 250  # Pausa generosa para estabilización eléctrica
        sensor_connected = False

        if DEBUG:
            print(f"\n☀️  BH1750: {Colors.CYAN}Iniciando Failsafe en Cascada{Colors.RESET}")

        for bus_type, freq, timeout, label in FAILSAFE_CONFIGS:
            if sensor_connected:
                break

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    # Crear bus según nivel de cascada actual
                    if bus_type == "soft":
                        i2c_bus = SoftI2C(scl=Pin(22), sda=Pin(21), freq=freq, timeout=timeout)
                    else:
                        i2c_bus = I2C(0, scl=Pin(22), sda=Pin(21), freq=freq)

                    # Estabilización eléctrica tras el reset/creación del bus
                    sleep_ms(SETTLE_MS)

                    # Seleccionamos la dirección por defecto (0x23)
                    addr = 0x23
                    
                    # Ping directo al sensor
                    i2c_bus.writeto(addr, b'')

                    # Instanciamos el driver (incluye RESET interno)
                    try:
                        from bh1750 import BH1750 # type: ignore
                    except ImportError as e:
                        if DEBUG: print(f"    ├─ ❌ Error al importar bh1750: {e}")
                        return

                    illuminance_sensor = BH1750(bus=i2c_bus, addr=addr)
                    
                    # Pausa obligatoria para despertar tras reset
                    sleep_ms(200)
                    lux_test = illuminance_sensor.luminance(BH1750.CONT_HIRES_1)

                    if DEBUG:
                        print(f"    └─ ✅ {Colors.GREEN}CONECTADO{Colors.RESET} con [{label}] (Intento {attempt})")
                        print(f"       Lectura inicial: {Colors.CYAN}{lux_test} lux{Colors.RESET}")

                    sensor_connected = True
                    break  # Salimos de esta fase de reintentos con éxito

                except OSError:
                    # Ocurrió un error en esta config. Si es el último intento, seguimos a la siguiente fase de la cascada.
                    if DEBUG and attempt == MAX_RETRIES:
                        print(f"    ├─ ⚠️  Fallo [{label}] - Reintentando siguiente nivel")
                    sleep_ms(SETTLE_MS)

        # ---- FASE 2: Si todo los niveles de la cascada fallaron, escaneo completo del bus ----
        if not sensor_connected:
            if DEBUG:
                print(f"    ├─ Fase 2: {Colors.YELLOW}Escaneando bus I2C completo...{Colors.RESET}")

            # Usamos la config más conservadora para el scan
            scan_bus = SoftI2C(scl=Pin(22), sda=Pin(21), freq=5000, timeout=1000000)
            sleep_ms(500)

            try:
                devices = scan_bus.scan()
                if devices:
                    hex_list = ', '.join([f"0x{d:02X}" for d in devices])
                    if DEBUG:
                        print(f"    ├─ 🔍 {Colors.GREEN}Dispositivos encontrados:{Colors.RESET} [{hex_list}]")

                    # Si encontramos alguna de las direcciones conocidas, intentar de nuevo
                    for found_addr in devices:
                        if found_addr in BH1750_ADDRS:
                            try:
                                from bh1750 import BH1750 # type: ignore
                                illuminance_sensor = BH1750(bus=scan_bus, addr=found_addr)
                                sleep_ms(180)
                                lux_test = illuminance_sensor.luminance(BH1750.CONT_HIRES_1)
                                i2c_bus = scan_bus
                                sensor_connected = True
                                winning_addr = found_addr
                                if DEBUG:
                                    print(f"    ├─ ✅ {Colors.GREEN}CONECTADO{Colors.RESET} [Scan Recovery] addr=0x{found_addr:02X}")
                                    print(f"    └─ Lectura: {Colors.CYAN}{lux_test} lux{Colors.RESET}")
                                break
                            except:
                                pass
                else:
                    if DEBUG:
                        print("    ├─ 🔍 Bus vacío: Ningún dispositivo responde.")
                        print("    ├─ Tips 10m CAT6:")
                        print("    │   • Evitar SDA y SCL en el mismo par trenzado (crosstalk).")
                        print("    │   • Probar Pull-ups externos fuertes (4.7k o 2.2k).")
                        print("    │   • Verificar VCC (5V en sensor, pero lógica 3.3V).")
            except Exception as e:
                if DEBUG:
                    print(f"    ├─ ⚠️  Error durante scan: {e}")

            if not sensor_connected and not illuminance_sensor:
                if DEBUG:
                    print(f"    └─ ❌ {Colors.RED}BH1750 NO DETECTADO{Colors.RESET}")
                illuminance_sensor = None
                i2c_bus = None

    except Exception as e:
        if DEBUG: print(f"❌ Sensor BH1750 Desconectado: {Colors.RED}[{e}]{Colors.RESET}")
        illuminance_sensor = None

    # 2. Sensor de Lluvia (Salida Analógica)
    try:
        from utime import sleep_ms # type: ignore
        adc_rain = ADC(Pin(35))
        adc_rain.atten(ADC.ATTN_11DB) # Rango 0-3.3V
        
        # [Oversampling de Arranque]: Tomamos 10 muestras para descartar ruido de pin flotante
        r_sum = 0
        for _ in range(10):
            r_sum += adc_rain.read()
            sleep_ms(10)
        r_avg = r_sum // 10

        # Validación Inicial (Sondeo): Un cable suelto genera ruido de ~1000.
        # Un sensor conectado y SECO debe entregar > 3500.
        # Si lee < 1500 en el arranque, se considera desconectado o ruidoso.
        if r_avg > 1500:
            rain_sensor_analog = adc_rain
        else:
            if DEBUG: print(f"❌  Sensor Lluvia: {Colors.RED}Desconectado{Colors.RESET} (Ruido/Antena: {r_avg})")
            rain_sensor_analog = None

    except Exception as e:
        if DEBUG: print(f"❌  Sensor Lluvia: {Colors.RED}{e}{Colors.RESET}")
        rain_sensor_analog = None

    # 3. Transductor de Presión 150PSI (Salida Analógica)
    try:
        from utime import sleep_ms # type: ignore
        adc_pressure = ADC(Pin(34))
        adc_pressure.atten(ADC.ATTN_11DB) # Rango 0-3.3V
        
        # [Oversampling de Arranque]
        p_sum = 0
        for _ in range(10):
            p_sum += adc_pressure.read()
            sleep_ms(10)
        p_avg = p_sum // 10

        # [MODO CALIBRACIÓN]: Forzamos la conexión sin importar si lee 0 o ruido.
        # Esto permite que la corrutina pressure_audit_task pueda leer el ADC 
        # y enviarlo por MQTT para descubrir el offset real del hardware.
        pressure_sensor_analog = adc_pressure
        if DEBUG: print(f"💧  Transductor Presión: {Colors.CYAN}Modo Calibración{Colors.RESET} (Lectura Raw inicial: {p_avg})")

    except Exception as e:
        if DEBUG: print(f"❌  Transductor Presión: {Colors.RED}{e}{Colors.RESET}")
        pressure_sensor_analog = None

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
                        client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=1)
            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo en el ACK del comando", e)
                force_disconnect_mqtt()
            except Exception: pass

            # ---- 🛡️ Lógica del Sistema de Comandos (/cmd) ----
            if topic == MQTT_TOPIC_CMD:
                # Comando: RESET
                if msg.lower() == b"reset":
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

                # Comando: audit_nvs (Dump recovery.json por Chunks para ahorrar RAM)
                elif msg.lower() == b"audit_nvs":
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
                        force_disconnect_mqtt()
                        await check_critical_mqtt_errors(e)
                        await asyncio.sleep(2)
                    except Exception as e:
                        if DEBUG: print(f"    └─ ⚠️  Error enviando NVS: {e}")

                # ---- COMANDOS DE AUDITORÍA ----
                # Procesamos bytes crudos y solo decodificamos lo necesario
                m_low = msg.lower()
                if m_low.startswith(b"audit_") and m_low.endswith((b"_on", b"_off")):
                    parts = m_low.split(b"_")
                    if len(parts) == 3:
                        # [Lazy Decoding]: Decodificamos solo la categoría para el diccionario
                        category = parts[1].decode('utf-8')
                        action   = parts[2]
                        
                        if category in AUDIT_MODE:
                            if action == b"on":
                                AUDIT_MODE[category] = True
                                AUDIT_COUNTERS[category] = 0 # Reiniciamos contador efímero
                                if category in audit_events:
                                    audit_events[category].set() # Despertamos la corrutina específica
                                if DEBUG: print(f"    └─ AUDIT {category.upper()}: {Colors.GREEN}ON{Colors.RESET}")
                            elif action == b"off":
                                AUDIT_MODE[category] = False
                                if category in audit_events:
                                    audit_events[category].clear() # Detenemos la corrutina específica

                                collect()
                                if DEBUG: print(f"    └─ AUDIT {category.upper()}: {Colors.RED}OFF{Colors.RESET}")
                            
                            publish_audit_state()
                        del category, action
                    del parts
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
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(2)
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

# ---- FUNCIÓN AUXILIAR: Gestión de desconexión (Graceful Shutdown - Relay Modules) ----
def shutdown():
    """
    **Apagado Controlado (Relay Modules))**
    * Publica `offline` explícitamente.
    * Apaga fisicamente todos los relés.
    * Publica el estado `OFF` de todos los relés.
    * Desconecta MQTT y WiFi.
    """

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
            # Publicamos el LWT explícitamente para que el broker lo retenga.
            # El LWT para el cliente MQTT solo se envía si el cliente se desconecta inesperadamente. 
            # Si nos desconectamos limpiamente,
            # el broker no lo envía automáticamente.
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)

            # Publicamos 'OFF' para cada relé que haya cambiado de estado.
            for relay_info in relays.values():
                if relay_info['last_published_state'] != 'OFF':
                    client.publish(relay_info['topic'], b"OFF", retain=True, qos=1)
        except: pass

    # Invalidamos el cliente MQTT forzando una reconexión completa.
    force_disconnect_mqtt()

    # Desconectamos el WiFi.
    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
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
    
    # [CRÍTICO] Si es Fallo SSL (-17040), Handshake/Red (-202) o Memoria (12)
    # No tiene sentido reintentar en bucle si el socket o la RAM fallan físicamente.
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -202, 12]:
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
    from utime         import ticks_ms, ticks_diff, time # type: ignore

    # =========================================================================
    # 🩹 MONKEY-PATCHING: Optimizaciones inyectadas a la librería MQTT
    # =========================================================================

    # 🩹 Parche 1: SSL / Escritura Robusta (Sobrevive a buffer Lleno/Red saturada)
    def _robust_write(self, bytes_wr, length=-1):
        """Asegura que todos los bytes se envíen, con protección Anti-Deadlock."""
        from utime import sleep_ms, ticks_ms, ticks_diff # type: ignore

        data = bytes_wr if length == -1 else bytes_wr[:length]
        total_written = 0 # bytes transferidos
        timeout_start = ticks_ms() # <--- CRONÓMETRO DE SEGURIDAD
        
        while total_written < len(data):
            self._sock_timeout(self.poller_w, self.socket_timeout)
            try:
                written = self.sock.write(data[total_written:])
            except AttributeError:
                raise MQTTException(8)
            except OSError:
                raise MQTTException(3) # Red muerta / Fallo de escritura
            
            if written is None:
                # Si han pasado más de 'socket_timeout' segundos atascados aquí, ABORTAMOS.
                if ticks_diff(ticks_ms(), timeout_start) > (self.socket_timeout * 1000):
                    raise MQTTException(3) # Timeout de escritura (Evita el WDT Crash)
                
                # El búfer está lleno, esperamos antes de reintentar.
                # 300ms da tiempo al stack TCP para drenar en redes lentas (>500ms latencia)
                sleep_ms(300)
                continue
            
            if written == 0:
                raise MQTTException(3) # Conexión cerrada abruptamente

            total_written += written
            # Reseteamos el cronómetro si logramos empujar datos exitosamente
            timeout_start = ticks_ms()

        return total_written

    # 🩹 Parche 2: Lectura Resiliente (Evita bloqueos Zombie en Caídas)
    def _resilient_read(self, expected_length):
        """Maneja interrupciones de red TCP/SSL limpiamente, evitando bucles infinitos."""
        if expected_length < 0:
            raise MQTTException(2)
        
        buffer = b''
        while len(buffer) < expected_length:
            try:
                # Calculamos cuántos bytes faltan por leer
                bytes_to_read = expected_length - len(buffer)
                chunk = self.sock.read(bytes_to_read)
            except OSError as error:
                err_code = error.args[0] if error.args else 0
                
                # 11 = EAGAIN / EWOULDBLOCK (No hay datos aún)
                # 110 = ETIMEDOUT (Timeout estándar)
                # 116 / -116 = Timeout específico de MbedTLS / LwIP en ESP32
                if err_code in (11, 110, 116, -116):
                    chunk = None
                else:
                    # Fallo fatal de red (ej. ECONNRESET), traducimos a error MQTT
                    raise MQTTException(2) 
            except AttributeError:
                raise MQTTException(8)
            
            if chunk is None:
                # No hay datos listos, esperamos usando el poller
                self._sock_timeout(self.poller_r, self.socket_timeout)
                continue
            
            if chunk == b'':
                raise MQTTException(1) # Conexión cerrada limpiamente por el host
            else:
                buffer += chunk
                
        return buffer

    # 🩹 Parche 3: Timeout sin Fuga de RAM (Evita .items() en diccionario de pings)
    def _ram_safe_message_timeout(self):
        """Limpia los PIDs vencidos sin crear copias costosas del diccionario en RAM."""
        current_time = ticks_ms()
        expired_pids = []
        
        # Iteramos solo sobre las llaves (keys) para no clonar todo en memoria
        for pid in self.rcv_pids:
            expected_timeout = self.rcv_pids[pid]
            # ticks_diff maneja correctamente el desbordamiento (rollover) del reloj
            if ticks_diff(expected_timeout, current_time) <= 0:
                expired_pids.append(pid)
                
        # Procesamos la limpieza después de la iteración
        for pid in expired_pids:
            self.rcv_pids.pop(pid)
            self.cbstat(pid, 0) # Informamos el estado de timeout al callback

    # 💉 Inyección de los parches a la clase ANTES de instanciarla
    MQTTClient._write = _robust_write
    MQTTClient._read = _resilient_read
    MQTTClient._message_timeout = _ram_safe_message_timeout
    
    # =========================================================================

    # Definimos el timeout (ms)
    # [WDT Safety]: Debe ser mayor que MQTT_SOCKET_TIMEOUT
    wd_timeout_ms = (MQTT_SOCKET_TIMEOUT + 5) * 1000

    # Cronómetro de fallas de conexión MQTT
    mqtt_disconnect_start = None
    last_manual_ping = ticks_ms()

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

                # Inicializa el Cliente MQTT
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
                    log_disk_usage()
                    log_ram_usage()
                    print(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

                try:
                    # Para persistencia, clean_session debe ser False. 
                    # Esto permite que el Broker guarde las suscripciones y mensajes QOS 1 mientras estemos offline.
                    client.connect(clean_session=True)
                finally:
                    # SI la función retorna con éxito.
                    # desactivamos el timer.
                    wd_timer.deinit()

                    # Reseteamos cronómetro.
                    mqtt_disconnect_start = None

                if DEBUG:
                    print(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Publicamos que estamos ONLINE
                # retain=True: El último estado se queda en el Broker para nuevos suscriptores
                # qos=1: Asegura que el mensaje llegue al menos una vez
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

                # Publica el estado actual de las auditorías (Digital Twin) tras conectar
                publish_audit_state()

                # Suscripción a tópicos
                client.subscribe(MQTT_TOPIC_CMD, qos=1)
                client.subscribe(MQTT_TOPIC_IRRIGATION_CMD, qos=1)

                # Resincronizamos los estados de los actuadores.
                for relay_info in relays.values():
                    relay_info['last_published_state'] = None

                # [Estabilización] Esperamos 2s a que se envíen los paquetes de suscripción y status (QoS 1)
                # Esto "vacia" el buffer de salida TCP antes de la ráfaga de estados.
                await asyncio.sleep(2)

                # Notifica el cambio de estado
                state_changed.set()

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Fallo la Conexión MQTT", e)
                
                await check_critical_mqtt_errors(e)

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff para no saturar el BROKER
                await asyncio.sleep(5)
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
                        # Revisamos si hay mensajes entrantes
                        # Procesa PINGRESP y actualiza client.last_cpacket
                        client.check_msg()
                    finally:
                        mqtt_lock.release()

                # Extracción de un único timestamp global para esta iteración
                now_ms = ticks_ms()
                
                # Ping Manual + Heartbeat Integrado
                # Enviamos el ping basado en nuestro propio cronómetro para mayor control
                if ticks_diff(now_ms, last_manual_ping) > (MQTT_PING_INTERVAL * 1000):
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        client.ping()
                        # Heartbeat integrado: publicamos "online" en el MISMO lock
                        # que el ping para eliminar la contención que causaba heartbeat_task.
                        # El frontend (useDeviceHeartbeat) necesita recibir "online" cada ~30s
                        # para no declarar al dispositivo como zombie/offline.
                        # qos=0: Fire-and-forget (idempotente, tolerante a pérdida)
                        client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)
                    # Actualizar last_cpacket: si podemos ENVIAR, el socket está vivo
                    client.last_cpacket = ticks_ms()
                    if DEBUG: print(f"📡  MQTT: {Colors.CYAN}Ping de vida enviado{Colors.RESET}")
                    last_manual_ping = now_ms

                # Comprobamos si ha pasado demasiado tiempo desde que OÍMOS al broker
                # Damos un margen de 1.5x el KEEPALIVE
                if ticks_diff(now_ms, client.last_cpacket) > (MQTT_KEEPALIVE * 1500):
                    # Lanzamos excepción personalizada para ser capturada con prefijo [Zombie]
                    raise MQTTSessionZombie("Inactividad del broker MQTT excedida")
                
                await asyncio.sleep(MQTT_CHECK_INTERVAL)

            except (MQTTException, OSError) as e:
                if DEBUG: log_mqtt_exception("Error en Operación MQTT", e)

                await check_critical_mqtt_errors(e)

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Reset del cronómetro de ping para la próxima conexión
                last_manual_ping = ticks_ms()
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

                    # Log del evento automático
                    if DEBUG:
                        print(f"\n⏰  {Colors.YELLOW}Temporizador Finalizado{Colors.RESET}")
                        print(f"    └─ Acción: Apagando {Colors.MAGENTA}{target_relay['name']}{Colors.RESET}")
                    
                    # ---- Limpieza de Bitácora (NVS) ----
                    # La tarea terminó exitosamente, borramos el registro ESPECÍFICO.
                    NVSManager.clear_task(actuator_id)
            else:
                # Si no ha vencido, lo conservamos en la lista
                timers_to_keep.append((actuator_id, end_time))

        # Actualizamos la lista global solo con los pendientes
        active_irrigation_timers = timers_to_keep

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
            # Construimos el Snapshot total de estados
            snapshot = {}
            for r_id, r_info in relays.items():
                snapshot[r_info['name']] = {
                    "state": r_info['state'],
                    "task_id": r_info.get('task_id', ''),
                    "id": r_id
                }

            # 🔒 Pedimos permiso para usar el socket
            async with mqtt_lock:
                # Publicamos SOLO al tópico Unificado (/state)
                # El frontend (ControlPanel) y el scheduler ya consumen exclusivamente este tópico.
                # Eliminamos las publicaciones individuales legado para reducir el tiempo
                # de retención del lock de ~3.5s a ~600ms en redes lentas.
                client.publish(MQTT_TOPIC_STATE, dumps(snapshot), retain=True, qos=0)

            # Marcamos como publicadas
            for relay_info in updates_pending:
                relay_info['last_published_state'] = relay_info['state']
                # [Smart Cleanup]: Si el relé se apagó, ahora sí limpiamos su ID de la RAM 
                # tras habernos asegurado de que se envió al Broker/Scheduler en el snapshot.
                if relay_info['state'] == 'OFF':
                    relay_info['task_id'] = ""
            
            if DEBUG: print(f"    └─ Snapshot {Colors.GREEN}Enviado{Colors.RESET}")

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Fallo al publicar el Snapshot de los Relays", e)
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

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps
    from utime import ticks_ms, ticks_diff
    from umqtt.simple2 import MQTTException # type: ignore

    # Umbrales (ADC 0-4095)
    RAIN_START_VALUE  = 2300 # Mojado
    RAIN_STOP_VALUE   = 2800 # Seco
    RAW_INTENSITY_MIN = 1700 # 100%
    
    # Tiempos de Configuración
    INTERVAL_NORMAL = 600 # 10 minutos
    INTERVAL_BURST  = 60  # 1 minuto
    TARGET_SAMPLES  = 20

    # Estado Inicial
    current_interval = INTERVAL_NORMAL
    current_state    = 'Dry'
    rain_samples     = 0
    rain_start_ticks = 0
    rain_total_int   = 0

    while True:
        try:
            if rain_sensor_analog is None:
                await asyncio.sleep(INTERVAL_NORMAL)
                continue

            # Oversampling no bloqueante (20 muestras cada 50ms = 1s total)
            raw_sum = 0
            valid_samples = 0
            for _ in range(TARGET_SAMPLES):
                try:
                    raw_sum += rain_sensor_analog.read()
                    valid_samples += 1
                except Exception:
                    pass
                await asyncio.sleep_ms(50)

            if valid_samples == 0:
                if DEBUG: print(f"    ├─ ⚠️  Lluvia: No hay muestras válidas (0/{TARGET_SAMPLES})")
                await asyncio.sleep(current_interval)
                continue

            raw = int(raw_sum / valid_samples)

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
                
                # Sincronización MQTT con validación de socket
                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        client.publish(MQTT_TOPIC_RAIN_STATE, b"Raining", retain=True, qos=0)
                if DEBUG: print(f"    ├─ 🌧️  Lluvia INICIADA (Raw: {raw}) | Modo Ráfaga: {INTERVAL_BURST}s")

            # ---- ESTADO B: Lloviendo (Acumulando) ----
            elif current_state == 'Raining':
                if raw <= RAIN_STOP_VALUE:
                    rain_total_int += intensity
                    rain_samples += 1
                    # Guardamos la intensidad en el batch para el gráfico
                    rain_Batch.append(intensity)

                # Si el batch se llena, enviamos un adelanto (cada 10 muestras / 10 min de ráfaga)
                if rain_samples % 10 == 0:
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        from utime import time as utime_time
                        history_data = [[item[0], {"rain_intensity": item[1]}] for item in rain_Batch.get_all()]
                        payload_batch = dumps({"history": history_data})
                        async with mqtt_lock:
                            client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch.encode('utf-8'), qos=0)
                            rain_Batch.clear()
                            if DEBUG: print(f"    ├─ 🌧️  Enviando Batch de Lluvia Intermedio")

                # ---- ESTADO C: Termina la lluvia (Publicación del evento final) ----
                if raw > RAIN_STOP_VALUE:
                    current_state = 'Dry'
                    current_interval = INTERVAL_NORMAL
                    
                    duration_ms = ticks_diff(ticks_ms(), rain_start_ticks)
                    duration_sec = duration_ms // 1000
                    avg_int = round(rain_total_int / rain_samples) if rain_samples > 0 else 0
                    
                    # Sincronización MQTT con validación de socket
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        payload = dumps({"duration_seconds": duration_sec, "average_intensity_percent": avg_int})
                        # Preparamos el batch final si quedaron muestras
                        history_data = [[item[0], {"rain_intensity": item[1]}] for item in rain_Batch.get_all()]
                        payload_batch = dumps({"history": history_data})
                        
                        # 🔒 Pedimos permiso para usar el socket
                        async with mqtt_lock:
                            client.publish(MQTT_TOPIC_RAIN_STATE, b"Dry", retain=True, qos=0)
                            client.publish(MQTT_TOPIC_RAIN_EVENT, payload.encode('utf-8'), qos=1)
                            # Enviamos el último lote de ráfaga
                            if history_data:
                                client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch.encode('utf-8'), qos=0)
                        
                        rain_Batch.clear()
                    
                    if DEBUG: print(f"    ├─ ☀️  Lluvia TERMINADA. Dur:{duration_sec}s, Int:{avg_int}% | Modo Vigía: {INTERVAL_NORMAL}s")

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Error de red en rain_monitor_task()", e)
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"    ├─ ⚠️  Error en rain_monitor_task(): {e}")
        
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

    # Esperamos 10s tras el arranque para no colisionar con LWT u otras tareas
    await asyncio.sleep(10)

    while True:
        try:
            current_ts = time()

            if illuminance_sensor is not None:
                # Lectura de sensor BH1750 en modo de alta resolución continua
                lux_val = round(illuminance_sensor.luminance(BH1750.CONT_HIRES_1), 1)
                illuminance_Batch.append(lux_val)
                
                # Publicar Batch cada 10 minutos (600 segundos)
                if current_ts - last_lux_publish >= 600:
                    # Sincronización MQTT con validación de socket
                    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                        # 🔒 Pedimos permiso para usar el socket
                        async with mqtt_lock:
                            # Mapeamos el RingBuffer al formato: [[ts, {"illuminance": val}]]
                            history_data = [[item[0], {"illuminance": item[1]}] for item in illuminance_Batch.get_all()]
                            payload_batch = dumps({"history": history_data})
                            
                            client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch.encode('utf-8'), qos=0)
                            last_lux_publish = current_ts
                            illuminance_Batch.clear()
                            if DEBUG: print(f"    ├─ ☀️  Telemetría Exterior (Iluminancia) Enviada (Lote 10 min)")

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Error de red en illuminance_monitor_task()", e)
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"    ├─ ⚠️  Error en illuminance_monitor_task(): {e}")
        
        await asyncio.sleep(60)

async def circuit_pressure_worker():
    """
    #### Monitoreo de Presión del Circuito Hidráulico
    * Estado REPOSO: Duerme en ciclos largos (60s). Sin muestreo. Sin batch.
    * Fase MAIN_WATER: (Cualquier relé ON, Bomba OFF). Muestreo cada 1s.
    * Fase BOMBA: (Bomba ON). Primera lectura tras 10s de presurización + Muestreo cada 60s.
    * Envío por CHUNKS: El batch se envía cada vez que se llena (10 pts) para visibilidad en tiempo real.
    * Al detectar cierre (todos OFF): Envía remanente del batch → limpia buffer.
    """
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps
    from utime import time
    from umqtt.simple2 import MQTTException # type: ignore

    # ---- Umbrales de Calibración: Manómetro (Filtro) ----
    FILTER_IDEAL_PSI = 45.0          # Presión ideal (PSI) con filtro limpio y bomba activa
    HEALTH_REPORT_INTERVAL = 300     # 5 min entre reportes de salud del filtro
    PUMP_PRESSURIZE_DELAY = 10       # Segundos de espera para presurización del circuito

    was_active = False               # Rastreo de si el circuito estaba abierto
    pump_was_on = False              # Rastreo del estado de la bomba para lectura inicial
    last_health_report = 0

    def _flush_batch():
        """Envía el contenido actual del buffer por MQTT y lo limpia."""
        if pressure_Batch.count == 0:
            return
        if not (client and getattr(client, 'sock', None) and wlan and wlan.isconnected()):
            return
        try:
            history_data = [[item[0], {"pressure": item[1][0], "phase": item[1][1]}] for item in pressure_Batch.get_all()]
            payload_batch = dumps({"history": history_data})
            client.publish(MQTT_TOPIC_EXTERIOR_METRICS, payload_batch.encode('utf-8'), qos=0)
            if DEBUG: print(f"    ├─ 💧 Chunk de Presión Enviado ({pressure_Batch.count} pts)")
        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Error de red en _flush_batch() de presión", e)
            force_disconnect_mqtt()
        pressure_Batch.clear()

    while True:
        try:
            if pressure_sensor_analog is None:
                await asyncio.sleep(60)
                continue

            # Análisis de estados del hardware
            # 1. ¿Está la bomba (ID 3) encendida?
            pump_on = relays.get(3) and relays[3]['state'] == 'ON'
            # 2. ¿Hay algún riego/circuito abierto (Cualquier relé ON)?
            circuit_active = any(r['state'] == 'ON' for r in relays.values())

            # ---- LÓGICA DE CIERRE (TRANSICIÓN ACTIVO -> REPOSO) ----
            if not circuit_active and was_active:
                was_active = False
                pump_was_on = False

                # Enviar el remanente acumulado durante el evento de riego
                async with mqtt_lock:
                    _flush_batch()

                await asyncio.sleep(60)
                continue

            # ---- ESTADO REPOSO: Sin relés activos ----
            if not circuit_active:
                await asyncio.sleep(60)
                continue

            # ---- ESTADO ACTIVO (CIRCUITO ABIERTO) ----
            was_active = True
            current_ts = time()

            # 3. Determinación de Intervalo Dinámico y Fase Operativa
            if not pump_on:
                # Fase de Entrada Principal (Alta Resolución): Captura 1s para ver el diferencial estático del acueducto
                sample_interval = 1
                pump_was_on = False
                current_phase = "MAIN_WATER"
            else:
                if not pump_was_on:
                    # Transición: Bomba recién encendida → esperar presurización del circuito
                    pump_was_on = True
                    current_phase = "TRANSICION"
                    await asyncio.sleep(PUMP_PRESSURIZE_DELAY)
                else:
                    current_phase = "BOMBA"
                # Fase Bomba Estable: Muestreo cada 60s
                sample_interval = 60

            # 4. Muestreo promediado (ADC) con Oversampling de 5 muestras
            raw_val = sum([pressure_sensor_analog.read() for _ in range(5)]) // 5
            pressure_Batch.append([raw_val, current_phase])

            # 5. Envío por Chunks: Cuando el buffer se llena, enviar inmediatamente
            #    Esto garantiza visibilidad cuasi-real-time en la Timeline de la tarea
            if pressure_Batch.count >= 10:
                async with mqtt_lock:
                        _flush_batch()

            # 6. Diagnóstico de Salud del Filtro (Solo durante fase de bombeo)
            if pump_on and (current_ts - last_health_report >= HEALTH_REPORT_INTERVAL):
                # Presión (PSI) = (raw - 405) * 0.0454
                # (Confirmamos normalidad hidráulica mediante el sensor)
                psi = max(0, (raw_val - 405) * 0.0454)
                health = min(100, round((psi / FILTER_IDEAL_PSI) * 100))

                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    async with mqtt_lock:
                        payload = dumps({"health": health, "pressure": round(psi, 1)})
                        client.publish(MQTT_TOPIC_FILTER_STATUS, payload.encode('utf-8'), qos=0)
                        if DEBUG: print(f"    ├─ 🛡️ Salud Filtro: {health}% ({psi:.1f} PSI)")
                last_health_report = current_ts

            # Espera dinámica según fase (1s entrada principal | 60s bomba)
            await asyncio.sleep(sample_interval)

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception("Error de red en bucle circuit_pressure_worker()", e)
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"    ├─ ⚠️  Error en circuit_pressure_worker(): {e}")
            await asyncio.sleep(60)

# ---- CORRUTINAS DE AUDITORÍA INDEPENDIENTES (Event-Driven) ----
async def _audit_worker(category, sample_fn, interval=1):
    """ Lógica genérica para trabajadores de auditoría.
        Se mantiene dormida hasta que se activa el evento audit_events[category].
        Luego ejecuta el ciclo cada 60s exactos, y se vuelve a dormir tras 10 muestras.
    """
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps
    from utime import time
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # MODO SUSPENSIÓN: La tarea se congela hasta que se activa su evento
        await audit_events[category].wait()
        
        try:
            current_ts = time()
            val = sample_fn()
            
            if val is not None:
                packet = {category: {"history": [[current_ts, val]]}}
                
                # Sincronización MQTT con validación de socket
                if client and getattr(client, 'sock', None):
                    # 🔒 Pedimos permiso para usar el socket
                    async with mqtt_lock:
                        client.publish(MQTT_TOPIC_AUDIT, dumps(packet).encode('utf-8'), qos=0)
                
                AUDIT_COUNTERS[category] += 1
                
                if DEBUG:
                    print(f"    ├─ 🔍 Auditoría {category.upper()} #{AUDIT_COUNTERS[category]}: {val}")

            # Auto-apagado tras 10 muestras para evitar saturación
            if AUDIT_COUNTERS[category] >= 10:
                audit_events[category].clear()
                AUDIT_MODE[category] = False
                AUDIT_COUNTERS[category] = 0
                if DEBUG: print(f"    └─ Auto-OFF: {category.upper()} (10 pts)")
                publish_audit_state()

        except (MQTTException, OSError) as e:
            if DEBUG: log_mqtt_exception(f"Error de red en audit_{category}", e)
            force_disconnect_mqtt()
            await check_critical_mqtt_errors(e)
            await asyncio.sleep(5)
        except Exception as e:
            if DEBUG: print(f"⚠️ Error en audit_{category}: {e}")
            await asyncio.sleep(5)

        await asyncio.sleep(interval)

async def audit_ram_task():
    from gc import collect, mem_alloc, mem_free
    def sample():
        collect()
        return {"f": mem_free(), "a": mem_alloc()}
    await _audit_worker("ram", sample, interval=2)

async def audit_lux_task():
    def sample():
        if illuminance_sensor:
            return round(illuminance_sensor.luminance(BH1750.CONT_HIRES_1), 1)
        return None
    await _audit_worker("lux", sample, interval=1)

async def audit_pressure_task():
    def sample():
        if pressure_sensor_analog:
            return sum([pressure_sensor_analog.read() for _ in range(5)]) // 5
        return None
    await _audit_worker("pressure", sample, interval=1)

async def audit_rain_task():
    def sample():
        if rain_sensor_analog:
            return sum([rain_sensor_analog.read() for _ in range(5)]) // 5
        return None
    await _audit_worker("rain", sample, interval=1)

async def audit_health_task():
    def sample():
        if wlan:
            rssi = wlan.status('rssi') if wlan.isconnected() else -120
            return {"rssi": rssi, "ip": wlan.ifconfig()[0]}
        return None
    await _audit_worker("health", sample, interval=5)

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

    # ---- Inicialización del Hardware ----
    setup_relays()
    setup_sensors()

    # ---- Tareas Asíncronas ----
    # (Re)conexión WiFi (Prioridad de red)
    asyncio.create_task(wifi_coro())
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
    # Monitoreo Unificado de Presión (Reactivo al Riego)
    asyncio.create_task(circuit_pressure_worker())

    # ---- Auditorías Independientes (Event-Driven) ----
    asyncio.create_task(audit_ram_task())
    asyncio.create_task(audit_lux_task())
    asyncio.create_task(audit_pressure_task())
    asyncio.create_task(audit_rain_task())
    asyncio.create_task(audit_health_task())

    # ---- Watchdog Timer ----
    # Seguridad de hardware: Si el bucle principal se congela, el dispositivo se reinicia.
    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        if DEBUG:
            print(f"🐕  Watchdog: {Colors.YELLOW}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        if DEBUG:
            print(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None

    # ---- Boot Recovery Check ----
    # Verifica si hubo un reinicio durante una tarea activa.
    # Restaura la tarea solo si está dentro de la ventana de oportunidad.
    await boot_recovery_check()

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
    * Apaga físicamente todos los relés sin realizar operaciones de red.
    * Crucial para que herramientas como mpremote puedan entrar al REPL rápidamente.
    """
    if DEBUG:
        print(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")
    
    # Apagado físico inmediato de los relés (Safety first)
    # No usamos la red aquí para evitar el error de mpremote
    for relay_info in relays.values():
        try:
            relay_info['pin'].value(0)
            relay_info['state'] = 'OFF'
        except:
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

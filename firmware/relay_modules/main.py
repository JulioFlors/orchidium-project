# -----------------------------------------------------------------------------
# Relay Modules: Actuator Controller Firmware.
# Descripción: Firmware dedicado para el control de las electroválvulas y la bomba.
# Versión: v0.5.0 - Parche de la libreria umqtt.simple2
# Fecha: 05-03-2026
# ------------------------------- Configuración -------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib.
# Esto es necesario para que al importar la librería umqtt.simple2 se sobreescriba
# la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

from gc    import collect
from ujson import dump, dumps, load, loads
from utime import localtime, sleep_ms, sleep, ticks_diff, ticks_ms, time
import uasyncio as asyncio

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

# ---- Configuración MQTT ----
MQTT_CONFIG = {
    # El broker esperará ~1.5x este valor antes de desconectar al cliente.
    "KEEPALIVE": 60, # ~1.5x = 90 seg
    # Intervalo para enviar pings de 'keepalive' al broker MQTT.
    "PING_INTERVAL": 60//2, # keepalive//2
    # Intervalo para revisar mensajes MQTT entrantes.
    "CHECK_INTERVAL": 1, # seg
    # Intervalo para publicar el estado `online` para confirmar conectividad
    "PUBLISH_INTERVAL": 30, # 30 seg
    # tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
    "SOCKET_TIMEOUT": 60,
    # tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
    # [WDT Safety]: Debe ser MENOR que el Watchdog de Hardware (65s)
    "MESSAGE_TIMEOUT": 90,
}

# ---- Configuración Resiliencia / Watchdog ----
# Tiempo máximo sin conexión WiFi antes de forzar un Hard Reset (5 minutos)
MAX_OFFLINE_RESET_SEC = 300
# Tiempo del Watchdog Timer (Hardware) en milisegundos (65 segundos (1m 5s))
# [WDT Safety]: Debe ser mayor que MESSAGE_TIMEOUT (60s) para evitar reinicios durante operaciones lentas.
WDT_TIMEOUT_MS = 100000

# ---- Tópicos MQTT Pre-calculados (Optimización de RAM) ----
# Usamos b"" (bytes) y constantes para evitar concatenación en tiempo de ejecución.

MQTT_TOPIC_STATUS         = b"PristinoPlant/Actuator_Controller/status"
MQTT_TOPIC_IRRIGATION_CMD = b"PristinoPlant/Actuator_Controller/irrigation/cmd"
MQTT_TOPIC_CMD            = b"PristinoPlant/Actuator_Controller/cmd"
MQTT_TOPIC_CMD_RECEIVED   = b"PristinoPlant/Actuator_Controller/cmd/received"
MQTT_TOPIC_DEBUG_NVS      = b"PristinoPlant/Actuator_Controller/debug/nvs"
MQTT_STATE_BASE           = b"PristinoPlant/Actuator_Controller/irrigation/state/"

# MQTT_TOPIC_STATUS         Tópico de estado de este dispositivo
# MQTT_TOPIC_IRRIGATION_CMD Tópico donde se escuchan los comandos del Sistema de riego
# MQTT_TOPIC_CMD            Tópico para recibir comandos en Texto plano. (Reiniciar dispositivo)
# MQTT_TOPIC_CMD_RECEIVED   Tópico donde se publican los comandos que se han recibido para auditoría
# MQTT_TOPIC_DEBUG_NVS      Tópico para depuración de NVS (recovery.json)
# MQTT_STATE_BASE           Tópico base para publicar los estados de los relés (se usa en setup_relays)

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = b"offline"

# ---- Topología del Circuito de Riego (Edge Computing) ----
# Delay de cebado de la bomba (segundos). La bomba se enciende
# después de que las válvulas ya estén abiertas para evitar
# presurizar tuberías vacías.
PUMP_PRIME_DELAY = 10

# Mapa de circuitos: cada propósito de riego se descompone en
# una válvula fuente (source) y una línea de distribución (line).
# La bomba (pump) es implícita y se activa siempre.
IRRIGATION_CIRCUITS = {
    "IRRIGATION":     {"source": "main_water",   "line": "sprinkler"},
    "FERTIGATION":    {"source": "agrochemical",  "line": "fertigation"},
    "FUMIGATION":     {"source": "agrochemical",  "line": "fertigation"},
    "HUMIDIFICATION": {"source": "main_water",   "line": "fogger"},
    "SOIL_WETTING":   {"source": "main_water",   "line": "soil_wet"},
}

# ---- Mapeo Estático de Errores MQTT (Optimización RAM) ----
# Se definen globalmente con enteros para no importar umqtt.errno
MQTT_ERROR_MAP = {
    # Errores Generales (0-10)
    -1: "Error Desconocido / Formato Inválido",
    1:  "Conexión cerrada por el Host (Connection Reset)",
    2:  "Lectura: Longitud de datos incorrecta",
    3:  "Escritura: Longitud de datos incorrecta (EOF)",
    4:  "String demasiado largo",
    5:  "Respuesta del Broker incorrecta (PID no coincide)",
    28: "Sin Conexión (Socket desconectado internamente)",
    29: "Respuesta de Conexión Inválida (No es CONNACK)",
    30: "Timeout de Operación (Socket Timeout)",
    
    # Errores de Conexión (CONNACK) (21-25)
    20: "Refused: Error desconocido",
    21: "Refused: Versión de Protocolo no soportada",
    22: "Refused: ID de Cliente Rechazado",
    23: "Refused: Servidor No Disponible",
    24: "Refused: Credenciales Inválidas (User/Pass)",
    25: "Refused: No Autorizado",
    
    # Errores de Suscripción (SUBACK) (40-44)
    40: "Suscripción Fallida (Respuesta malformada)",
    44: "Suscripción Rechazada por el Broker (Código 0x80)",
}

# ---- Hardware Global ----
# Diccionario que mapea un (actuator_id) a otro diccionario que contiene todos los atributos y el estado de ese actuador.
relays = {}

# ---- Variables Globales de Estado ----
# Lista de temporizadores de riego activos
active_irrigation_timers = []

# Diccionario para rastrear tareas de encendido diferido
pending_start_tasks = {}

# Evento para notificar cambios de estado de un actuador
state_changed = asyncio.Event()

# Candado asíncrono para evitar colisiones en el socket SSL
mqtt_lock = asyncio.Lock()

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# ---- Colors for logs ----
class Colors:
    RESET = '\x1b[0m'
    RED = '\x1b[91m'
    GREEN = '\x1b[92m'
    YELLOW = '\x1b[93m'
    BLUE = '\x1b[94m'
    MAGENTA = '\x1b[95m'
    CYAN = '\x1b[96m'
    WHITE = '\x1b[97m'

# ---- Función Auxiliar: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

# ---- Función Auxiliar: Uso del disco ----
def log_disk_usage():
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
        log(f"\n💾  Flash Usage: {used_kb}KB / {total_kb}KB ({p:.1f}%) | Free: {free_kb}KB")
    except Exception as e:
        log(f"⚠️  Disk Stat Error: {e}")

# ---- Función Auxiliar: Uso de la memoria RAM ----
def log_ram_usage():
    try:
        from gc import mem_free, mem_alloc
        free = mem_free()
        alloc = mem_alloc()
        total = free + alloc
        used = total - free
        p = (used / total) * 100
        log(f"🧠  RAM Usage: {used/1024:.1f}KB / {total/1024:.1f}KB ({p:.1f}%) | Free: {free/1024:.1f}KB")
    except Exception as e:
        log(f"⚠️  RAM Stat Error: {e}")

# ---- Importar configuración desde lib/secrets de forma segura ---- #
try:
    from secrets import WIFI_CONFIG, MQTT_CONFIG as SECRETS_MQTT

    # Si la importación tiene éxito, actualizamos los valores por defecto.
    MQTT_CONFIG.update(SECRETS_MQTT)
except ImportError:
    log(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_CONFIG = {"SSID": "", "PASS": ""}
    MQTT_CONFIG = {"SERVER": "", "USER": "", "PASS": "", "PORT": 1883, "SSL": False, "SSL_PARAMS": {}}

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
                from os import listdir
                if cls.FILE_PATH in listdir():
                    with open(cls.FILE_PATH, "r") as f:
                        cls._cache = load(f)
                else:
                    cls._cache = {}
            except Exception as e:
                log(f"\n⚠️  Error leyendo NVS: {e}")
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
        # log(f"    ├─ Caché NVS: Tarea {key} encolada.") # 🔇 Comentado

    @classmethod
    def clear_task(cls, actuator_id=None):
        """Elimina tareas de la Caché RAM y levanta la bandera de escritura."""
        cls._load_cache()
        
        # Si piden borrar todo el registro
        if actuator_id is None:
            if cls._cache: # Solo ensuciamos si realmente había algo que borrar
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
            # log(f"    ├─ Caché NVS: Tarea {str_id} removida.") # 🔇 Comentado

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
            from os import remove # type: ignore
            if not cls._cache:
                # Si la caché quedó vacía, borramos el archivo físico para ahorrar espacio
                try: remove(cls.FILE_PATH)
                except: pass
                # log(f"    └─ 📁 File NVS {Colors.GREEN}Eliminado (Vacío){Colors.RESET}") # 🔇 Comentado
            else:
                # Escribimos el diccionario consolidado de una sola vez
                with open(cls.FILE_PATH, "w") as f:
                    dump(cls._cache, f)
                # log(f"    └─ 💾 NVS Flush: {len(cls._cache)} tareas consolidadas en Flash.") # 🔇 Comentado
            
            # Limpiamos la bandera ya que estamos sincronizados con el disco
            cls._dirty = False
        except Exception as e:
            log(f"\n⚠️  Error en Flush NVS: {e}")

    @classmethod
    def prepare_reset_backup(cls):
        """Prepara el backup calculando tiempos restantes justo antes de un reinicio."""
        # Gestión de variables globales
        global active_irrigation_timers

        if not active_irrigation_timers: return

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
                    # log(f"💾  Backup Creado: ID:{actuator_id} Restan:{int(remaining)}s") # 🔇 Comentado
        
        # Forzamos la escritura física inmediatamente porque el sistema está muriendo
        cls.flush()

# ---- Función Auxiliar: Safe Reset (Reinicio con Backup NVS) ----
def safe_reset():
    """Guarda el estado de las tareas activas en NVS y reinicia el dispositivo."""
    try: NVSManager.prepare_reset_backup()
    except: pass

    from machine import reset # type: ignore
    reset()

# ---- Función Auxiliar: Boot Recovery (Recuperación Inteligente) ----
async def boot_recovery_check():
    """
    Verifica si hubo un reinicio durante una tarea activa.
    Restaura el estado solo si está dentro de la ventana de oportunidad.
    """

    log(f"\n🔍  {Colors.BLUE}Verificando Tareas{Colors.RESET}")
    
    all_tasks = NVSManager.load_tasks()

    if not all_tasks:
        log(f"    └─ Estado: {Colors.GREEN}No hay tareas pendientes{Colors.RESET}")
        return

    # Validamos que tengamos hora válida (Año > 2025)
    # Si no hay hora, NO PODEMOS arriesgarnos a regar.
    current_time = time()
    current_year = localtime()[0]

    if current_year < 2026:
        log(f"    └─ ⚠️  Error: {Colors.RED}No se pudo sincronizar la Hora del Sistema{Colors.RESET}.")
        log(f"        └─ Cancelando recuperación por seguridad.")
        NVSManager.clear_task()
        return
    
    # Ventana de oportunidad (15 min) para considerar "válido" un riego interrumpido
    # Si paso la hora de fin + 15 min, ya fue.
    RECOVERY_WINDOW = 900 

    # ---- Análisis Temporal (Iterando todas las tareas) ----
    # 2026-Fix: Iteramos sobre los values del diccionario
    for task_data in all_tasks.values():
        start_epoch = task_data.get("start_epoch", 0)
        duration = task_data.get("duration", 0)
        actuator_id = task_data.get("actuator_id")
        
        # ---- Caso C: Tarea Pendiente (Diferida) ----
        if "_pending" in str(actuator_id) or task_data.get("type") == "delayed_start":
            real_actuator_id = int(str(actuator_id).replace("_pending", ""))
            target_start = task_data.get("target_start_epoch", 0)
            delay_remaining = target_start - current_time
            
            if delay_remaining > 0:
                 log(f"    ├─ {Colors.CYAN}RESTAURANDO DIFERIDO{Colors.RESET} ID:{real_actuator_id}")
                 log(f"    │   └─ Esperar: {delay_remaining}s")
                 
                 if real_actuator_id in relays:
                    target_relay = relays[real_actuator_id]
                    duration = task_data.get("duration", 0)
                    
                    # Relanzamos la tarea diferida
                    task = asyncio.create_task(
                        delayed_start_task(target_relay, real_actuator_id, delay_remaining, duration)
                    )
                    pending_start_tasks[real_actuator_id] = task
                 else:
                    NVSManager.clear_task(real_actuator_id)
            else:
                 # Si ya pasó el tiempo de espera... ¿Debería arrancar?
                 # Asumimos que si expiró hace poco (dentro de ventana), arranca YA.
                 # Si expiró hace horas, se ignora.
                 time_failed_start = current_time - target_start
                 if time_failed_start < RECOVERY_WINDOW:
                      log(f"    ├─ {Colors.GREEN}EJECUTANDO DIFERIDO ATRASADO{Colors.RESET} ID:{real_actuator_id}")
                      if real_actuator_id in relays:
                        target_relay = relays[real_actuator_id]
                        duration = task_data.get("duration", 0)
                        # Arrancamos inmediatamente (delay=0)
                        task = asyncio.create_task(
                            delayed_start_task(target_relay, real_actuator_id, 0, duration)
                        )
                        pending_start_tasks[real_actuator_id] = task
                 else:
                      log(f"    └─ 🗑️  {Colors.YELLOW}Diferido Vencido{Colors.RESET} ID:{real_actuator_id}")
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
                 
                 # Si estuvo apagado demasiado tiempo (más de 15 min), se cancela.
                 if elapsed_offline > RECOVERY_WINDOW:
                      log(f"    └─ 🗑️  {Colors.YELLOW}Tarea Pausada (Vencida){Colors.RESET} ID:{actuator_id} (Offline: {elapsed_offline}s)")
                      NVSManager.clear_task(actuator_id)
                      continue
            
            log(f"    ├─ {Colors.GREEN}REANUDANDO PAUSA{Colors.RESET} ID:{actuator_id}")
            log(f"    │   └─ Restante: {duration}s")
            
            # Restaurar Relé
            if actuator_id in relays:
                target_relay = relays[actuator_id]
                target_relay['pin'].value(1) # ON
                target_relay['state'] = 'ON'
                state_changed.set()
                
                # Reprogramar Timer (Ahora + Duración guardada)
                active_irrigation_timers.append((actuator_id, current_time + duration))
                log(f"    └─ Actuador: {target_relay['name']} -> ON")
                
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
            log(f"    ├─ {Colors.GREEN}RECUPERANDO{Colors.RESET} ID:{actuator_id}")
            log(f"    │   └─ Faltan: {remaining_time}s")
            
            # Restaurar Relé
            if actuator_id in relays:
                target_relay = relays[actuator_id]
                target_relay['pin'].value(1) # ON
                target_relay['state'] = 'ON'
                state_changed.set()
                
                # Reprogramar Timer
                active_irrigation_timers.append((actuator_id, current_time + remaining_time))
                log(f"    └─ Actuador: {target_relay['name']} -> ON")
            else:
                log(f"    └─ ⚠️  Error: Actuador {actuator_id} no encontrado.")
                NVSManager.clear_task(actuator_id) # Borramos solo esta mala

        # Caso B: Tarea Expirada
        else:
            log(f"    └─ 🗑️  {Colors.YELLOW}Tarea Vencida{Colors.RESET} ID:{actuator_id} (No reanudar)")
            NVSManager.clear_task(actuator_id)

    # ---- Escritura Física en Disco ----
    # Guardamos los nuevos tiempos recalibrados y las tareas expiradas eliminadas
    NVSManager.flush()

# ---- Función Auxiliar: Interpretación de Errores MQTT ----
def log_mqtt_exception(context, e):
    """
    Interpreta y loguea excepciones MQTT o de Red.
    """

    # Si es MQTTException, extraemos el código (e.args[0])
    if type(e).__name__ == 'MQTTException':
        code = e.args[0] if e.args else -1
        
        # Buscamos en el diccionario global instantáneo
        msg = MQTT_ERROR_MAP.get(code, f"Código de Error MQTT no documentado ({code})")
        log(f"\n❌  {context}: {Colors.RED}[MQTT-{code}] {msg}{Colors.RESET}")
    
    # Si es OSError (Problemas de TCP/IP base, DNS, WiFi caído)
    elif isinstance(e, OSError):
        err_msg = str(e)
        code = e.args[0] if e.args else 0
        
        # Identificación rápida por enteros (Mucho más veloz que instanciar variables)
        if code == 110: err_msg = "ETIMEDOUT (Conexión lenta o caída)"
        elif code == 113: err_msg = "EHOSTUNREACH (Ruta al host inalcanzable)"
        elif code == 104: err_msg = "ECONNRESET (Conexión reseteada por el par)"
        elif code == -202: err_msg = "MBEDTLS_ERR_NET_CONNECT_FAILED (Fallo Handshake SSL)"
        elif code == -17040: err_msg = "MBEDTLS_ERR_RSA_PUBLIC_FAILED (Fallo SSL: RAM Insuficiente)"
        elif code == -29312: err_msg = "MBEDTLS_ERR_SSL_CONN_EOF (Broker cerró handshake)"
        
        log(f"\n❌  {context}: {Colors.RED}[Red-{code}] {err_msg}{Colors.RESET}")
    
    # Cualquier otra excepción fatal (Python bugs, MemoryError)
    else:
        log(f"\n❌  {context}: {Colors.RED}{type(e).__name__}: {e}{Colors.RESET}")

# ---- Función Auxiliar: Inicializar Hardware ----
def setup_relays():
    """Inicializa los pines físicos y el mapa de actuadores en RAM."""
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
            'topic': MQTT_STATE_BASE + b"valve/main_water"
        },
        2: {
            'name':  'agrochemical',
            'pin':   Pin(14, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"valve/agrochemical"
        },
        3: {
            'name':  'pump',
            'pin':   Pin(27, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"pump"
        },
        4: {
            'name':  'fogger',
            'pin':   Pin(26, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"valve/fogger"
        },

        5: {
            'name':  'fertigation',
            'pin':   Pin(25, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"valve/fertigation"
        },

        6: {
            'name':  'sprinkler',
            'pin':   Pin(33, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"valve/sprinkler"
        },

        7: {
            'name':  'soil_wet',
            'pin':   Pin(32, Pin.OUT, value=0),
            'state': 'OFF',
            'last_published_state': 'OFF',
            'topic': MQTT_STATE_BASE + b"valve/soil_wet"
        },
    }

# ---- Función Auxiliar: Callback de estado ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from umqtt import errno as umqtt_errno # type: ignore
    
    if not DEBUG: return

    # Ignoramos SDELIVERED (Éxito silencioso)
    if status == umqtt_errno.SDELIVERED:
        return

    if status == umqtt_errno.STIMEOUT:
        log(f"\n⚠️  {Colors.YELLOW}Timeout de entrega{Colors.RESET} (PID: {pid}): El broker no confirmó.")
        return

    if status == umqtt_errno.SUNKNOWNPID:
        log(f"\n❌  {Colors.RED}PID Desconocido{Colors.RESET} (PID: {pid}): Respuesta inesperada del broker.")
        return

# ---- Función Auxiliar: Callback MQTT ----
def sub_callback(topic, msg, retained, dup):
    """**Callback SÍNCRONO que se ejecuta al recibir mensajes.**"""

    try:
        # El parsing de JSON y decodificación de strings fragmenta la memoria.
        collect()

        # ---- Parsing de Datos ----
        # Decodificamos los datos recibidos
        # (bytes) -> (strings)
        topic_str = topic.decode('utf-8')
        msg_str = msg.decode('utf-8')

        # Análisis del Payload (JSON vs TEXTO)
        # Por estetica del log
        try:
            # Intentamos Aplanar el mensaje
            parsed_json = loads(msg_str)
            clean_payload = dumps(parsed_json)
            type_label = "JSON"
        except:
            clean_payload = msg_str.strip()
            type_label = "TEXT"

        # Construcción Dinámica del Log
        header = f"\n📡  {Colors.BLUE}Recibido{Colors.RESET}"

        # Solo agregamos las banderas si son verdaderas
        if retained:
            header += f" {Colors.YELLOW}[Retained]{Colors.RESET}"
        
        if dup:
            header += f" {Colors.MAGENTA}[Duplicate]{Colors.RESET}"

        log(header)
        log(f"    ├─ Tópico: {Colors.GREEN}{topic_str}{Colors.RESET}")
        log(f"    ├─ {type_label}:   {Colors.BLUE}{clean_payload}{Colors.RESET}")

        # ---- 🛡️ Lógica del Sistema de Comandos (/cmd) ----
        if topic == MQTT_TOPIC_CMD:
            # Comando: RESET
            if msg_str.lower() == "reset":
                log(f"    └─ Acción: {Colors.CYAN}Reboot the Device{Colors.RESET}")
                
                # Confirmamos recepción publicando un estado antes de morir
                try:
                    if client and wlan and wlan.isconnected():
                        client.publish(MQTT_TOPIC_STATUS, b"rebooting", retain=True, qos=1)
                except: pass

                log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}")

                sleep(30)
                safe_reset()

            # Comando: GET_NVS (Dump recovery.json)
            elif msg_str.lower() == "get_nvs":
                log(f"    └─ Acción: {Colors.CYAN}Dump NVS Content{Colors.RESET}")
                try:
                    # Leemos el contenido raw del archivo
                    content = NVSManager.load_tasks()
                    payload = dumps(content)

                    if client and wlan and wlan.isconnected():
                        # Publicamos en el tópico de debug
                        client.publish(MQTT_TOPIC_DEBUG_NVS, payload, retain=False, qos=0)
                        log(f"    └─ 📡  Publicado en {Colors.BLUE}/debug/nvs{Colors.RESET}")
                except Exception as e:
                    log(f"    └─ ⚠️  Error reading NVS: {e}")

        # ---- 💦 Lógica de Riego (irrigation/cmd) ----
        if topic == MQTT_TOPIC_IRRIGATION_CMD:
            try:
                # ---- Auditoría: Publicamos el mensaje recibido ----
                # Usamos qos=1 para garantizar que el backend audite el comando.
                try:
                    if client and wlan and wlan.isconnected():
                        client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=1)
                        log(f"    ├─ Ok:     {Colors.GREEN}Comando Registrado{Colors.RESET}")
                except: pass

                # ---- Procesamos los datos del JSON ----
                data = parsed_json
                state = data.get('state', '').strip().upper()

                if state not in ["ON", "OFF"]:
                    log(f"    └─ Error:  {Colors.RED}Estado inválido: '{state}'{Colors.RESET}")
                    return

                # ---- 🔀 BIFURCACIÓN: circuit (macro) vs actuator (individual) ----
                circuit_name = data.get('circuit')
                actuator_ref = data.get('actuator')

                # ---- Lista de comandos a ejecutar ----
                commands_to_execute = []

                if circuit_name:
                    # ---- MODO CIRCUITO (Macro) ----
                    circuit_name = circuit_name.strip().upper()
                    circuit_def = IRRIGATION_CIRCUITS.get(circuit_name)

                    if not circuit_def:
                        log(f"    └─ Error: {Colors.RED}Circuito desconocido: '{circuit_name}'{Colors.RESET}")
                        return

                    duration = data.get('duration', 0) # Default 0
                    task_id = data.get('task_id', '') # Default ''

                    log(f"    ├─ Modo:   {Colors.CYAN}Circuito{Colors.RESET} ➜  {Colors.YELLOW}{circuit_name}{Colors.RESET}")

                    # Las válvulas duran: duration + cebado
                    valve_duration = duration + PUMP_PRIME_DELAY

                    # 1. Válvula Fuente
                    commands_to_execute.append({
                        'actuator': circuit_def['source'],
                        'state': state,
                        'duration': valve_duration if state == 'ON' else 0,
                        'start_delay': 0
                    })

                    # 2. Válvula de Línea
                    commands_to_execute.append({
                        'actuator': circuit_def['line'],
                        'state': state,
                        'duration': valve_duration if state == 'ON' else 0,
                        'start_delay': 0
                    })

                    # 3. Bomba (con delay de cebado al encender)
                    commands_to_execute.append({
                        'actuator': 'pump',
                        'state': state,
                        'duration': duration if state == 'ON' else 0,
                        'start_delay': PUMP_PRIME_DELAY if state == 'ON' else 0
                    })

                elif actuator_ref:
                    # ---- MODO INDIVIDUAL (Legado/Mantenimiento) ----
                    log(f"    ├─ Modo:   {Colors.MAGENTA}Individual{Colors.RESET}")
                    commands_to_execute.append({
                        'actuator': actuator_ref,
                        'state': state,
                        'duration': data.get('duration', 0),
                        'start_delay': data.get('start_delay', 0)
                    })
                else:
                    log(f"    └─ Error: {Colors.RED}JSON sin 'circuit' ni 'actuator'{Colors.RESET}")
                    return

                # ---- 🔄 PROCESAMIENTO SECUENCIAL DE COMANDOS ----
                for cmd in commands_to_execute:
                    cmd_actuator = cmd['actuator']
                    cmd_state = cmd['state']
                    cmd_duration = cmd['duration']
                    cmd_delay = cmd['start_delay']

                    # Resolvemos el Relé (Por ID int o Nombre str)
                    target_relay, actuator_id = None, None

                    # Forzamos la conversión a int para mayor seguridad
                    try:
                        num_actuator = int(cmd_actuator)
                        if num_actuator in relays:
                            target_relay, actuator_id = relays[num_actuator], num_actuator
                    except ValueError:
                        # Si no es un número, entonces debe ser el nombre string
                        if isinstance(cmd_actuator, str):
                            for id, info in relays.items():
                                if info['name'] == cmd_actuator.lower():
                                    target_relay, actuator_id = info, id
                                    break

                    # Validamos que el actuador existe
                    if target_relay is None:
                        log(f"    ├─ ⚠️  Actuador no encontrado: {Colors.RED}{cmd_actuator}{Colors.RESET}")
                        continue

                    # ---- Override: Cancelamos cualquier inicio diferido pendiente ----
                    if actuator_id in pending_start_tasks:
                        pending_start_tasks[actuator_id].cancel()
                        # Limpiamos NVS de la tarea diferida
                        NVSManager.clear_task(actuator_id)
                        log(f"    ├─ Info: Encendido diferido cancelado: {Colors.YELLOW}{target_relay['name']}{Colors.RESET}")
                        # En modo circuito no retornamos, continuamos procesando
                        if not circuit_name:
                            return

                    # ---- Encendido diferido ----
                    # Guardamos la intención EN DISCO Inmediatamente (Persistencia)
                    # Usamos una key especial: "{id}_pending"
                    if cmd_state == "ON" and cmd_delay > 0:
                        try:
                            target_start = time() + cmd_delay
                            task_data = {
                                "actuator_id": actuator_id,
                                "key": f"{actuator_id}_pending",
                                "target_start_epoch": target_start,
                                "type": "delayed_start",
                                "start_delay_original": cmd_delay,
                                "duration": cmd_duration
                            }
                            NVSManager.save_task(task_data)
                        except Exception as e:
                            log(f"⚠️  Error guardando diferido NVS: {e}")

                        # Creamos la tarea asíncrona para encender en el futuro
                        # Pasamos target_relay y actuator_id ya resueltos
                        task = asyncio.create_task(
                            delayed_start_task(target_relay, actuator_id, cmd_delay, cmd_duration)
                        )

                        # Guardamos referencia para poder cancelarla si llega otro comando
                        pending_start_tasks[actuator_id] = task

                        log(f"    ├─ Acción: {Colors.CYAN}Encendido diferido ➜  {target_relay['name']} en {cmd_delay}s{Colors.RESET}")
                        # log(f"    ├─ NVS:    Guardada Acción en Diferido") # 🔇 Comentado
                        continue

                    # ---- Accionamos físicamente el relay ----
                    relay_value = 1 if cmd_state == "ON" else 0

                    if target_relay['state'] != cmd_state:
                        target_relay['pin'].value(relay_value)
                        target_relay['state'] = cmd_state

                        log(f"    ├─ Acción: Relay {target_relay['name']} ➜  {Colors.MAGENTA}{cmd_state}{Colors.RESET}")

                    # [STRICT NVS] Si apagamos, limpiamos NVS y Timers
                    if cmd_state == "OFF":
                        NVSManager.clear_task(actuator_id)

                        # Gestión de variables globales
                        global active_irrigation_timers
                        # Cancelar Timer (Sacarlo de la lista)
                        active_irrigation_timers = [
                            (id, t) for id, t in active_irrigation_timers if id != actuator_id
                        ]

                    # ---- Gestionamos el temporizador (Auto-Apagado) ----
                    if cmd_state == "ON" and isinstance(cmd_duration, int) and cmd_duration > 0:
                        end_time = time() + cmd_duration

                        # Gestión de variables globales
                        global active_irrigation_timers
                        # Limpiamos el timer anterior para este actuador
                        active_irrigation_timers = [
                            (id, t) for id, t in active_irrigation_timers if id != actuator_id
                        ]
                        active_irrigation_timers.append((actuator_id, end_time))

                        # ---- BITÁCORA (NVS) ----
                        # Guardamos la intención de la tarea inmediata
                        try:
                            task_data = {
                                "actuator_id": actuator_id,
                                "start_epoch": time(),
                                "duration": cmd_duration,
                                "type": "irrigation_run"
                            }
                            NVSManager.save_task(task_data)
                        except Exception as e:
                            log(f"    ├─ ⚠️  Error guardando bitácora: {e}")

                        log(f"    ├─ Timer:  Apagar {target_relay['name']} en {Colors.CYAN}{cmd_duration}s{Colors.RESET}")

                # ---- Publicación agrupada de estados ----
                # Un solo set() al final para emitir una ráfaga con todo el circuito
                state_changed.set()

                # ---- Escritura Física en Disco ----
                # Guardamos todos los cambios acumulados de este comando de una sola vez
                NVSManager.flush()

            except (ValueError, KeyError, TypeError) as e:
                log(f"    └─ {Colors.RED}Error procesando Riego: {e}{Colors.RESET}")

    except Exception as e:
        log(f"\n❌  Error en sub_callback(): {Colors.RED}{e}{Colors.RESET}")

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt():
    """**Cierra forzosamente el socket MQTT e invalida el cliente.**"""
    global client

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
        client = None
        log(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

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
            log(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass # Ignoramos errores de hardware al apagar

# ---- CORUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    """**Gestiona la (re)conexión asíncrona del WiFi**"""
    global wlan

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from network import STA_IF, WLAN # type: ignore

    # Inicialización del objeto WLAN
    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = False # Conexión inicial.
    wifi_disconnect_start = None # Marca de tiempo para calcular la duración de la desconexión

    while True:
        if not wlan.isconnected():

            if connected_once:
                log(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")

            # ---- Verificación Previa (Safety Check) ----
            # Iniciamos el contador de desconexión por primera vez
            if wifi_disconnect_start is None:
                wifi_disconnect_start = time()

            # Verificamos AQUI por si el bloque try falla repetidamente (la primera vez)
            if (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                 log(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                 log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                 await asyncio.sleep(1)
                 safe_reset()

            try:
                # fuerza a la capa de red a limpiar todos los estados internos, timers y handshakes pendientes antes de intentar una nueva conexión
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(1)
                wlan.active(True)

                log(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_CONFIG['SSID']}{Colors.RESET}", end="")
                
                wlan.connect(WIFI_CONFIG['SSID'], WIFI_CONFIG['PASS'])

                while not wlan.isconnected():
                    # ---- Verificación de falla crítica por tiempo ----
                    # Si llevamos mucho tiempo intentando conectar (inicio de desconexión + tiempo actual)
                    # Forzamos un reinicio para limpiar el stack TCP/IP / Hardware
                    if wifi_disconnect_start and (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                        log(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                        log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                        await asyncio.sleep(1)
                        safe_reset()

                    log(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)

                log(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                # Inyección de DNS
                try:
                    # google_dns = "8.8.4.4"
                    cloudflare_dns = "1.1.1.1"
                    ip, subnet, gateway, dns = wlan.ifconfig()
                    wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
                    if DEBUG:
                        log(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
                except Exception as e:
                    if DEBUG: log(f"⚠️  Error forzando DNS en Boot: {e}")

                # Resetear contador de falla
                wifi_disconnect_start = None

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()

                # Primera Conexión Establecida.
                connected_once = True

            except Exception as e:
                # OSErrors durante la conexión WiFi (ej: hardware no disponible, fallo de IP)
                log(f"\n❌  No se pudo establecer la conexión WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            # Conectado: Reseteamos contador
            wifi_disconnect_start = None
            # Revisamos la conexion cada 20 segundos
            await asyncio.sleep(20)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    """Callback del Timer de Hardware: Reinicia si la conexión se cuelga."""

    if DEBUG:
        log(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Timeout en conexión MQTT {Colors.RED}(Socket Bloqueado){Colors.RESET}")
        log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
        sleep(1)

    safe_reset()

# ---- CORUTINA: Manejo centralizado de Errores Críticos MQTT ----
async def check_critical_mqtt_errors(e):
    """Evalúa si la excepción es crítica y requiere un reinicio por HW/SW."""
    from umqtt.simple2 import MQTTException # type: ignore
    
    # [CRÍTICO] Si es Fallo SSL por Memoria (-17040) o Handshake/Red (-202), Reiniciamos.
    # No tiene sentido reintentar en un bucle infinito si el socket o la RAM fallan repetidamente.
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -202]:
         log(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Fallo crítico de SSL/Red ({e.args[0]}).")
         log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo para recuperar red/memoria...{Colors.RESET}\n")
         import uasyncio as asyncio
         await asyncio.sleep(5)
         safe_reset()

# ---- CORUTINA: Gestión de Conexión MQTT (Relay Modules) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from machine import Timer
    from umqtt.simple2 import MQTTClient, MQTTException # type: ignore

    # 🩹 PARCHE SSL: Sobreescribimos el _write de la librería umqtt.simple2
    def _robust_write(self, bytes_wr, length=-1):
        """Asegura que todos los bytes se envíen, incluso si el socket está ocupado."""

        data = bytes_wr if length == -1 else bytes_wr[:length]
        total_written = 0 # bytes transferidos
        
        while total_written < len(data):
            self._sock_timeout(self.poller_w, self.socket_timeout)
            try:
                # Le damos la data sobrante al socket SSL
                # Intentamos escribir el pedazo que falta
                written = self.sock.write(data[total_written:])
            except AttributeError:
                raise MQTTException(8)
            
            if written is None:
                # El búfer del WiFi está LLENO
                # Congelamos este hilo 15ms antes de reintentar
                # para que el WiFi envíe los paquetes físicos
                sleep_ms(15)
                continue
            if written == 0:
                raise MQTTException(3) # Conexión cerrada

            total_written += written

        return total_written

    # Aplicamos el parche a la clase antes de instanciarla
    MQTTClient._write = _robust_write

    # Definimos el timeout (ms)
    wd_timeout_ms = (MQTT_CONFIG["SOCKET_TIMEOUT"] + 1) * 1000

    while True:
        # Esperamos a que el WiFi esté conectado
        if wlan is None or not wlan.isconnected():
            # Cedemos el control y esperamos a que la tarea wifi_coro haga su trabajo
            await asyncio.sleep(5)
            continue

        # 🔄 Gestionamos la (Re)conexión
        if client is None:
            try:
                collect()

                # Inicializa el Cliente MQTT
                client = MQTTClient(
                    client_id=client_id,
                    server=MQTT_CONFIG["SERVER"],
                    port=MQTT_CONFIG["PORT"],
                    user=MQTT_CONFIG["USER"],
                    password=MQTT_CONFIG["PASS"],
                    keepalive=MQTT_CONFIG["KEEPALIVE"],
                    ssl=MQTT_CONFIG["SSL"],
                    ssl_params=MQTT_CONFIG["SSL_PARAMS"],
                    socket_timeout=MQTT_CONFIG["SOCKET_TIMEOUT"],
                    message_timeout=MQTT_CONFIG["MESSAGE_TIMEOUT"]
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
                log_disk_usage()
                log_ram_usage()
                
                log(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

                try:
                    # Para persistencia, clean_session debe ser False. 
                    # Esto permite que el Broker guarde las suscripciones y mensajes QOS 1 mientras estemos offline.
                    client.connect(clean_session=True)
                finally:
                    # SIEMPRE desactivamos el timer si la función retorna con éxito.
                    wd_timer.deinit()

                log(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Publicamos que estamos ONLINE
                # retain=True: El último estado se queda en el Broker para nuevos suscriptores
                # qos=1: Asegura que el mensaje llegue al menos una vez
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

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
                log_mqtt_exception("Fallo la Conexión MQTT", e)
                
                await check_critical_mqtt_errors(e)

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff para no saturar el BROKER
                await asyncio.sleep(5)
                continue

        # 🔄 Gestionamos la Conexión Activa
        if client:
            try:
                # 🔒 Verificación rápida de mensajes (Socket poll rápido)
                async with mqtt_lock:
                    # revisamos si hay mensajes entrantes
                    # Procesa PINGRESP y actualiza client.last_cpacket
                    client.check_msg()

                # Extracción de un único timestamp global para esta iteración
                now_ms = ticks_ms()

                # Verificación consolidada de latidos
                # Solo calculamos la diferencia si han pasado varios segundos
                time_since_ping = ticks_diff(now_ms, client.last_ping)

                # Comprobamos si debemos enviar un ping
                if time_since_ping > (MQTT_CONFIG['PING_INTERVAL'] * 1000):
                    # 🔒 Protegemos el Ping
                    async with mqtt_lock:
                        client.ping()

                # Comprobamos si ha pasado demasiado tiempo desde que OÍMOS al broker
                # Damos un margen de 1.5x el KEEPALIVE
                elif ticks_diff(now_ms, client.last_cpacket) > MQTT_CONFIG['KEEPALIVE'] * 1500:
                    log(f"\n💀  Conexión {Colors.RED} ZOMBIE {Colors.RESET}detectada")

                    # Lanzamos una excepción a propósito para ser capturados
                    raise OSError("Se ha excedido el TIMEOUT del broker MQTT")

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Error en Operación MQTT", e)

                await check_critical_mqtt_errors(e)

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff para no saturar el BROKER
                await asyncio.sleep(5)
                continue

        # Cede el control al planificador de asyncio
        await asyncio.sleep(MQTT_CONFIG['CHECK_INTERVAL'])

# ---- CORUTINA: Gestión de tareas diferidas ----
async def delayed_start_task(target_relay, actuator_id, delay, duration):
    """
    **Activa un actuador después de un retraso especificado.**

    * `actuator_ref`: Puede ser el ID (int) o el Nombre (str) del actuador.
    * `delay`: Tiempo de espera antes de encender (segundos).
    * `duration`: Tiempo que permanecerá encendido (segundos). `0 = indefinido`.
    """

    try:
        log(f"    └─ 🕒 {Colors.YELLOW}Inicio Diferido:{Colors.RESET} Esperando {delay}s para {target_relay['name']}")

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
                    "type": "irrigation_run"
                }
                NVSManager.save_task(task_data)
                
            except Exception as e:
                log(f"⚠️  Error guardando bitácora de vuelo: {e}")

        # ---- Accionamos el Relé (ENCENDIDO)----
        # Enciende el relé | active-HIGH
        target_relay['pin'].value(1)
        # Establece el state en el Diccionario de Relays
        target_relay['state'] = 'ON'
        # Notifica el cambio de estado
        state_changed.set() 

        # ---- Log Dinámico ----
        # Si hay duración definida, el encendido es intermedio (├─), si no, es final (└─)
        is_intermediate = (duration > 0)
        tree_char = "├─" if is_intermediate else "└─"
    
        log(f"\n🚀  Ejecución {Colors.GREEN}Diferida{Colors.RESET}")
        log(f"    {tree_char} Actuador: {Colors.MAGENTA}{target_relay['name']}{Colors.RESET} -> ON")
        
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

            log(f"    └─ Timer:    Apagar en {Colors.CYAN}{duration}s{Colors.RESET}")

        # ---- Escritura Física en Disco ----
        # Consolidamos la ejecución diferida
        NVSManager.flush()

    except asyncio.CancelledError:
        log(f"    └─ Info: {Colors.YELLOW}Tarea diferida cancelada durante la espera.{Colors.RESET}")
        raise # Re-lanzamos para limpieza interna de asyncio si es necesario

    finally:
        # Limpiamos la referencia a esta tarea en el diccionario global
        global pending_start_tasks
        if actuator_id in pending_start_tasks:
            del pending_start_tasks[actuator_id]
        
        # [CRÍTICO] Si la tarea termina (bien o mal), asegurarse de limpiar NVS si era un delayed start que ya corrió
        # Ojo: Si era con duration > 0, ya se guardó una "irrigation_run". Si falla antes, limpiamos.
        # Simplificación: El timer_manager lo limpia al final.

# ---- CORUTINA: Gestión de temporizadores ----
async def timer_manager_task():
    """
    **Gestiona los temporizadores de riego para apagar los relés.**

    Revisa cada segundo si algún actuador debe apagarse.
    """
    # Gestión de variables globales
    global active_irrigation_timers

    while True:
        # Cede el control al planificador de asyncio
        await asyncio.sleep(1)

        # Si no hay temporizadores, no hacemos nada.
        if not active_irrigation_timers:
            continue

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
                    log(f"\n⏰  {Colors.YELLOW}Temporizador Finalizado{Colors.RESET}")
                    log(f"    └─ Acción: Apagando {Colors.MAGENTA}{target_relay['name']}{Colors.RESET}")
                    
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

# ---- CORUTINA: Publicación de Estado ----
async def state_publisher_task():
    """
    **Publica los cambios de estado de los actuadores.**

    Se mantiene dormida (await state_changed.wait()) hasta que alguien activa la señal.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # Esperamos a que ocurra un evento
        await state_changed.wait()
        
        # Limpiamos el estado para el próximo evento
        state_changed.clear()

        # Debounce (Anti-Rebotes): Pausa para agrupar múltiples cambios simultáneos
        await asyncio.sleep_ms(50)

        # Validación de Conectividad (Evitar Error 28)
        # Verificamos client, wlan y el socket interno antes de intentar publicar
        if client is None or getattr(client, 'sock', None) is None or not (wlan and wlan.isconnected()):
            log(f"\n❌  Publicación omitida: {Colors.RED}Cliente/WiFi no disponible{Colors.RESET}")
            continue

        # Filtramos los cambios
        updates_pending = []
        for relay_info in relays.values():
            if relay_info['state'] != relay_info['last_published_state']:
                updates_pending.append(relay_info)

        # ---- Lógica de publicación y Logs ----
        # Si No hay nada que actualizar
        if not updates_pending:
            continue
        
        # Si Hay actualizaciones -> Imprimimos encabezado
        log(f"\n📡  Sincronizando {Colors.BLUE}Relays{Colors.RESET}")

        # Obtenemos el numero de actualizaciones para estilizar el log
        total_updates = len(updates_pending)

        # Recorremos los relés pendientes por actualizar.
        for i, relay_info in enumerate(updates_pending):
            current_state = relay_info['state']

            # ---- Lógica Visual de Árbol ----
            # Si es el último elemento de la lista (índice == total - 1), usamos "└─"
            is_last = (i == total_updates - 1)
            tree_char = "└─" if is_last else "├─"

            try:
                # 🔒 Pedimos permiso para usar el socket
                async with mqtt_lock:
                    # Intentamos publicar el nuevo estado
                    # Usamos qos=0 (no bloqueante) y retain=True (importante)
                    client.publish(relay_info['topic'], current_state.encode('utf-8'), retain=True, qos=0)

                # Sincroniza con el último estado publicado.
                relay_info['last_published_state'] = current_state

                # Log con el carácter dinámico
                log(f"    {tree_char} {relay_info['name']}: {Colors.MAGENTA}{current_state}{Colors.RESET}")
                
                # Evita saturar el socket/broker con ráfagas
                await asyncio.sleep_ms(200)
                
            except (MQTTException, OSError) as e:
                log_mqtt_exception(f"Fallo la publicación de {relay_info['name']}", e)
                
                # Si falla uno, asumimos fallo de conexión y forzamos reconexión
                force_disconnect_mqtt()

                # Salimos del for para reintentar en el siguiente ciclo tras reconexión
                break

# ---- CORUTINA: Latido del Sistema (Heartbeat) ----
async def heartbeat_task():
    """
    #### Latido del Sistema (Heartbeat)
    Publica cada `PUBLISH_INTERVAL` el estado `online` para confirmar conectividad.
    """
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # Verificamos client.sock para evitar Error 28 (Race condition durante conexión)
        if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            try:
                # 🔒 Pedimos permiso para usar el socket
                async with mqtt_lock:
                    # Reafirmamos que estamos vivos
                    client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Publicación del Heartbeat omitida", e)

        # Esperamos el intervalo de publicación
        await asyncio.sleep(MQTT_CONFIG["PUBLISH_INTERVAL"])

# ---- CORUTINA: Programa Principal ----
async def main():
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
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

    # ---- Tareas Asíncronas ----
    # (Re)conexión WiFi (Prioridad de red)
    asyncio.create_task(wifi_coro())
    # Reconexión MQTT (Depende de WiFi)
    asyncio.create_task(mqtt_connector_task(client_id))
    # Publicación de estados (Depende de MQTT)
    asyncio.create_task(state_publisher_task())
    # Gestión de temporizadores
    asyncio.create_task(timer_manager_task())
    # Gestion de la señal de vida del firmware
    asyncio.create_task(heartbeat_task())
    
    # ---- Watchdog Timer ----
    # Seguridad de hardware: Si el bucle principal se congela, el dispositivo se reinicia.
    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        log(f"🐕  Watchdog Activado: {Colors.MAGENTA}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        log(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None
    
    # ---- Boot Recovery Check ----
    # Confiamos en que boot.py ya sincronizó la hora.
    # Si no, boot_recovery_check validará el año internamente.
    await boot_recovery_check()

    # ---- Bucle de Supervisión y Recolección de Basura ----
    while True:
        # Alimentar al Watchdog
        if wdt: wdt.feed()

        # Gestión de Memoria Proactiva
        collect()

        # El event loop cede control a todas las tareas asíncronas.
        # intentamos Alimentar al WDT (65s) 4 veces antes de que pueda fallar.
        await asyncio.sleep(13)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def stopped_program():
    """
    log para except KeyboardInterrupt. 
    Se envuelve en una funcion debido a que el log crudo no es valido en el template de compile.py
    """
    if DEBUG:
        log(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")

# ---- Punto de Entrada ----
if __name__ == '__main__':
    try:
        # Iniciar loop asíncrono
        asyncio.run(main())
    except KeyboardInterrupt:
        stopped_program()
    except Exception as e:
        if DEBUG:
            log(f"\n\n❌  Error fatal no capturado: {Colors.RED}{e}{Colors.RESET}\n\n")
        
        # En caso de error fatal en el Loop principal, reiniciamos el dispositivo
        safe_reset()
    finally:
        # Desconexión limpia 
        shutdown()

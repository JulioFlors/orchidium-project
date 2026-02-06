# -----------------------------------------------------------------------------
# Relay Modules: Actuator Controller Firmware.
# Descripción: Firmware dedicado para el control de las electroválvulas y la bomba.
# Versión: v0.4.5 - Fix: ERROR [-202] (Fallo Handshake SSL/Red) - Refactorizacion: force_disconnect_mqtt
# Fecha: 05-02-2026
# ------------------------------- Configuración -------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib. 
# Esto es necesario para que al importar la librería umqtt.simple2 se sobreescriba 
# sobre la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

import uasyncio as asyncio # type: ignore

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
    "PUBLISH_INTERVAL": 60, # 1 minuto
    # tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
    "SOCKET_TIMEOUT": 60,
    # tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
    "MESSAGE_TIMEOUT": 120
}

# ---- Tópicos MQTT ----
BASE_TOPIC = b"PristinoPlant/Actuator_Controller"

# Tópico de estado de este dispositivo
MQTT_TOPIC_STATUS = BASE_TOPIC + b"/status"

# Tópico donde se escuchan los comandos del Sistema de riego
MQTT_TOPIC_IRRIGATION_CMD = BASE_TOPIC + b"/irrigation/cmd"

# Tópico base para publicar los estados de los relés
MQTT_TOPIC_IRRIGATION_STATE = BASE_TOPIC + b"/irrigation/state"

# Tópico para recibir comandos en Texto plano. (Reiniciar dispositivo)
MQTT_TOPIC_CMD = BASE_TOPIC + b"/cmd"

# Tópico donde se publican los comandos que se han recibido para auditoría
MQTT_TOPIC_CMD_RECEIVED = BASE_TOPIC + b"/cmd/received"

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = b"offline"

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

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# ---- Función Auxiliar: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

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

# ---- Función Auxiliar: Interpretación de Errores MQTT ----
def log_mqtt_exception(context, e):
    """
    Interpreta y loguea excepciones MQTT usando TODOS los códigos de umqtt.simple2
    Soporta MQTTException (Protocolo) y OSError (Red)
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    try:
        from umqtt import errno as umqtt_errno # type: ignore
        from umqtt.simple2 import MQTTException # type: ignore
    except ImportError:
        log(f"\n❌  {context}: {Colors.RED}{e}{Colors.RESET} (No se encotró lib/umqtt)")
        return

    # Si es MQTTException, tiene un código de error en args[0]
    if isinstance(e, MQTTException) and e.args:
        code = e.args[0]
        
        # Mapeo completo de errores basado en lib/umqtt/errno.py
        error_map = {
            # --- Errores Generales ---
            umqtt_errno.EUNKNOWN:     "Error Desconocido",
            umqtt_errno.ECONCLOSE:    "Conexión cerrada por el Host",
            umqtt_errno.EREADLEN:     "Lectura: Longitud de datos incorrecta",
            umqtt_errno.EWRITELEN:    "Escritura: Longitud de datos incorrecta",
            umqtt_errno.ESTRTOLONG:   "String demasiado largo",
            umqtt_errno.ERESPONSE:    "Respuesta del Broker incorrecta",
            umqtt_errno.EKEEPALIVE:   "Keepalive Excedido (Ping Timeout)",
            umqtt_errno.ENOCON:       "Sin Conexión (Estado interno)",

            # --- Errores de Conexión (CONNACK) ---
            umqtt_errno.ECONUNKNOWN:     "Refused: Error desconocido (20)",
            umqtt_errno.ECONPROTOCOL:    "Refused: Versión de Protocolo no soportada",
            umqtt_errno.ECONREJECT:      "Refused: ID de Cliente Rechazado",
            umqtt_errno.ECONUNAVAIBLE:   "Refused: Servidor No Disponible",
            umqtt_errno.ECONCREDENTIALS: "Refused: Credenciales Inválidas (User/Pass)",
            umqtt_errno.ECONAUTH:        "Refused: No Autorizado",
            umqtt_errno.ECONNOT:         "Refused: Sin conexión (Estado broker)",
            umqtt_errno.ECONLENGTH:      "Refused: Longitud de paquete incorrecta",
            umqtt_errno.ECONTIMEOUT:     "Timeout de Conexión (Handshake)",

            # --- Errores de Suscripción (SUBACK) ---
            umqtt_errno.ESUBACKUNKNOWN:  "Suscripción Fallida (Error desconocido)",
            umqtt_errno.ESUBACKFAIL:     "Suscripción Rechazada por el Broker"
        }
        
        # Obtenemos el mensaje, o uno genérico si el código es desconocido
        msg = error_map.get(code, f"Código de Error MQTT no documentado ({code})")

        log(f"\n❌  {context}: {Colors.RED}[MQTT-{code}] {msg}{Colors.RESET}")
    
    # Si es OSError (Problemas de TCP/IP base, DNS, WiFi caído)
    elif isinstance(e, OSError):
        # Intentamos identificar algunos OSErrors comunes del ESP32
        err_msg = str(e)
        if e.args and e.args[0] == 110: err_msg = "ETIMEDOUT (Conexión lenta/caída)"
        if e.args and e.args[0] == 113: err_msg = "EHOSTUNREACH (Ruta al host inalcanzable)"
        if e.args and e.args[0] == 104: err_msg = "ECONNRESET (Conexión reseteada por par)"
        if e.args and e.args[0] == -202: err_msg = "MBEDTLS_ERR_NET_CONNECT_FAILED (Fallo Handshake SSL/Red)"
        
        log(f"\n❌  {context}: {Colors.RED}[Red] {err_msg}{Colors.RESET}")
    
    # Cualquier otra excepción (Python bugs, MemoryError, etc)
    else:
        log(f"\n❌  {context}: {Colors.RED}{e}{Colors.RESET}")

# ---- Función Auxiliar: Inicializar Hardware ----
def setup_relays():
    global relays

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from machine import  Pin # type: ignore

    # Nombres descriptivos para los actuadores (actuator_id)
    VALVE_MAIN_WATER   = 1 # Linea de agua principal
    VALVE_AGROCHEMICAL = 2 # Linea de agua del tanque
    PUMP               = 3 # Contactor de la Bomba de agua
    VALVE_FOGGER       = 4 # Nebulizadores
    VALVE_FERTIGATION  = 5 # Fertirriego
    VALVE_SPRINKLER    = 6 # Aspersores
    VALVE_SOIL_WET     = 7 # Humedecer Suelo

    # Diccionario que mapea un (actuator_id) a otro diccionario que contiene todos los atributos y el estado de ese actuador.
    # Pin(X, Pin.OUT, value=0) -> activo-HIGH, inicia apagado)
    relays = {
        VALVE_MAIN_WATER: {
            'last_published_state': 'OFF',
            'name':  'main_water',
            'pin':   Pin(13, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/main_water"
        },
        VALVE_AGROCHEMICAL: {
            'last_published_state': 'OFF',
            'name':  'agrochemical',
            'pin':   Pin(14, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/agrochemical"
        },
        PUMP: {
            'last_published_state': 'OFF',
            'name':  'pump',
            'pin':   Pin(27, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/pump"
        },
        VALVE_FOGGER: {
            'last_published_state': 'OFF',
            'name':  'fogger',
            'pin':   Pin(26, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/fogger"
        },

        VALVE_FERTIGATION: {
            'last_published_state': 'OFF',
            'name':  'fertigation',
            'pin':   Pin(25, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/fertigation"
        },

        VALVE_SPRINKLER: {
            'last_published_state': 'OFF',
            'name':  'sprinkler',
            'pin':   Pin(33, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/sprinkler"
        },

        VALVE_SOIL_WET: {
            'last_published_state': 'OFF',
            'name':  'soil_wet',
            'pin':   Pin(32, Pin.OUT, value=0),
            'state': 'OFF',
            'topic': MQTT_TOPIC_IRRIGATION_STATE + b"/valve/soil_wet"
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

    # (Optimización de memoria RAM)
    # Lazy Imports
    from ujson import dumps, loads #type: ignore

    try:
        # ---- Parsing de Datos ----
        # Decodificamos los datos recibidos
        # (bytes) -> (strings)
        topic_str = topic.decode('utf-8')
        msg_str = msg.decode('utf-8')

        # Análisis del Payload (JSON vs TEXTO)
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

                log(f"\n🔄  {Colors.BLUE}Reiniciando sistema{Colors.RESET}")

                # (Optimización de memoria RAM)
                # Lazy Imports (Importación tardía)
                from machine import reset #type: ignore
                from utime import sleep #type: ignore
                # Pausamos para dar tiempo a que salga el mensaje MQTT
                sleep(30)
                reset()

        # ---- 💦 Lógica de Riego (irrigation/cmd) ----
        if topic == MQTT_TOPIC_IRRIGATION_CMD:
            try:
                # ---- Auditoría: Replicar el mensaje para registro ----
                # Publicamos el JSON completo del comando que acabamos de recibir.
                # Usamos qos=1 para garantizar que el backend audite el comando.
                try:
                    if client and wlan and wlan.isconnected():
                        client.publish(MQTT_TOPIC_CMD_RECEIVED, msg, qos=1)
                        log(f"    ├─ Auditoría: {Colors.GREEN}Comando Registrado{Colors.RESET}")
                except: pass

                # ---- Procesamos los datos del JSON ----
                data = parsed_json

                actuator_ref = data.get('actuator')
                state = data.get('state', '').strip().upper()
                duration = data.get('duration', 0) # Default 0
                start_delay = data.get('start_delay', 0) # Default 0

                # Identificamos el Relé (Por ID int o Nombre str)
                target_relay, actuator_id = None, None

                # Si actuator_ref es un número
                if isinstance(actuator_ref, int) and actuator_ref in relays:
                    target_relay, actuator_id = relays[actuator_ref], actuator_ref
                # Si actuator_ref es un string
                elif isinstance(actuator_ref, str):
                    for id, info in relays.items():
                        if info['name'] == actuator_ref.lower():
                            target_relay, actuator_id = info, id
                            break

                # Validamos que el mensaje es correcto
                if target_relay is None or state not in ["ON", "OFF"]:
                    log(f"    └─ Error: {Colors.RED}Comando inválido (Actuador/Estado){Colors.RESET}")

                    return

                # 🔥 Lógica de Control 🔥
                # ---- Override: Cancelamos cualquier inicio diferido pendiente ----
                if actuator_id in pending_start_tasks:
                    pending_start_tasks[actuator_id].cancel()

                    log(f"    ├─ Info: Encendido diferido pendiente cancelado: {Colors.YELLOW}{target_relay['name']}{Colors.RESET}")

                # ---- Encendido diferido ----
                if state == "ON" and start_delay > 0:
                    # Creamos la tarea asíncrona para encender en el futuro
                    # Pasamos target_relay y actuator_id ya resueltos
                    task = asyncio.create_task(
                        delayed_start_task(target_relay, actuator_id, start_delay, duration)
                    )

                    # Guardamos referencia para poder cancelarla si llega otro comando
                    pending_start_tasks[actuator_id] = task

                    log(f"    └─ Acción: {Colors.CYAN}Encendido diferido programado para {target_relay['name']} en {start_delay}s{Colors.RESET}")

                    return

                # ---- Accionamos físicamente el relay ----
                relay_value = 1 if state == "ON" else 0

                if target_relay['state'] != state:
                    target_relay['pin'].value(relay_value)
                    target_relay['state'] = state

                    log(f"    └─ Acción: Relay {target_relay['name']} ➜ {Colors.MAGENTA}{state}{Colors.RESET}")

                    # Despertamos al publisher
                    state_changed.set() 

                # ---- Gestionamos el temporizador (Auto-Apagado) ----
                if state == "ON" and isinstance(duration, int) and duration > 0:
                    # (Optimización de memoria RAM)
                    # Lazy Imports (Importación tardía)
                    from utime import time #type: ignore

                    end_time = time() + duration

                    # Limpiamos el timer anterior para este actuador
                    global active_irrigation_timers
                    active_irrigation_timers = [
                        (id, t) for id, t in active_irrigation_timers if id != actuator_id
                    ]

                    active_irrigation_timers.append((actuator_id, end_time))

                    log(f"    └─ Timer:  Apagar en {Colors.CYAN}{duration}s{Colors.RESET}")

                    return

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
    from utime import time #type: ignore

    # Inicialización del objeto WLAN
    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = False # Conexión inicial.

    while True:
        if not wlan.isconnected():

            if connected_once:
                log(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")

            try:
                # fuerza a la capa de red a limpiar todos los estados internos, timers y handshakes pendientes antes de intentar una nueva conexion
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(1)
                wlan.active(True)

                log(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_CONFIG['SSID']}{Colors.RESET}", end="")
                
                wlan.connect(WIFI_CONFIG['SSID'], WIFI_CONFIG['PASS'])

                start_time = time()
                while not wlan.isconnected():
                    log(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)

                duration = time() - start_time
                
                log(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                # Formato de tiempo de reconexión condicional
                if duration > 60 and duration < 3600:
                    minutes = int(duration // 60)
                    seconds = int(duration % 60)
                    log(f"📡  Tiempo de reconexión: {Colors.MAGENTA}{minutes}:{seconds:02d}{Colors.RESET}")
                elif duration >= 3600:
                    hours = int(duration // 3600)
                    minutes = int((duration % 3600) // 60)
                    seconds = int(duration % 60)
                    log(f"📡  Tiempo de reconexión: {Colors.MAGENTA}{hours}:{minutes:02d}:{seconds:02d}{Colors.RESET}")

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()

                # Primera Conexión Establecida.
                connected_once = True

            except Exception as e:
                # OSErrors durante la conexión WiFi (ej: hardware no disponible, fallo de IP)
                log(f"\n❌  No se pudo establecer la conexión WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            # Revisamos la conexion cada 20 segundos
            await asyncio.sleep(20)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    """Callback del Timer de Hardware: Reinicia si la conexión se cuelga."""
    # Lazy Import (Importación tardía)
    from machine import reset # type: ignore
    
    log(f"\n💀 {Colors.RED}FATAL: Timeout en conexión MQTT (Socket Bloqueado). Reiniciando...{Colors.RESET}")
    reset()

# ---- CORUTINA: Gestión de Conexión MQTT (Relay Modules) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc import collect
    from umqtt.simple2 import MQTTClient, MQTTException # type: ignore
    from utime import ticks_ms, ticks_diff #type: ignore

    while True:
        # Esperamos a que el WiFi esté conectado
        if wlan is None or not wlan.isconnected():
            # Cedemos el control y esperamos a que la tarea wifi_coro haga su trabajo
            await asyncio.sleep(5)
            continue

        # Gestionamos la (Re)conexión
        if client is None:
            try:
                log(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

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

                # Iniciamos en una sesión limpia.
                # Sin persistencia
                
                # [SEGURIDAD] Watchdog para conexión síncrona bloqueante
                # Si client.connect() se cuelga por siempre (socket blocking), 
                # el Timer nos reiniciará.
                from machine import Timer # type: ignore
                
                # Definimos el timeout (ms)
                # Damos un pequeño margen extra sobre el MESSAGE_TIMEOUT
                wd_timeout_ms = (MQTT_CONFIG["MESSAGE_TIMEOUT"] + 5) * 1000
                
                wd_timer = Timer(0)
                wd_timer.init(period=wd_timeout_ms, mode=Timer.ONE_SHOT, callback=_connection_timeout_handler)
                
                try:
                    # [OPTIMIZACIÓN] Última limpieza de RAM para el Handshake SSL (RSA/MPI)
                    # Ayuda a prevenir MBEDTLS_ERR_MPI_ALLOC_FAILED
                    collect()
                    client.connect()
                finally:
                    # SIEMPRE desactivamos el timer si la función retorna (éxito o error Python)
                    wd_timer.deinit()

                log(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Publica que el ESP32 esta ONLINE
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

                # Suscripción a tópicos
                # cmd/
                client.subscribe(MQTT_TOPIC_CMD, qos=1)
                # irrigation/cmd
                client.subscribe(MQTT_TOPIC_IRRIGATION_CMD, qos=1)

                # Con sesión reanudada, el broker enviará los mensajes pendientes.

                # Resincronizamos los estados de los actuadores.
                for relay_info in relays.values():
                        relay_info['last_published_state'] = None

                # Notifica el cambio de estado
                state_changed.set()

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Fallo la Conexión MQTT", e)
                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff para no saturar el BROKER
                await asyncio.sleep(20)
                continue

        # Gestionamos la Conexión Activa
        if client:
            try:
                # revisamos si hay mensajes entrantes
                # Procesa PINGRESP y actualiza client.last_cpacket
                client.check_msg()

                # Comprobamos si debemos enviar un ping
                if ticks_diff(ticks_ms(), client.last_ping) > (MQTT_CONFIG['PING_INTERVAL'] * 1000):
                    client.ping()
                    # Señal de vida
                    # log(f"{Colors.GREEN}.{Colors.RESET}", end="")

                # Comprobamos si ha pasado demasiado tiempo desde que OÍMOS al broker

                # Damos un margen de 1.5x el KEEPALIVE
                keepalive_margin_ms = MQTT_CONFIG['KEEPALIVE'] * 1000 * 1.5

                if ticks_diff(ticks_ms(), client.last_cpacket) > keepalive_margin_ms:
                    log(f"\n💀  Conexión {Colors.RED} ZOMBIE {Colors.RESET}detectada")

                    # Lanzamos una excepción a propósito para ser capturados
                    raise OSError("Se ha excedido el TIMEOUT del broker MQTT, disconnecting")

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Error en Operación MQTT", e)
                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                # Backoff para no saturar el BROKER
                await asyncio.sleep(20)
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

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import time #type: ignore

    try:
        log(f"    └─ ⏳ {Colors.YELLOW}Inicio Diferido:{Colors.RESET} Esperando {delay}s para {target_relay['name']}")

        # Esperamos el tiempo previsto
        await asyncio.sleep(delay)

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

    except asyncio.CancelledError:
        log(f"    └─ Info: {Colors.YELLOW}Tarea diferida cancelada durante la espera.{Colors.RESET}")
        raise # Re-lanzamos para limpieza interna de asyncio si es necesario

    finally:
        # Limpiamos la referencia a esta tarea en el diccionario global
        global pending_start_tasks
        if actuator_id in pending_start_tasks:
            del pending_start_tasks[actuator_id]

# ---- CORUTINA: Gestión de temporizadores ----
async def timer_manager_task():
    """
    **Gestiona los temporizadores de riego para apagar los relés.**

    Revisa cada segundo si algún actuador debe apagarse.
    """
    global active_irrigation_timers

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from utime import time #type: ignore

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
            else:
                # Si no ha vencido, lo conservamos en la lista
                timers_to_keep.append((actuator_id, end_time))

        # Actualizamos la lista global solo con los pendientes
        active_irrigation_timers = timers_to_keep

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
        state_changed.clear()

        # Debounce: Pausa para agrupar múltiples cambios simultáneos
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
                # Intentamos publicar el nuevo estado
                # Usamos qos=0 (no bloqueante) y retain=True (importante)
                client.publish(relay_info['topic'], current_state.encode('utf-8'), retain=True, qos=0)

                # Sincroniza con el último estado publicado.
                relay_info['last_published_state'] = current_state

                # Log con el carácter dinámico
                log(f"    {tree_char} {relay_info['name']}: {Colors.MAGENTA}{current_state}{Colors.RESET}")
                
                # Evita saturar el socket/broker con ráfagas
                await asyncio.sleep_ms(50)
                
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
                # Reafirmamos que estamos vivos
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)

                #log(f"📡  {Colors.MAGENTA}Heartbeat{Colors.RESET} Enviado")
            except (MQTTException, OSError) as e:
                # Usamos el log detallado pero NO desconectamos forzosamente aquí
                log_mqtt_exception("Publicación del Heartbeat omitida", e)

        # Esperamos el intervalo de publicación
        await asyncio.sleep(MQTT_CONFIG["PUBLISH_INTERVAL"])

# ---- CORUTINA: Programa Principal ----
async def main():
    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from gc import collect
    from network import STA_IF, WLAN # type: ignore
    from ubinascii import hexlify # type: ignore

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
    
    # ---- Bucle de Supervisión y Recolección de Basura ----
    while True:
        # Gestión de Memoria Proactiva
        collect()

        # El event loop cede control a todas las tareas asíncronas.
        await asyncio.sleep(20)

# ---- Punto de Entrada ----
if __name__ == '__main__':
    try:
        # Iniciar loop asíncrono
        asyncio.run(main())
    except KeyboardInterrupt:
        log(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")
    except Exception as e:
        log(f"\n\n❌  Error fatal no capturado: {Colors.RED}{e}{Colors.RESET}\n\n")
    finally:
        # Desconexión limpia 
        shutdown()

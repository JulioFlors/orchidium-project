# -----------------------------------------------------------------------------
# Relay Modules: Actuator Controller Firmware.
# Descripción: Firmware dedicado para el control de las electroválvulas y la bomba de agua.
# Versión: v0.2.0 - (Re)conexión Asíncrona WiFi/MQTT con umqtt.simple2
# Fecha: 28-10-2025
# -----------------------------------------------------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib.
# Esto es necesario para que se importe la librería umqtt.simple2 en lugar
# de la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

import gc
import json
import network # type: ignore
import uasyncio as asyncio # type: ignore
import ubinascii # type: ignore

from machine import Pin # type: ignore
from time import time
from umqtt import errno as umqtt_errno # type: ignore
from umqtt.simple2 import MQTTClient, MQTTException # type: ignore
from utime import ticks_ms, ticks_diff # type: ignore

# ---------------------------- CONFIGURACIÓN GLOBAL ---------------------------

# ---- MODO DEBUG ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = False

# ---- CLASE DE COLORES ANSI ----
class Colors:
    RESET = '\x1b[0m'
    BOLD = '\x1b[1m'
    RED = '\x1b[91m'
    GREEN = '\x1b[92m'
    YELLOW = '\x1b[93m'
    BLUE = '\x1b[94m'
    MAGENTA = '\x1b[95m'
    WHITE = '\x1b[97m'

# ---- CONFIGURACIÓN WIFI ----
WIFI_CONFIG = {
    "SSID": "Private Network ",
    "PASS": "Dev.2022"
}

# ---- CONFIGURACIÓN MQTT ----
MQTT_CONFIG = {
    "SERVER": "192.168.1.5",
    "PORT": 1883,
    "USER": "",
    "PASS": "",
    # El broker esperará ~1.5x este valor antes de desconectar al cliente.
    "KEEPALIVE": 60, # ~1.5x = 90 seg
    # Intervalo para enviar pings de 'keepalive' al broker MQTT.
    "PING_INTERVAL": 60//2, # keepalive//2
    # Intervalo para revisar mensajes MQTT entrantes.
    "CHECK_INTERVAL": 10, # seg
    # tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
    "SOCKET_TIMEOUT": 60,
    # tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
    "MESSAGE_TIMEOUT": 120
}

# ---- TÓPICOS MQTT ----
BASE_TOPIC = b"PristinoPlant/Actuator_Controller"
# Tópico de estado de este dispositivo
MQTT_TOPIC_STATUS = BASE_TOPIC + b"/status"
# Tópico donde se escuchan los comandos del Sistema de riego
MQTT_TOPIC_IRRIGATION_CMD = BASE_TOPIC + b"/irrigation/command"
# Tópico base para publicar los estados de los relés
MQTT_TOPIC_IRRIGATION_STATE = BASE_TOPIC + b"/irrigation/state"

# ---- PARÁMETROS LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = b"offline"

# ---- DEFINICIÓN DE ACTUADORES (Pines y Estado) ----

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

# ---------------------------- LÓGICA DEL FIRMWARE  ---------------------------

# ----VARIABLES GLOBALES DE ESTADO ----
# Lista de temporizadores de riego activos
active_irrigation_timers = []

# Evento para notificar cambios de estado de un actuador
state_changed = asyncio.Event()

# Variables de control
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# ---- FUNCIÓN AUXILIAR: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

# ---- FUNCIÓN AUXILIAR: CALLBACK MQTT ----
def sub_callback(topic, msg, retained, dup):
    """**Callback SÍNCRONO que se ejecuta al recibir mensajes.**"""

    log(f"\n{Colors.BLUE}>  Mensaje Recibido (retained: {retained}, dup: {dup}){Colors.RESET}")
    log(f"{Colors.WHITE}   Tópico: {topic.decode('utf-8')}{Colors.RESET}")
    log(f"{Colors.WHITE}   Mensaje: \n{msg.decode('utf-8')}{Colors.RESET}")

    if topic == MQTT_TOPIC_IRRIGATION_CMD:
        try:
            data = json.loads(msg)
            actuator_ref = data.get('actuator')
            state = data.get('state', '').strip().upper()
            duration = data.get('duration')

            target_relay, actuator_id = None, None

            # Búsqueda del Actuador
            # Si actuator_ref es un número
            if isinstance(actuator_ref, int) and actuator_ref in relays:
                target_relay, actuator_id = relays[actuator_ref], actuator_ref
            # Si actuator_ref es un string
            elif isinstance(actuator_ref, str):
                for id, info in relays.items():
                    if info['name'] == actuator_ref.lower():
                        target_relay, actuator_id = info, id
                        break

            # Validar que el mensaje es correcto
            if target_relay is None or state not in ["ON", "OFF"]:
                log(f"{Colors.RED}>  Comando inválido{Colors.RESET}")
                return

            # Lógica de control
            relay_value = 1 if state == "ON" else 0

            if target_relay['state'] != state:
                target_relay['pin'].value(relay_value)
                target_relay['state'] = state

                log(f"{Colors.WHITE}   Actuador ({target_relay['name']}): {state}{Colors.RESET}")

                state_changed.set() # Despertamos al publisher

           # Gestión de temporizador
            if state == "ON" and isinstance(duration, int) and duration > 0:
                end_time = time() + duration

                # Eliminamos cualquier temporizador existente para este actuador, ya que un nuevo comando lo reemplaza
                global active_irrigation_timers
                active_irrigation_timers = [
                    (id, t) for id, t in active_irrigation_timers if id != actuator_id
                ]

                active_irrigation_timers.append((actuator_id, end_time))
                log(f"   Temporizador: Apagar relé en {duration} segundos.")

        except (ValueError, KeyError, TypeError) as e:
            log(f"{Colors.RED}   Error al procesar comando JSON: {e}{Colors.RESET}")

# ---- FUNCIÓN AUXILIAR: CALLBACK DE ESTADO ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""

    if DEBUG: return

    if status == umqtt_errno.SDELIVERED:
        log(f"\n{Colors.GREEN}>  Mensaje con PID:{pid} {Colors.GREEN}entregado con éxito.{Colors.RESET}")
    elif status == umqtt_errno.STIMEOUT:
        log(f"\n{Colors.YELLOW}>  Timeout para el mensaje con PID:{pid}. El broker no confirmó.{Colors.RESET}")
    elif status == umqtt_errno.SUNKNOWNPID:
        log(f"\n{Colors.RED}>  PID:{pid} desconocido. El broker respondió con un PID inesperado.{Colors.RESET}")

# ---- FUNCIÓN AUXILIAR: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt():
    """**Cierra forzosamente el socket MQTT e invalida el cliente.**"""
    global client

    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try: client.disconnect()
        except OSError: pass
        finally:
            if hasattr(client, 'sock') and client.sock:
                try: client.sock.close()
                except OSError: pass
            client = None
            log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Cliente  {Colors.RESET}{Colors.GREEN}Desconectado{Colors.RESET}")

# ---- CORUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    """**Gestiona la (re)conexión asíncrona del WiFi**"""
    global wlan

    # Inicialización del objeto WLAN
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    connected_once = False # Conexión inicial.

    while True:
        if not wlan.isconnected():

            if connected_once:
                log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}WiFi {Colors.RESET}{Colors.RED}Desconectado{Colors.RESET}")

            try:
                # fuerza a la capa de red a limpiar todos los estados internos, timers y handshakes pendientes antes de intentar una nueva conexion
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(1)
                wlan.active(True)
                
                log(f"\n\n{Colors.BLUE}>  {Colors.RESET}{Colors.WHITE}Conectándose a {Colors.RESET}{Colors.BLUE}{WIFI_CONFIG['SSID']}{Colors.RESET}", end="")

                wlan.connect(WIFI_CONFIG['SSID'], WIFI_CONFIG['PASS'])

                start_time = time()
                while not wlan.isconnected():
                    log(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)

                duration = time() - start_time
                
                log(f"\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Conexión WiFi Establecida {Colors.RESET}{Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                # Formato de tiempo de reconexión condicional
                if duration > 60 and duration < 3600:
                    minutes = int(duration // 60)
                    seconds = int(duration % 60)
                    log(f"{Colors.MAGENTA}>  {Colors.RESET}{Colors.WHITE}Tiempo de reconexión: {Colors.MAGENTA}{minutes}:{seconds:02d} {Colors.RESET}")
                elif duration >= 3600:
                    hours = int(duration // 3600)
                    minutes = int((duration % 3600) // 60)
                    seconds = int(duration % 60)
                    log(f"{Colors.MAGENTA}>  {Colors.RESET}{Colors.WHITE}Tiempo de reconexión: {Colors.MAGENTA}{hours}:{minutes:02d}:{seconds:02d} {Colors.RESET}")

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()

                # Primera Conexión Establecida.
                connected_once = True

            except Exception as e:
                # OSErrors durante la conexión WiFi (ej: hardware no disponible, fallo de IP)
                log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error al conectar WiFi: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            # Revisamos la conexion cada 20 segundos
            await asyncio.sleep(20)

# ---- CORUTINA: Gestión de Conexión MQTT ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    while True:
        # Cede el control al planificador de asyncio
        await asyncio.sleep(MQTT_CONFIG['CHECK_INTERVAL'])

        # Esperamos a que el WiFi esté conectado
        if wlan is None or not wlan.isconnected():
            # Cedemos el control y esperamos a que la tarea wifi_coro haga su trabajo
            await asyncio.sleep(5)
            continue

        # Gestionamos la (Re)conexión
        if client is None:
            try:
                log(f"{Colors.BLUE}>  {Colors.RESET}{Colors.WHITE}Conectando {Colors.RESET}{Colors.BLUE}Broker MQTT{Colors.RESET}")

                # Inicializa el Cliente MQTT
                client = MQTTClient(
                    client_id=client_id,
                    server=MQTT_CONFIG["SERVER"],
                    port=MQTT_CONFIG["PORT"],
                    user=MQTT_CONFIG["USER"], password=MQTT_CONFIG["PASS"],
                    keepalive=MQTT_CONFIG["KEEPALIVE"],
                    socket_timeout=MQTT_CONFIG["SOCKET_TIMEOUT"],
                    message_timeout=MQTT_CONFIG["MESSAGE_TIMEOUT"]
                )

                # Configura Last Will and Testament (LWT)
                client.set_last_will(LWT_TOPIC, LWT_MESSAGE, retain=True, qos=1)
                
                # Configura el callback para mensajes entrantes
                client.set_callback(sub_callback)

                # Configura el callback de estado
                client.set_callback_status(sub_status_callback)

                # El método connect() nos dice si la sesión se reanudó.
                session_resumed = client.connect(clean_session=False)

                log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Conexión MQTT {Colors.RESET}{Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                if not session_resumed:
                    # Suscripción a tópicos
                    client.subscribe(MQTT_TOPIC_IRRIGATION_CMD, qos=1)

                    log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Suscrito a tópicos{Colors.RESET}", end="\n")

                # Con sesión reanudada, el broker enviará los mensajes pendientes.

                # Publica que el ESP32 esta ONLINE
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

                log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}ESP32 ONLINE{Colors.RESET}", end="\n")

                # Resincronizamos los estados de los actuadores.
                for relay_info in relays.values():
                        relay_info['last_published_state'] = None
                state_changed.set()

            except (MQTTException, OSError) as e:
                log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Fallo en conexión MQTT: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                await asyncio.sleep(10)
                continue

        if client:
            # Gestionamos la Conexión Activa
            try:
                # revisamos si hay mensajes entrantes
                client.check_msg()

                # Comprobamos la salud de la conexión
                if ticks_diff(ticks_ms(), client.last_ping) > (MQTT_CONFIG['PING_INTERVAL'] * 1000):
                    client.ping()
                    # Señal de vida
                    log(f"{Colors.GREEN}.{Colors.RESET}", end="")

            except (MQTTException, OSError) as e:
                log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error en operación MQTT: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                continue

# ---- CORUTINA: Gestión de temporizadores ----
async def timer_manager_task():
    """**Gestiona los temporizadores de riego para apagar los relés.**"""
    global active_irrigation_timers

    while True:
        # Cede el control al planificador de asyncio
        await asyncio.sleep(1)

        # Si no hay temporizadores, no hacemos nada.
        if not active_irrigation_timers:
            continue

        current_time = time() # tiempo actual
        timers_to_keep = [] # lista auxiliar

        for actuator_id, end_time in active_irrigation_timers:
            if current_time >= end_time:
                # verificamos que exista
                target_relay = relays.get(actuator_id)
                # verificamos que este ON
                if target_relay and target_relay['state'] == "ON":
                    target_relay['pin'].value(0) # Apaga el relé | active-HIGH
                    target_relay['state'] = "OFF" # Reestablece el state en el Diccionario de Relays
                    state_changed.set() # Notifica el cambio de estado
            else:
                timers_to_keep.append((actuator_id, end_time))

        active_irrigation_timers = timers_to_keep

# ---- CORUTINA: Publicación de Estado ----
async def state_publisher_task():
    """**Publica los cambios de estado de los actuadores, controlado por un evento.**"""
    global client

    while True:
        await state_changed.wait()
        state_changed.clear()

        # Hacemos una pausa para agrupar múltiples cambios de estado que puedan haber ocurrido.
        await asyncio.sleep_ms(50) # Debounce

        # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
        if client is None or not (wlan and wlan.isconnected()):
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Publicación omitida: Cliente/WiFi no disponible.{Colors.RESET}")
            continue 
        
        # Intentamos publicar solo si el cliente existe y la red está aparentemente OK
        try:
            # Recorre todos los relés.
            for relay_info in relays.values():
                current_state  = relay_info['state']
                last_published = relay_info['last_published_state']

                # comprueba si su estado ha cambiado.
                if current_state != last_published:
                    
                    # Publica el nuevo estado
                    client.publish(relay_info['topic'], current_state.encode('utf-8'), retain=True, qos=1)

                    # Sincroniza con el último estado publicado.
                    relay_info['last_published_state'] = current_state
                    log(f"\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Publicado: {relay_info['name']} {Colors.RESET}{Colors.GREEN}->{Colors.RESET}{Colors.WHITE} {current_state}{Colors.RESET}")

        except (MQTTException, OSError) as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Fallo la publicación: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

            # Llamamos a la función síncrona para liberar el socket y obligar a reconectar
            force_disconnect_mqtt()

# ---- CORUTINA: Programa Principal ----
async def main():

    # ---- Identificación unica del ESP32 ----
    # Obtenemos la MAC del dispositivo
    mac_address = ubinascii.hexlify(network.WLAN(network.STA_IF).config('mac')).decode()
    # Construye el client_id único
    client_id = f"ESP32-Actuator-Controller-{mac_address}"
    
    # ---- Tareas Asíncronas ----
    # Reconexión WiFi (Prioridad de red)
    asyncio.create_task(wifi_coro())
    # Reconexión MQTT (Depende de WiFi)
    asyncio.create_task(mqtt_connector_task(client_id))
    # Publicación de estados (Depende de MQTT)
    asyncio.create_task(state_publisher_task())
    # Gestión de temporizadores
    asyncio.create_task(timer_manager_task())
    
    # ---- Bucle de Supervisión y Recolección de Basura ----
    while True:
        # Gestión de Memoria Proactiva
        gc.collect()

        # El event loop cede control a todas las tareas asíncronas.
        await asyncio.sleep(30)

# ---- FUNCIÓN AUXILIAR: Gestión de desconexión ----
def shutdown():
    """**Apagado limpio de relés y publicaciones LWT.**"""

    # Apagamos todos los actuadores físicamente
    for relay_info in relays.values():
        relay_info['pin'].value(0)
        relay_info['state'] = 'OFF'

    # Si el cliente MQTT existe y está conectado.
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            # Publicamos 'OFF' para cada relé que haya cambiado de estado.
            for relay_info in relays.values():
                if relay_info['last_published_state'] != 'OFF':
                    client.publish(relay_info['topic'], b"OFF", retain=True, qos=1)
        except (MQTTException, OSError) as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error en publicación de apagado: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

    # Invalidamos el cliente MQTT forzando una desconexión completa (síncrona).
    force_disconnect_mqtt()

    # Desconectar WiFi.
    if wlan and wlan.isconnected():
        wlan.disconnect()
        log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}WiFi     {Colors.RESET}{Colors.GREEN}Desconectado{Colors.RESET}\n")

try:
    asyncio.run(main())
except KeyboardInterrupt:
    log(f"\n\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Programa {Colors.RESET}{Colors.GREEN}Detenido{Colors.RESET}")
except Exception as e:
        log(f"\n\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error fatal no capturado: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}\n\n")
finally:
    # Desconexión limpia 
    shutdown()

# -----------------------------------------------------------------------------
# Sensors: Environmental Monitoring Firmware.
# Descripción: Firmware dedicado al Monitoreo de las condiciones ambientales del Invernadero.
# Versión: v0.4.2 - Fix crítico SSL/MQTT
# Fecha: 04-02-2026
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
    "CHECK_INTERVAL": 10, # seg
    # Intervalo para publicar datos de los sensores principales.
    "PUBLISH_INTERVAL": 300, # 5 minutos
    # tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
    "SOCKET_TIMEOUT": 60,
    # tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
    "MESSAGE_TIMEOUT": 120
}

# ---- Tópicos MQTT ----
BASE_TOPIC = b"PristinoPlant/Environmental_Monitoring/Zona_A"

# Tópico de estado de este dispositivo
MQTT_TOPIC_STATUS = BASE_TOPIC + b"/status"

# Tópico para el paquete de datos ambientales (JSON)
MQTT_TOPIC_ENV_DATA = BASE_TOPIC + b"/readings"

# Tópico para el ESTADO de la lluvia
MQTT_TOPIC_RAIN_STATE = BASE_TOPIC + b"/rain/state"

# Tópico para el EVENTO de lluvia (JSON con duración/intensidad)
MQTT_TOPIC_RAIN_EVENT = BASE_TOPIC + b"/rain/event"

# Tópico para recibir comandos en Texto plano. (Reiniciar dispositivo)
MQTT_TOPIC_CMD = BASE_TOPIC + b"/cmd"

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
# Sensor de Temp/Humedad
dht_sensor = None
# Sensor de Luz I2C
light_sensor = None
# Sensor de Lluvia (Salida Analógica)
rain_sensor_analog = None

# ---- Variables Globales de Estado ----
# Variables de control
wlan    = None # Conexión WiFi
client  = None # Cliente  MQTT

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
        log(f"\n❌  {context}: {Colors.RED}{e}{Colors.RESET} (No se encotró lib/umqtt")
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
        
        log(f"\n❌  {context}: {Colors.RED}[Red] {err_msg}{Colors.RESET}")
    
    # Cualquier otra excepción (Python bugs, MemoryError, etc)
    else:
        log(f"\n❌  {context}: {Colors.RED}{e}{Colors.RESET}")

# ---- Función Auxiliar: Inicializar Hardware ----
def setup_sensors():
    global dht_sensor, light_sensor, rain_sensor_analog

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from bh1750 import BH1750 # type: ignore
    from dht import DHT22 # type: ignore
    from machine import ADC, I2C, Pin, reset # type: ignore

    try:
        # Sensor de Temp/Humedad
        dht_sensor = DHT22(Pin(4))

        # Sensor de Luz I2C
        i2c = I2C(0, scl=Pin(22), sda=Pin(21))
        light_sensor = BH1750(bus=i2c, addr=0x23)

        # Sensor de Lluvia (Salida Analógica)
        rain_sensor_analog = ADC(Pin(35))
        # Configura el rango de 0-3.3V
        rain_sensor_analog.atten(ADC.ATTN_11DB)

    except Exception as e:
        log(f"\n❌  Error en setup_sensors(): {Colors.RED}{e}{Colors.RESET}")

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
    # Lazy Imports (Importación tardía)
    from ujson import dumps, loads #type: ignore

    try:
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

        # ---- 🛡️ Lógica para los Comandos del Sistema (/cmd) ----
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

    except Exception as e:
        log(f"\n❌  Error en sub_callback(): {Colors.RED}{e}{Colors.RESET}")

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
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
            log(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

# ---- Función Auxiliar: Gestión de desconexión (Graceful Shutdown - Sensors) ----
def shutdown():
    """
    **Apagado Controlado (Sensores)**
    * Publica `offline` explícitamente.
    * Desconecta MQTT y WiFi.
    """

    # Publicamos en MQTT (Solo si hay conexión)
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            # Publicamos el LWT explícitamente para que el broker lo retenga.
            # El LWT para el cliente MQTT solo se envía si el cliente se desconecta inesperadamente. 
            # Si nos desconectamos limpiamente,
            # el broker no lo envía automáticamente.
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
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

# ---- CORUTINA: Gestión de Conexión MQTT (Sensors) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
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
                    user=MQTT_CONFIG["USER"], password=MQTT_CONFIG["PASS"],
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
                # client.connect()

                # El método connect() nos dice si la sesión se reanudó.
                session_resumed = client.connect(clean_session=False)

                log(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Publica que el ESP32 esta ONLINE
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

                # Suscripción a tópicos
                if not session_resumed:
                    # cmd/
                    client.subscribe(MQTT_TOPIC_CMD, qos=1)

                # Con sesión reanudada, el broker enviará los mensajes pendientes.

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Fallo la Conexión MQTT", e)
                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                await asyncio.sleep(10)
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
                continue

        # Cede el control al planificador de asyncio
        await asyncio.sleep(MQTT_CONFIG['CHECK_INTERVAL'])

# ---- CORUTINA: Gestión de la publicacion de sensores ----
async def sensor_publish_task():
    """
    * **Lee todos los sensores** de forma aislada.
    * **Agrupa los datos en un unico paquete JSON**
    * **Se ejecuta cada PUBLISH_INTERVAL segundos**
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from bh1750 import BH1750 #type: ignore
    from ujson import dumps #type: ignore
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
        if client is None or not (wlan and wlan.isconnected()):
            log(f"\n❌  Publicación omitida: {Colors.RED}Cliente/WiFi no disponible{Colors.RESET}")
            continue 

        # ---- Lectura de Sensores ----#
        # Reestablecemos en cada iteracion
        temp, hum, lux = None, None, None

        try:
            # Leemos el sensor, guardamos su valor (o None si falla)
            dht_sensor.measure()
            temp_sensor = dht_sensor.temperature()
            hum_sensor = dht_sensor.humidity()

            # Validar que la lectura sea un número (no solo 'True')
            if (isinstance(temp_sensor, (int, float)) and isinstance(hum_sensor, (int, float))):
                temp = round(temp_sensor, 1)
                hum  = round(hum_sensor,  1)

                log(f"\n📡  Temp: {Colors.MAGENTA}{temp}°C{Colors.RESET}  Hum: {Colors.BLUE}{hum}%{Colors.RESET}", end="  ")
            else:
                raise ValueError("Lectura invalida o nula del DHT22")

        except Exception as e:
            log(f"\n❌  ERROR de lectura del sensor DHT22: {Colors.RED}{e}{Colors.RESET}")


        try:
            # Leemos el sensor, guardamos su valor (o None si falla)
            lux_sensor = light_sensor.luminance(BH1750.CONT_HIRES_1)

            # Validar que la lectura sea un número (no solo 'True')
            if isinstance(lux_sensor, (int, float)):
                lux = round(lux_sensor, 1)

                log(f"Lux: {Colors.YELLOW}{lux}{Colors.RESET}")
            else:
                raise ValueError("Lectura invalida o nula del BH1750")

        except Exception as e:
            log(f"\n❌  ERROR de lectura del sensor BH1750: {Colors.RED}{e}{Colors.RESET}")

        # ---- Construccion del JSON ----#
        data_payload = {}
        # Incluimos en un diccionario los valores que NO son None
        if temp is not None:
            data_payload['temperature'] = temp
        if hum is not None:
            data_payload['humidity'] = hum
        if lux is not None:
            data_payload['light_intensity'] = lux

        if not data_payload:
            log(f"\n❌  Publicación omitida: {Colors.RED}Todos los sensores fallaron{Colors.RESET}")
            continue

        # ---- Publicación Atómica de los datos ----#
        try:
            # Convertimos el diccionario a un string JSON
            json_string = dumps(data_payload)

            # Publicamos el paquete JSON (qos=0, no bloqueante)
            client.publish(MQTT_TOPIC_ENV_DATA, json_string.encode('utf-8'), retain=False, qos=0)

            # log(f"\n📡  Paquete de sensores publicado: {Colors.MAGENTA}{json_string}{Colors.RESET}")

        # Este bloque captura unicamente errores de RED/MQTT
        except (MQTTException, OSError) as e:
            log_mqtt_exception("Publicación del paquete de datos ambientales omitida", e)
            # Invalidamos el cliente MQTT forzando una reconexión completa.
            force_disconnect_mqtt()

        except Exception as e:
            log(f"\n❌  ERROR en sensor_publish_task(): {Colors.RED}{e}{Colors.RESET}")

        # Esperamos el intervalo de publicación
        await asyncio.sleep(MQTT_CONFIG["PUBLISH_INTERVAL"])

# ---- CORUTINA: Gestión del sensor de lluvia ----
async def rain_monitor_task():
    """
    #### Tarea dedicada (MÁQUINA DE ESTADOS)
    *  Monitorea el estado de la lluvia usando la salida analógica (A0).
    *  Estabiliza la lectura del sensor de lluvia (Oversampling / Promedio)
    *  Toma 20 muestras rapidas para eliminar ruido
    *  Utiliza umbrales con histéresis para detectar inicio y fin de un evento de lluvia.
    *  Calcula y publica la duración y la intensidad del evento.
    *  La histéresis es un fenómeno en el que el estado de un sistema depende de su historia pasada, y no solo de las fuerzas que lo afectan en el momento presente.Se manifiesta como un retraso entre una causa y su efecto.
    """

    # (Optimización de memoria RAM)
    # Lazy Imports (Importación tardía)
    from ujson import dumps #type: ignore
    from umqtt.simple2 import MQTTException # type: ignore
    from utime import ticks_ms, ticks_diff #type: ignore

    # ---- Calibración ----
    # RAW ALTO (4095) = SECO
    # RAW BAJO (0) = MOJADO

    # ---- Umbrales para la Máquina de Estados (Cuándo empieza/termina el evento) ----
    RAIN_START_THRESHOLD = 2350 # Mojado
    RAIN_STOP_THRESHOLD = 2700 # Seco

    # ---- Rango para calcular la intensidad percibida ----
    RAW_INTENSITY_MIN = 1700 # 100% Diluvio
    RAW_INTENSITY_MAX = 2700 # 0% Salpicaduras

    # --- Tiempos de Muestreo ---
    INTERVAL_NORMAL = 60  # Modo Vigilancia en Producción (1min)
    INTERVAL_BURST  = 20   # Modo Ráfaga en Producción (20seg)
    
    # inicialiación de variables
    current_interval = INTERVAL_NORMAL
    current_state = 'Dry'
    start_ticks = 0
    total_int = 0
    samples = 0

    while True:
        # ---- Lectura Estable (Oversampling / Promedio) del sensor de lluvia ----
        # Tomamos 20 muestras rapidas (1seg) para eliminar ruido
        raw_sum = 0
        valid_samples = 0
        TARGET_SAMPLES = 20

        for _ in range(TARGET_SAMPLES):
            try:
                # Intentamos leer
                val = rain_sensor_analog.read()
                raw_sum += val
                valid_samples += 1
            except Exception as e:
                # Si falla una lectura individual, solo seguimos intentando
                pass
            
            # Pausa entre muestras
            await asyncio.sleep_ms(50)

        # Verificamos si logramos obtener al menos una lectura válida
        if valid_samples == 0:
            log(f"\n❌  Hubo un Problema: El sensor de lluvia no responde (0/{TARGET_SAMPLES} muestras)")
            # Esperamos el intervalo correspondiente antes de volver a intentar todo el proceso
            await asyncio.sleep(current_interval)
            continue

        # Calculamos el promedio usando SOLO las muestras válidas
        # (Evita que el promedio caiga artificialmente si falla una lectura)
        raw = int(raw_sum / valid_samples)

        # Refinar valor de RAIN_START_THRESHOLD (ajustar sensibilidad)
        # log(f"💧  RAW: {Colors.CYAN}{raw}{Colors.RESET}")

        # ---- Cálculo de Intensidad de la lluvia ----
        # Interpretar raw >= 2700 -> 0% (seco)
        # Interpretar raw <= 1700 -> 100% (mojado)

        # Clamping: Forzamos 'raw' a estar dentro del rango [MIN, MAX]
        #    Si raw < 1700 -> se vuelve 1700
        #    Si raw > 2700 -> se vuelve 2700
        clamped_raw = max(RAW_INTENSITY_MIN, min(raw, RAW_INTENSITY_MAX))

        # Diferencia máxima entre los valores aceptados
        delta_max = RAW_INTENSITY_MAX - RAW_INTENSITY_MIN
        
        # Normalización Inversa: (MAX - valor) / (MAX - MIN)
        intensity = round(((RAW_INTENSITY_MAX - clamped_raw) / delta_max) * 100)

        # ---- Lógica de publicación y Máquina de Estados ----
        try:
            # ESTADO 1: Lluvia Detectada
            if raw < RAIN_START_THRESHOLD and current_state == 'Dry':
                current_state = 'Raining'

                # Activamos Modo Ráfaga
                current_interval = INTERVAL_BURST

                start_ticks = ticks_ms()
                total_int = 0
                samples = 0

                # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
                if client is None or not (wlan and wlan.isconnected()):
                    log(f"\n❌  Publicación de{Colors.BLUE} LLUVIA {Colors.RESET}omitida:{Colors.RED} Cliente/WiFi no disponible{Colors.RESET}")
                    continue
                else:
                    # Si la publicacion se pierde, la lógica de 'Dry' lo corregirá.
                    client.publish(MQTT_TOPIC_RAIN_STATE, b"Raining", retain=True, qos=0)

                log(f"\n🌧️  {Colors.BLUE}Lluvia Detectada{Colors.RESET}")
                log(f"    ├─ Sensor: {Colors.CYAN}{raw}{Colors.RESET}")
                log(f"    └─ intensity: {Colors.BLUE}{intensity}%{Colors.RESET}\n")

            # ESTADO 2: Está lloviendo
            elif current_state == 'Raining':
                # Mientras llueve, acumulamos lecturas de intensidad
                if raw <= RAIN_STOP_THRESHOLD:
                    total_int += intensity
                    samples += 1

                    # Refinar valor de RAIN_STOP_THRESHOLD (ajustar sensibilidad)
                    # log(f"💧  Muestra: {Colors.CYAN}{raw}{Colors.RESET} ({Colors.BLUE}{intensity}%{Colors.RESET})")

                # ESTADO 3: Dejó de llover
                if raw > RAIN_STOP_THRESHOLD:
                    current_state = 'Dry'

                    # Volvemos al Modo Vigilancia
                    current_interval = INTERVAL_NORMAL

                    # Cálculo preciso con ticks_diff (Maneja desbordamiento)
                    duration_ms = ticks_diff(ticks_ms(), start_ticks)
                    duration_sec = round(duration_ms / 1000)

                    avg_int = round(total_int / samples) if samples > 0 else 0

                    # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
                    if client is None or not (wlan and wlan.isconnected()):
                        log(f"\n❌  Publicación de{Colors.BLUE} LLUVIA {Colors.RESET}omitida:{Colors.RED} Cliente/WiFi no disponible{Colors.RESET}")
                        continue
                    else:
                        # Publicamos el cambio de ESTADO
                        client.publish(MQTT_TOPIC_RAIN_STATE, b"Dry", retain=True, qos=0)

                        # Creamos el paquete JSON
                        evt = {"duration_seconds": duration_sec, "average_intensity_percent": avg_int}

                        # Lo publicamos como (string JSON)
                        client.publish(MQTT_TOPIC_RAIN_EVENT, dumps(evt), retain=False, qos=0)

                    log(f"\n☀️  {Colors.YELLOW}Lluvia Finalizada{Colors.RESET}")
                    log(f"    ├─ Duración:   {Colors.MAGENTA}{duration_sec}s{Colors.RESET}")
                    log(f"    ├─ Muestras:   {samples} (cada {INTERVAL_BURST}s)")
                    log(f"    └─ Intensidad: {Colors.BLUE}{avg_int}% (Promedio){Colors.RESET}\n")

        except (MQTTException, OSError) as e:
            log_mqtt_exception("ERROR durante el monitoreo de lluvia", e)
            # Invalidamos el cliente MQTT forzando una reconexión completa.
            force_disconnect_mqtt()

        except Exception as e:
            log(f"\n❌  ERROR en rain_monitor_task(): {Colors.RED}{e}{Colors.RESET}")

        # Esperamos el intervalo de monitoreo
        await asyncio.sleep(current_interval)

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
        if client and wlan and wlan.isconnected():
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
    client_id = f"ESP32-Environmental-Monitor-ZONA_A-{mac_address}"

    # ---- Inicialización del Hardware ----
    setup_sensors()

    # ---- Tareas Asíncronas ----
    # (Re)conexión WiFi (Prioridad de red)
    asyncio.create_task(wifi_coro())
    # Reconexión MQTT (Depende de WiFi)
    asyncio.create_task(mqtt_connector_task(client_id))
    # Gestión de la publicacion de sensores
    asyncio.create_task(sensor_publish_task())
    # Gestión del monitoreo de lluvia
    asyncio.create_task(rain_monitor_task())
    # Gestion de la señal de vida del firmware
    asyncio.create_task(heartbeat_task())
    
    # ---- Bucle de Supervisión y Recolección de Basura ----
    while True:
        # Gestión de Memoria Proactiva
        collect() 

        # El event loop cede control a todas las tareas asíncronas.
        await asyncio.sleep(30)

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

# -----------------------------------------------------------------------------
# Sensors: Environmental Monitoring Firmware.
# Descripción: Firmware dedicado al Monitoreo de las condiciones ambientales del Invernadero.
# Versión: v0.3.3 - Implementación de Detección Zombie, Publicación JSON Atómica, Actualización de Firmware con OTA y Apagado Controlado v2
# Fecha: 02-12-2025
# -----------------------------------------------------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib. 
# Esto es necesario para que se importe la librería umqtt.simple2 en lugar 
# de la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

import dht # type: ignore
import gc # type: ignore
import network # type: ignore
import uasyncio as asyncio # type: ignore
import ubinascii # type: ignore
import ujson # type: ignore

from bh1750 import BH1750 # type: ignore
from machine import ADC, I2C, Pin, reset # type: ignore
from ota import OTAUpdater # type: ignore
from time import time
from umqtt import errno as umqtt_errno # type: ignore
from umqtt.simple2 import MQTTClient, MQTTException # type: ignore
from utime import ticks_ms, ticks_diff # type: ignore

# ---- IMPORTACIÓN SEGURA ---- CONFIGURACIÓN WIFI ---- #
try:
    from secrets import WIFI_CONFIG
except ImportError:
    print("Error: No se encontró secrets.py")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_CONFIG = {"SSID": "", "PASS": ""} 

# ---------------------------- CONFIGURACIÓN GLOBAL ---------------------------

# ---- MODO DEBUG ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

# ---- CONFIGURACIÓN OTA ----
OTA_CONFIG = {
    "URL": "https://raw.githubusercontent.com/JulioFlors/orchidium-project/refs/heads/Dev/firmware/sensors/"
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
    # Intervalo para publicar datos de los sensores principales.
    "PUBLISH_INTERVAL": 300, # 5 minutos
    # Intervalo para monitorear el sensor de lluvia y actualizar su estado. 
    "RAIN_MONITOR_INTERVAL": 60,
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

# ---- PARÁMETROS LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = b"offline"

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

# ---------------------------- LÓGICA DEL FIRMWARE  ---------------------------

# ---- INICIALIZACIÓN DE HARDWARE ----
# Sensor de Temp/Humedad
dht_sensor = dht.DHT22(Pin(4))

# Sensor de Luz I2C
i2c = I2C(0, scl=Pin(22), sda=Pin(21))
light_sensor = BH1750(bus=i2c, addr=0x23)

# Sensor de Lluvia (Salida Analógica)
rain_sensor_analog = ADC(Pin(35))
# Configura el rango de 0-3.3V
rain_sensor_analog.atten(ADC.ATTN_11DB)

# ---- VARIABLES GLOBALES DE ESTADO ----
wlan   = None # Conexión WiFi
client = None # Cliente  MQTT

# ---- FUNCIÓN AUXILIAR: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

# ---- FUNCIÓN AUXILIAR: CALLBACK DE ESTADO ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""

    if not DEBUG: return

    if status == umqtt_errno.SDELIVERED:
        log(f"\n{Colors.GREEN}>  Mensaje con PID:{pid} {Colors.GREEN}entregado con éxito.{Colors.RESET}")
    elif status == umqtt_errno.STIMEOUT:
        log(f"\n{Colors.YELLOW}>  Timeout para el mensaje con PID:{pid}. El broker no confirmó.{Colors.RESET}")
    elif status == umqtt_errno.SUNKNOWNPID:
        log(f"\n{Colors.RED}>  PID:{pid} desconocido. El broker respondió con un PID inesperado.{Colors.RESET}")

# ---- FUNCIÓN AUXILIAR: CALLBACK MQTT ----
def sub_callback(topic, msg, retained, dup):
    """**Callback SÍNCRONO que se ejecuta al recibir mensajes desde el Broker**"""

    log(f"\n{Colors.BLUE}>  Mensaje Recibido (retained: {retained}, dup: {dup}){Colors.RESET}")
    log(f"{Colors.WHITE}   Tópico: {topic.decode('utf-8')}{Colors.RESET}")
    log(f"{Colors.WHITE}   Mensaje: \n{msg.decode('utf-8')}{Colors.RESET}")

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

# ---- FUNCIÓN AUXILIAR: Gestión de desconexión (Graceful Shutdown - Sensors) ----
def shutdown():
    """
    **Apagado Controlado (Sensores)**
    * Publica `offline` explícitamente en el tópico de estado.
    * Desconecta MQTT y WiFi.
    """
    global client, wlan

    # Publicamos en MQTT (Solo si hay conexión)
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            # Publicamos el LWT explícitamente para que el broker lo retenga.
            # El LWT para el cliente MQTT solo se envía si el cliente se desconecta inesperadamente. 
            # Si nos desconectamos limpiamente,
            # el broker no lo envía automáticamente.
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
        except (MQTTException, OSError) as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error en publicación offline: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

    # Invalidamos el cliente MQTT forzando una reconexión completa.
    force_disconnect_mqtt()

    # Desconectamos el WiFi.
    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}WiFi     {Colors.RESET}{Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass # Ignoramos errores de hardware al apagar

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
                # client.set_callback(sub_callback)

                # Configura el callback de estado
                client.set_callback_status(sub_status_callback)

                # Iniciamos en una sesión limpia.
                # Sin persistencia
                client.connect()

                log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Conexión MQTT {Colors.RESET}{Colors.GREEN}Establecida{Colors.RESET}", end="\n")

                # Publica que el ESP32 esta ONLINE
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)

                log(f"\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Publicado: ESP32{Colors.RESET}{Colors.GREEN} ➜ {Colors.RESET}{Colors.WHITE}ONLINE{Colors.RESET}", end="\n")

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
                # Procesa PINGRESP y actualiza client.last_cpacket
                client.check_msg()

                # Comprobamos si debemos enviar un ping
                if ticks_diff(ticks_ms(), client.last_ping) > (MQTT_CONFIG['PING_INTERVAL'] * 1000):
                    client.ping()
                    # Señal de vida
                    log(f"{Colors.GREEN}.{Colors.RESET}", end="")

                # Comprobamos si ha pasado demasiado tiempo desde que OÍMOS al broker

                # Damos un margen de 1.5x el KEEPALIVE
                keepalive_margin_ms = MQTT_CONFIG['KEEPALIVE'] * 1000 * 1.5

                if ticks_diff(ticks_ms(), client.last_cpacket) > keepalive_margin_ms:
                    log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Conexión{Colors.RED} ZOMBIE {Colors.RESET}{Colors.WHITE}detectada.{Colors.RESET}")

                    # Lanzamos una excepción a propósito para ser capturados
                    raise OSError("Se ha excedido el TIMEOUT del broker MQTT, disconnecting")

            except (MQTTException, OSError) as e:
                log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error en operación MQTT: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}\n")

                # Invalidamos el cliente MQTT forzando una reconexión completa.
                force_disconnect_mqtt()
                continue


# ---- CORUTINA: Gestión de la publicacion de sensores ----
async def sensor_publish_task():
    """
    * **Lee todos los sensores** de forma aislada.
    * **Agrupa los datos en un unico paquete JSON**
    * **Se ejecuta cada PUBLISH_INTERVAL segundos**
    """
    global client

    while True:
        # Espera el intervalo de publicación
        await asyncio.sleep(MQTT_CONFIG["PUBLISH_INTERVAL"])

        # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
        if client is None or not (wlan and wlan.isconnected()):
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Publicación omitida: Cliente/WiFi no disponible.{Colors.RESET}")
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

                log(f"\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Temp: {Colors.RESET}{Colors.MAGENTA}{temp}°C{Colors.RESET}  {Colors.WHITE}Hum: {Colors.RESET}{Colors.BLUE}{hum}%{Colors.RESET}", end="  ")
            else:
                raise ValueError("Lectura invalida o nula del DHT22")

        except Exception as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR de lectura del sensor DHT22: {Colors.RED}{e}{Colors.RESET}")


        try:
            # Leemos el sensor, guardamos su valor (o None si falla)
            lux_sensor = light_sensor.luminance(BH1750.CONT_HIRES_1)

            # Validar que la lectura sea un número (no solo 'True')
            if isinstance(lux_sensor, (int, float)):
                lux = round(lux_sensor, 1)

                log(f"{Colors.WHITE}Lux: {Colors.RESET}{Colors.YELLOW}{lux}{Colors.RESET}")
            else:
                raise ValueError("Lectura invalida o nula del BH1750")

        except Exception as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR de lectura del sensor BH1750: {Colors.RED}{e}{Colors.RESET}")

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
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Publicación omitida: {Colors.RESET}{Colors.RED}Todos los sensores fallaron.{Colors.RESET}")
            continue

        # ---- Publicación Atómica de los datos ----#
        try:
            # Convertimos el diccionario a un string JSON
            json_string = ujson.dumps(data_payload)

            # Publicamos el paquete JSON (qos=0, no bloqueante)
            client.publish(MQTT_TOPIC_ENV_DATA, json_string.encode('utf-8'), retain=False, qos=0)

            log(f"\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Paquete de sensores publicado: {Colors.MAGENTA}{json_string}{Colors.RESET}")

        # Este bloque captura unicamente errores de RED/MQTT
        except (MQTTException, OSError) as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR durante la publicación MQTT: {Colors.RED}{e}{Colors.RESET}")

            # Invalidamos el cliente MQTT forzando una reconexión completa.
            force_disconnect_mqtt()

        except Exception as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR CRITICO en sensor_publish_task(): {Colors.RED}{e}{Colors.RESET}")

# ---- CORUTINA: Gestión del sensor de lluvia ----
async def rain_monitor_task():
    """
    #### Tarea dedicada (MÁQUINA DE ESTADOS)
    *  Monitorea el estado de la lluvia usando la salida analógica (A0).
    *  Utiliza umbrales con histéresis para detectar inicio y fin de un evento de lluvia.
    *  Calcula y publica la duración y la intensidad del evento.
    * La histéresis es un fenómeno en el que el estado de un sistema depende de su historia pasada, y no solo de las fuerzas que lo afectan en el momento presente.Se manifiesta como un retraso entre una causa y su efecto.
    """
    global client

    # Umbrales de estado (basados en mi calibración)
    RAIN_START_THRESHOLD = 2350
    RAIN_STOP_THRESHOLD = 2700

    # Rango de calibración para la intensidad percibida
    ADC_INTENSITY_MIN = 1700
    ADC_INTENSITY_MAX = 2700
    
    # ESTADOS
    current_rain_state = 'Dry'
    rain_start_time = 0
    total_intensity_reading = 0
    intensity_sample_count = 0

    # Función Auxiliar
    def map_adc_to_intensity(adc_value, min_val, max_val):

        clamped_value = max(min_val, min(adc_value, max_val))

        normalized_inverted = (max_val - clamped_value) / (max_val - min_val)

        return round(normalized_inverted * 100)

    while True:

        await asyncio.sleep(MQTT_CONFIG["RAIN_MONITOR_INTERVAL"])

        # ---- Lectura del sensor de lluvia ----
        try:
            rain_analog_value = rain_sensor_analog.read()
        except Exception as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR de lectura del sensor de Lluvia: {Colors.RED}{e}{Colors.RESET}")
            continue

        rain_intensity_percent = map_adc_to_intensity(
            rain_analog_value, 
            ADC_INTENSITY_MIN, 
            ADC_INTENSITY_MAX
        )

        # ---- Lógica de publicación y Máquina de Estados ----
        try:
            # EVENTO 1: Lluvia Detectada
            if rain_analog_value < RAIN_START_THRESHOLD and current_rain_state == 'Dry':
                current_rain_state = 'Raining'
                rain_start_time = time()
                total_intensity_reading, intensity_sample_count = 0, 0

                # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
                if client is None or not (wlan and wlan.isconnected()):
                    log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Publicación de{Colors.BLUE} LLUVIA {Colors.RESET}{Colors.WHITE}omitida:{Colors.RESET}{Colors.RED} Cliente/WiFi no disponible.{Colors.RESET}")
                    continue
                else:
                    # Si la publicacion se pierde, la lógica de 'Dry' lo corregirá.
                    client.publish(MQTT_TOPIC_RAIN_STATE, b"Raining", retain=True, qos=0)

                log(f"\n{Colors.GREEN}>  Message{Colors.RESET}")
                log(f"{Colors.WHITE}   Event: Rain Monitor{Colors.RESET}")
                log(f"{Colors.WHITE}   State: {Colors.RESET}{Colors.BLUE}{current_rain_state}{Colors.RESET}")
                log(f"{Colors.WHITE}   Value: {Colors.RESET}{Colors.BLUE}{rain_analog_value}{Colors.RESET}")

            # ESTADO INTERMEDIO: Está lloviendo
            elif current_rain_state == 'Raining':
                # Mientras llueve, acumulamos lecturas de intensidad
                total_intensity_reading += rain_intensity_percent
                intensity_sample_count += 1

                # EVENTO 2: Dejó de llover
                if rain_analog_value > RAIN_STOP_THRESHOLD:

                    duration_sec = round(time() - rain_start_time)
                    avg_intensity = round(total_intensity_reading / intensity_sample_count) if intensity_sample_count > 0 else 0

                    current_rain_state = 'Dry'
                    rain_start_time = 0

                    # Si el cliente no existe O el WiFi no está conectado, NO intentamos publicar.
                    if client is None or not (wlan and wlan.isconnected()):
                        log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Publicación de{Colors.BLUE} LLUVIA {Colors.RESET}{Colors.WHITE}omitida:{Colors.RESET}{Colors.RED} Cliente/WiFi no disponible.{Colors.RESET}")
                        continue
                    else:
                        # Publicamos el cambio de ESTADO
                        client.publish(MQTT_TOPIC_RAIN_STATE, b"Dry", retain=True, qos=0)

                        # Creamos el paquete JSON
                        rain_event_payload = {
                            "duration_seconds": duration_sec,
                            "average_intensity_percent": avg_intensity
                        }
                        
                        # Convertimos el diccionario a un string JSON
                        json_string = ujson.dumps(rain_event_payload)

                        # publicamos el paquete JSON
                        client.publish(MQTT_TOPIC_RAIN_EVENT, json_string.encode('utf-8'), retain=False, qos=0)

                    log(f"\n{Colors.GREEN}>  Message{Colors.RESET}")
                    log(f"{Colors.WHITE}   Event: Rain Monitor{Colors.RESET}")
                    log(f"{Colors.WHITE}   State: {Colors.RESET}{Colors.YELLOW}{current_rain_state}{Colors.RESET}")
                    log(f"{Colors.WHITE}   Event JSON: {Colors.MAGENTA}{json_string}{Colors.RESET}")

        except (MQTTException, OSError) as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR durante el monitoreo de lluvia: {Colors.RED}{e}{Colors.RESET}")

            # Invalidamos el cliente MQTT forzando una reconexión completa.
            force_disconnect_mqtt()

        except Exception as e:
            log(f"\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR CRITICO en rain_monitor_task() : {Colors.RED}{e}{Colors.RESET}")

# ---- CORUTINA: Latido del Sistema (Heartbeat) ----
async def heartbeat_task():
    """
    #### Latido del Sistema (Heartbeat)
    Publica periódicamente el estado `online` para confirmar conectividad.
    """
    global client
    HEARTBEAT_INTERVAL = 300 # 5 minutos

    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL)

        if client and wlan and wlan.isconnected():
            try:
                # Reafirmamos que estamos vivos
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)

                log(f"\n{Colors.WHITE}>  {Colors.RESET}{Colors.MAGENTA}Heartbeat{Colors.RESET}{Colors.WHITE} Enviado{Colors.RESET}")
            except Exception as e:
                log(f"\n{Colors.WHITE}>  {Colors.RESET}{Colors.MAGENTA}Heartbeat{Colors.RESET}{Colors.WHITE} omitido: Cliente/WiFi no disponible {Colors.RESET}{Colors.RED}<{e}>{Colors.RESET}")

# ---- CORUTINA: Programa Principal ----
async def main():

    # ---- Actualización de Credenciales ----
    try:
        import update_creds #type: ignore
        update_creds.apply_update()
        import os
        # Borramos el archivo del ESP32 para limpieza
        os.remove('update_creds.py')
        log(f"{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Actualizacion de Credenciales Exitosa{Colors.RESET}")
        reset() # Reiniciamos para conectar con la nueva red
    except ImportError:
        pass # No hay actualización de credenciales pendiente

    # ---- Identificación unica del ESP32 ----
    # Obtenemos la MAC del dispositivo
    mac_address = ubinascii.hexlify(network.WLAN(network.STA_IF).config('mac')).decode()
    # Construye el client_id único
    client_id = f"ESP32-Environmental-Monitor-{mac_address}"

    # ---- (Re)conexión WiFi (Prioridad de red) ----
    asyncio.create_task(wifi_coro())

    while wlan is None or not wlan.isconnected():
        await asyncio.sleep(1)

    # Cedemos el control un momento más 
    # Esto permite que wifi_coro ejecute su print("Conexión Establecida")
    # antes de que la OTA bloquee la CPU.
    await asyncio.sleep(1)

    # ---- OTA Updater ----
    try:
        ota = OTAUpdater(OTA_CONFIG['URL'], log_func=log)
        ota.check_for_updates()
    except Exception as e:
        log(f"{Colors.RED}>  {Colors.RESET}{Colors.WHITE}ERROR CRÍTICO EN ota.check_for_updates(): {Colors.RESET}{Colors.RED}{e}{Colors.RESET}")

    # ---- Tareas Asíncronas ----
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
        gc.collect() 

        # El event loop cede control a todas las tareas asíncronas.
        await asyncio.sleep(30)

# ---- Punto de Entrada ----
try:
    asyncio.run(main())
except KeyboardInterrupt:
    log(f"\n\n{Colors.GREEN}>  {Colors.RESET}{Colors.WHITE}Programa {Colors.RESET}{Colors.GREEN}Detenido{Colors.RESET}")
except Exception as e:
        log(f"\n\n{Colors.RED}>  {Colors.RESET}{Colors.WHITE}Error fatal no capturado: {Colors.RESET}{Colors.RED}{e}{Colors.RESET}\n\n")
finally:
    # Desconexión limpia 
    shutdown()

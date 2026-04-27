# -----------------------------------------------------------------------------
# Sensors: Environmental Monitoring Firmware.
# Descripción: Firmware dedicado al Monitoreo de las condiciones ambientales del Invernadero.
# Versión: v0.7.5 - Sincronización de Arquitectura y Estabilidad de Red
# Fecha: 27-03-2026
# ------------------------------- Configuración -------------------------------

# [SOLUCIÓN IMPORT]: Modificamos sys.path para priorizar las librerías en /lib. 
# Esto es necesario para que al importar la librería umqtt.simple2 se sobreescriba 
# sobre la librería umqtt.simple que viene integrada en el firmware de MicroPython.
import sys
sys.path.reverse()

import uasyncio as asyncio # type: ignore
from micropython import const

# ---- Debug mode ----
# Desactivar en Producción. Desactiva logs de desarrollo.
DEBUG = True

# ---- Colors for logs ----
class Colors:
    RESET   = const('\x1b[0m')
    DIM     = const('\x1b[90m')
    RED     = const('\x1b[91m')
    GREEN   = const('\x1b[92m')
    YELLOW  = const('\x1b[93m')
    BLUE    = const('\x1b[94m')
    MAGENTA = const('\x1b[95m')
    CYAN    = const('\x1b[96m')
    WHITE   = const('\x1b[97m')

# ---- Función Auxiliar: Logs de Desarrollo ----
def log(*args, **kwargs):
    """**Imprime solo si el modo DEBUG está activado.**"""
    if DEBUG:
        print(*args, **kwargs)

# ---- Utilidades de Auditoría y Batching ----
class RingBuffer:
    """Almacena un historial fijo de lecturas para envío por lotes."""
    def __init__(self, size):
        self.size = size
        self.buffer = [None] * size
        self.index = 0

    def append(self, item):
        from utime import localtime # type: ignore
        h, m = localtime()[3:5]
        timestamp = f"{h:02d}:{m:02d}"
        self.buffer[self.index] = {"t": timestamp, "v": item}
        self.index = (self.index + 1) % self.size

    def get_all(self):
        """Retorna todos los elementos en orden cronológico."""
        res = []
        for i in range(self.size):
            idx = (self.index + i) % self.size
            if self.buffer[idx] is not None:
                res.append(self.buffer[idx])
        return res

    def clear(self):
        """Limpia el buffer tras un envío exitoso."""
        self.buffer = [None] * self.size
        self.index = 0

# Configuración de Lotes
BATCH_SIZE = const(10)     # Número de lecturas antes de encender la radio
audit_env = RingBuffer(BATCH_SIZE)
samples_count = 0   # Contador de muestras en RAM

# ---- Configuración MQTT (Aplanada con Constantes) ----
# El broker esperará ~1.5x este valor antes de desconectar al cliente.
MQTT_KEEPALIVE        = const(60) # ~1.5x = 90 seg
# Intervalo para enviar pings de 'keepalive' al broker MQTT.
MQTT_PING_INTERVAL    = const(30) # keepalive//2
# Intervalo para revisar mensajes MQTT entrantes.
MQTT_CHECK_INTERVAL   = const(10) # seg
# Intervalo de la tarea que publica la telemetría/lecturas
MQTT_PUBLISH_INTERVAL = const(30) # 30 seg
# tiempo máximo que (connect, check_msg, ping) esperará antes de fallar y lanzar una excepción.
MQTT_SOCKET_TIMEOUT   = const(15) # seg
# tiempo máximo que el cliente esperará para que se complete un intercambio completo de mensajes MQTT(QoS) 1
# [WDT Safety]: Debe ser MENOR que el Watchdog de Hardware (65s)
MQTT_MESSAGE_TIMEOUT  = const(30) # seg

# ---- Configuración Resiliencia / Watchdog ----
# Tiempo máximo sin conexión WiFi antes de forzar un Hard Reset (5 minutos)
MAX_OFFLINE_RESET_SEC = const(300)
# Tiempo del Watchdog Timer (Hardware) en milisegundos (65 segundos (1m 5s))
WDT_TIMEOUT_MS = const(65000) 

# ---- Tópicos MQTT ----
BASE_TOPIC = b"PristinoPlant/Environmental_Monitoring/Zona_A"

# Tópico de estado de este dispositivo
MQTT_TOPIC_STATUS = const(BASE_TOPIC + b"/status")
# Tópico para el paquete de datos ambientales (JSON)
MQTT_TOPIC_ENV_DATA = const(BASE_TOPIC + b"/readings")
# Tópico para recibir comandos en Texto plano. (Reiniciar dispositivo)
MQTT_TOPIC_CMD = const(BASE_TOPIC + b"/cmd")

# ---- Parámetros LWT (Last Will and Testament) ----
LWT_TOPIC = MQTT_TOPIC_STATUS
LWT_MESSAGE = const(b"offline")

# ---- Hardware Global ----
# Sensor de Temp/Humedad
dht_sensor = None
# Sensor de Iluminancia I2C
illuminance_sensor = None

# ---- Variables Globales de Estado ----
wlan    = None # Conexión WiFi
client  = None # Cliente  MQTT
CONNECTED_ALLOWED = False # Control de ahorro de energía (True = Radio encendida)

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
    from secrets import WIFI_SSID, WIFI_PASS, MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS
except ImportError:
    log(f"\n\n❌  Error: {Colors.RED}No se encontró{Colors.RESET} lib/secrets")
    # Evitamos que el código crashee, aunque no conectará
    WIFI_SSID, WIFI_PASS = "", ""
    MQTT_SERVER, MQTT_USER, MQTT_PASS, MQTT_PORT, MQTT_SSL, MQTT_SSL_PARAMS = "", "", "", 1883, False, {}

# ---- Excepciones Personalizadas ----
class MQTTSessionZombie(OSError):
    """Excepción para identificar sesiones MQTT que han dejado de responder."""
    pass

# ---- Función Auxiliar: Interpretación de Errores MQTT (Humanizados) ----
def log_mqtt_exception(context, e):
    """ Interpreta y loguea excepciones MQTT o de Red de forma humana. """
    if not DEBUG: return

    if type(e).__name__ == 'MQTTException':
        code = e.args[0] if e.args else -1
        
        # Mapeo Local Humanizado
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
        log(f"\n❌  {context}: {Colors.RED}[MQTT-{code}] {msg}{Colors.RESET}\n")
        del error_map
    
    elif isinstance(e, OSError):
        err_msg = str(e)
        code = e.args[0] if e.args else 0
        
        if isinstance(e, MQTTSessionZombie):
            prefix = "Zombie"
        else:
            prefix = f"Red-{code}"

        if code == 110:   err_msg = "ETIMEDOUT (Internet demasiado lento o desconectado en silencio)"
        elif code == 113: err_msg = "EHOSTUNREACH (No hay ruta hacia el servidor, posible falla de internet)"
        elif code == 104: err_msg = "ECONNRESET (El router o el proveedor de internet cerró la sesión inactiva)"
        elif code == 16:  err_msg = "EBUSY (Chip WiFi ocupado limpiando la conexión anterior)"
        elif code == 12:  err_msg = "ENOMEM (Memoria RAM insuficiente para esta operación)"
        elif code == -202: err_msg = "SSL Failed (Fallo al negociar la conexión segura, red inestable)"
        elif code == -17040: err_msg = "SSL RAM Error (Falta memoria RAM para procesar el certificado)"
        elif code == -29312: err_msg = "SSL EOF (El servidor cerró la conexión prematuramente)"
        
        log(f"\n❌  {context}: {Colors.RED}[{prefix}] {err_msg}{Colors.RESET}\n")
    
    else:
        log(f"\n❌  {context}: {Colors.RED}{type(e).__name__}: {e}{Colors.RESET}\n")


# ---- Función Auxiliar: Inicializar Hardware con Validación Agresiva ----
def setup_sensors():
    """Inicializa los sensores cableados al nodo de monitoreo de forma segura."""
    global dht_sensor, illuminance_sensor

    try:
        from bh1750  import BH1750 # type: ignore
        from dht     import DHT22  # type: ignore
        from machine import Pin    # type: ignore
        from utime   import sleep_ms # type: ignore
    except ImportError as e:
        log(f"❌  Error al importar librerías: {Colors.RED}{e}{Colors.RESET}")
        return

    log(f"\n🔍  {Colors.BLUE}Verificando Hardware de Sensores{Colors.RESET}")

    # 1. Sensor de Temp/Humedad (DHT22)
    # [Validación Estricta]: Hacemos una lectura de prueba real para descartar pines flotantes.
    try:
        dht_test = DHT22(Pin(4))
        # El DHT22 requiere ~2 segundos para estabilizarse en el encendido inicial
        sleep_ms(2000)
        dht_test.measure() # Forzamos la lectura
        temp = dht_test.temperature()
        hum = dht_test.humidity()
        
        log(f"    ├─ Sensor DHT22: {Colors.GREEN}Conectado{Colors.RESET} ({temp}°C, {hum}%)")
        dht_sensor = dht_test
    except Exception as e:
        log(f"    ├─ ❌ Sensor DHT22: {Colors.RED}Desconectado/Fallo{Colors.RESET} ({e})")
        dht_sensor = None

    # 2. Sensor de Luz I2C (BH1750)
    # [Configuración de Robustez]: Utilizamos SoftI2C a 10kHz por longitud de cables.
    try:
        from machine import SoftI2C # type: ignore
        i2c_bus = SoftI2C(scl=Pin(22), sda=Pin(21), freq=10000, timeout=100000)
        
        devices = i2c_bus.scan()
        dev_count = len(devices)
        
        if dev_count > 1:
            log(f"    └─ ❌ Bus I2C: {Colors.RED}Sucio/Ruidoso{Colors.RESET} ({dev_count} detectados)")
            illuminance_sensor = None
        elif dev_count == 0:
            log(f"    └─ ❌ Sensor BH1750: {Colors.RED}No detectado{Colors.RESET} (Bus Vacío)")
            illuminance_sensor = None
        elif 0x23 in devices:
            try:
                # [Test de ACK Real]: Verificamos que el chip realmente responda
                i2c_bus.writeto(0x23, b'\x00') 
                
                lux_test = BH1750(bus=i2c_bus, addr=0x23)
                _ = lux_test.luminance(BH1750.CONT_HIRES_1)
                log(f"    └─ Sensor BH1750: {Colors.GREEN}Conectado{Colors.RESET}")
                illuminance_sensor = lux_test
            except Exception as e:
                log(f"    └─ ❌ Sensor BH1750: {Colors.RED}Fallo Crítico{Colors.RESET} (No ACK: {e})")
                illuminance_sensor = None
        else:
            log(f"    └─ ❌ Sensor BH1750: {Colors.RED}No detectado en 0x23{Colors.RESET}")
            illuminance_sensor = None

    except Exception as e:
        log(f"    └─ ❌ BH1750 Interior: {Colors.RED}{e}{Colors.RESET}")
        illuminance_sensor = None

# ---- Función Auxiliar: Callback de estado ----
def sub_status_callback(pid, status):
    """Callback que informa el estado de entrega de los mensajes QoS 1."""
    from umqtt import errno as umqtt_errno # type: ignore
    
    if not DEBUG: return

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
    from ujson import dumps, loads #type: ignore
    from gc    import collect

    try:
        collect()

        topic_str = topic.decode('utf-8')
        msg_str = msg.decode('utf-8')

        try:
            parsed_json = loads(msg_str)
            clean_payload = dumps(parsed_json)
            type_label = "JSON"
        except:
            clean_payload = msg_str.strip()
            type_label = "TEXT"

        header = f"\n📡  {Colors.BLUE}Recibido{Colors.RESET}"
        if retained: header += f" {Colors.YELLOW}[Retained]{Colors.RESET}"
        if dup:      header += f" {Colors.MAGENTA}[Duplicate]{Colors.RESET}"

        log(header)
        log(f"    ├─ Tópico: {Colors.GREEN}{topic_str}{Colors.RESET}")
        log(f"    ├─ {type_label}:   {Colors.BLUE}{clean_payload}{Colors.RESET}")

        # ---- 🛡️ Lógica para los Comandos del Sistema (/cmd) ----
        if topic == MQTT_TOPIC_CMD:
            if msg_str.lower() == "reset":
                log(f"    └─ Acción: {Colors.CYAN}Reboot the Device{Colors.RESET}")
                
                try:
                    if client and wlan and wlan.isconnected():
                        client.publish(MQTT_TOPIC_STATUS, b"rebooting", retain=True, qos=1)
                except: pass

                log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}")

                from machine import reset #type: ignore
                from utime   import sleep #type: ignore
                sleep(5)
                reset()

    except Exception as e:
        log(f"\n❌  Error en sub_callback(): {Colors.RED}{e}{Colors.RESET}")

# ---- Función Auxiliar: Desconecta/Invalida Cliente MQTT ----
def force_disconnect_mqtt():
    """**Cierra forzosamente el socket MQTT e invalida el cliente.**"""
    global client
    from gc import collect

    try:
        if client and hasattr(client, 'sock') and client.sock:
            if wlan and wlan.isconnected():
                try: client.disconnect()
                except OSError: pass
            
            try: client.sock.close()
            except OSError: pass
    except Exception:
        pass
    finally:
        client = None
        collect() # Limpieza forzada de RAM (MbedTLS)
        log(f"📡  Cliente  {Colors.GREEN}Desconectado{Colors.RESET}")

# ---- Función Auxiliar: Gestión de desconexión (Graceful Shutdown) ----
def shutdown():
    """Apagado Controlado (Sensores)"""
    if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
        try:
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
        except: pass

    force_disconnect_mqtt()

    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            log(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except Exception:
            pass

# ---- CORUTINA: Gestión de Conexión WiFi ----
async def wifi_coro():
    """**Gestiona la (re)conexión asíncrona del WiFi**"""
    global wlan
    from network import STA_IF, WLAN # type: ignore
    from utime   import time         #type: ignore

    wlan = WLAN(STA_IF)
    wlan.active(True)

    connected_once = False
    wifi_disconnect_start = None 

    while True:
        # Control de ahorro de energía
        if not CONNECTED_ALLOWED:
            if wlan.active():
                try:
                    wlan.disconnect()
                    wlan.active(False)
                    log(f"📡  Radio WiFi {Colors.YELLOW}Apagada (Ahorro Batería){Colors.RESET}")
                except: pass
            await asyncio.sleep(5)
            continue
            
        if not wlan.isconnected():

            if connected_once:
                log(f"📡  WiFi {Colors.RED}Desconectado{Colors.RESET}\n")

            if wifi_disconnect_start is None:
                wifi_disconnect_start = time()

            if (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                 from machine import reset
                 log(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}\n\n")
                 log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
                 await asyncio.sleep(1)
                 reset()

            try:
                wlan.disconnect()
                wlan.active(False)
                await asyncio.sleep(1)
                wlan.active(True)
                
                log(f"\n\n📡  Conectándose a {Colors.BLUE}{WIFI_SSID}{Colors.RESET}", end="")
                wlan.connect(WIFI_SSID, WIFI_PASS)

                while not wlan.isconnected():
                    if wifi_disconnect_start and (time() - wifi_disconnect_start > MAX_OFFLINE_RESET_SEC):
                        from machine import reset
                        log(f"\n💀  {Colors.RED}DEATH: El WiFi no se recuperó.{Colors.RESET}\n\n")
                        await asyncio.sleep(1)
                        reset()

                    log(f"{Colors.BLUE}.{Colors.RESET}", end="")
                    await asyncio.sleep(1)
                
                log(f"\n📡  Conexión WiFi Establecida {Colors.GREEN}| IP: {wlan.ifconfig()[0]}{Colors.RESET}")

                try:
                    cloudflare_dns = "1.1.1.1"
                    ip, subnet, gateway, dns = wlan.ifconfig()
                    wlan.ifconfig((ip, subnet, gateway, cloudflare_dns))
                    if DEBUG: log(f"\n🌍  DNS: {Colors.CYAN}{cloudflare_dns}{Colors.RESET}")
                except Exception as e:
                    if DEBUG: log(f"⚠️  Error forzando DNS en Main: {e}")

                wifi_disconnect_start = None
                force_disconnect_mqtt()
                connected_once = True

            except Exception as e:
                log(f"\n❌  No se pudo conectar WiFi: {Colors.RED}{e}{Colors.RESET}")
                await asyncio.sleep(5)
        else:
            wifi_disconnect_start = None
            await asyncio.sleep(20)

# ---- Función Auxiliar: Callback Timeout Conexión ----
def _connection_timeout_handler(t):
    """Callback del Timer de Hardware: Reinicia si la conexión se cuelga."""
    from machine import reset # type: ignore
    from utime   import sleep # type: ignore

    if DEBUG:
        log(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Timeout en conexión MQTT {Colors.RED}(Socket Bloqueado){Colors.RESET}")
        log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo{Colors.RESET}\n\n")
        sleep(1)
    reset()

# ---- CORUTINA: Manejo centralizado de Errores Críticos MQTT ----
async def check_critical_mqtt_errors(e):
    """Evalúa si la excepción es crítica y requiere un reinicio por HW/SW."""
    from umqtt.simple2 import MQTTException # type: ignore
    
    if isinstance(e, OSError) and e.args and e.args[0] in [-17040, -202, 12]:
        if DEBUG:
            log(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Fallo crítico de SSL/Red/RAM ({e.args[0]}).")
            log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo.{Colors.RESET}\n")
        import machine
        machine.reset()

    if isinstance(e, MQTTException) and e.args and e.args[0] == 3:
         if DEBUG:
             log(f"\n💀  {Colors.RED}DEATH:{Colors.RESET} Buffer de escritura lleno (Fragmentación RAM).")
             log(f"\n🔄  {Colors.BLUE}Reiniciando Dispositivo...{Colors.RESET}\n")
         import machine
         machine.reset()

# ---- CORUTINA: Gestión de Conexión MQTT (Sensors) ----
async def mqtt_connector_task(client_id):
    """Gestiona la (re)conexión y operación MQTT con verificación activa."""
    global client

    from gc      import collect
    from machine import Timer
    from umqtt.simple2 import MQTTClient, MQTTException # type: ignore
    from utime   import ticks_ms, ticks_diff, time #type: ignore

    # =========================================================================
    # 🩹 MONKEY-PATCHING: Optimizaciones inyectadas a la librería MQTT
    # =========================================================================

    # 🩹 Parche 1: Escritura Robusta
    def _robust_write(self, bytes_wr, length=-1):
        from utime import sleep_ms
        data = bytes_wr if length == -1 else bytes_wr[:length]
        total_written = 0
        while total_written < len(data):
            self._sock_timeout(self.poller_w, self.socket_timeout)
            try:
                written = self.sock.write(data[total_written:])
            except AttributeError: raise MQTTException(8)
            except OSError: raise MQTTException(3)
            
            if written is None:
                sleep_ms(15)
                continue
            if written == 0: raise MQTTException(3)
            total_written += written
        return total_written

    # 🩹 Parche 2: Lectura Resiliente
    def _resilient_read(self, expected_length):
        if expected_length < 0: raise MQTTException(2)
        buffer = b''
        while len(buffer) < expected_length:
            try:
                bytes_to_read = expected_length - len(buffer)
                chunk = self.sock.read(bytes_to_read)
            except OSError as error:
                err_code = error.args[0] if error.args else 0
                if err_code in (11, 110, 116, -116): chunk = None
                else: raise MQTTException(2) 
            except AttributeError: raise MQTTException(8)
            
            if chunk is None:
                self._sock_timeout(self.poller_r, self.socket_timeout)
                continue
            if chunk == b'': raise MQTTException(1)
            else: buffer += chunk
        return buffer

    # 🩹 Parche 3: Limpieza Segura de RAM en Timeouts
    def _ram_safe_message_timeout(self):
        current_time = ticks_ms()
        expired_pids = []
        for pid in self.rcv_pids:
            expected_timeout = self.rcv_pids[pid]
            if ticks_diff(expected_timeout, current_time) <= 0:
                expired_pids.append(pid)
        for pid in expired_pids:
            self.rcv_pids.pop(pid)
            self.cbstat(pid, 0)

    MQTTClient._write = _robust_write
    MQTTClient._read = _resilient_read
    MQTTClient._message_timeout = _ram_safe_message_timeout
    # =========================================================================

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
                from machine import reset
                log(f"\n💀  {Colors.RED}DEATH: El MQTT no conectó en {MAX_OFFLINE_RESET_SEC//60} minutos.{Colors.RESET}")
                await asyncio.sleep(1)
                reset()

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
                log_disk_usage()
                log_ram_usage()
                
                log(f"\n📡  Conectando {Colors.BLUE}Broker MQTT{Colors.RESET}")

                try:
                    # clean_session=False para recibir cmds mientras dormía
                    client.connect(clean_session=False)
                finally:
                    wd_timer.deinit()

                mqtt_disconnect_start = None
                log(f"📡  Conexión MQTT {Colors.GREEN}Establecida{Colors.RESET}", end="\n")
                client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=1)
                client.subscribe(MQTT_TOPIC_CMD, qos=1)

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Fallo la Conexión MQTT", e)
                await check_critical_mqtt_errors(e)
                force_disconnect_mqtt()
                await asyncio.sleep(10)
                continue

        # Gestión de Conexión Activa
        if client:
            try:
                async with mqtt_lock:
                    client.check_msg()

                now_ms = ticks_ms()

                # Ping Manual (Crítico para NAT)
                if ticks_diff(now_ms, last_manual_ping) > (MQTT_PING_INTERVAL * 1000):
                    async with mqtt_lock:
                        client.ping()
                    log(f"📡  MQTT: {Colors.CYAN}Ping de vida enviado{Colors.RESET}")
                    last_manual_ping = now_ms

                # Control Zombie (Margen 1.5x)
                elif ticks_diff(now_ms, client.last_cpacket) > (MQTT_KEEPALIVE * 1500):
                    raise MQTTSessionZombie("Inactividad del broker MQTT excedida")

            except (MQTTException, OSError) as e:
                log_mqtt_exception("Error en Operación MQTT", e)
                await check_critical_mqtt_errors(e)
                force_disconnect_mqtt()
                last_manual_ping = ticks_ms()
                await asyncio.sleep(10)
                continue

        await asyncio.sleep(MQTT_CHECK_INTERVAL)

# ---- CORUTINA: Gestión de la publicacion de sensores ----
async def sensor_publish_task():
    """
    * **Lee todos los sensores** de forma aislada.
    * **Acumula los datos en un RingBuffer** (Batching).
    * **Enciende la radio cada BATCH_SIZE muestras** para publicar.
    """
    global samples_count, CONNECTED_ALLOWED

    from bh1750 import BH1750 #type: ignore
    from ujson  import dumps  #type: ignore
    from utime  import localtime

    while True:
        # ---- Lectura de Sensores (Sin WiFi) ----
        temp, hum, lux = None, None, None
        try:
            dht_sensor.measure()
            temp = round(dht_sensor.temperature(), 1)
            hum = round(dht_sensor.humidity(), 1)
        except: pass

        try:
            lux_sensor = illuminance_sensor.luminance(BH1750.CONT_HIRES_1)
            lux = round(lux_sensor, 1)
        except: pass

        data_payload = {"t": temp, "h": hum, "l": lux}
        audit_env.append(data_payload)
        samples_count += 1
        
        if DEBUG:
            log(f"📝 Lectura {samples_count}/{BATCH_SIZE} guardada en RAM.")

        # ---- ¿Es hora de publicar? ----
        if samples_count >= BATCH_SIZE:
            log(f"🚀 Lote completo ({BATCH_SIZE}). {Colors.CYAN}Activando Radio...{Colors.RESET}")
            CONNECTED_ALLOWED = True
            
            # Esperamos a que WiFi y MQTT estén listos (máximo 60 seg)
            ready = False
            for _ in range(60):
                if client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
                    ready = True
                    break
                await asyncio.sleep(1)
            
            if ready:
                try:
                    async with mqtt_lock:
                        batch_data = audit_env.get_all()
                        payload = dumps({
                            "batch_id": localtime()[5],
                            "data": batch_data
                        })
                        client.publish(MQTT_TOPIC_ENV_DATA, payload.encode('utf-8'), qos=1)
                        log(f"✅  Lote enviado exitosamente.")
                        
                        audit_env.clear()
                        samples_count = 0
                except Exception as e:
                    log(f"❌ Error enviando lote: {e}")
            else:
                log(f"⚠️  No se pudo conectar para enviar el lote. Reintentaremos luego.")
            
            # Apagamos radio tras el intento para ahorrar batería
            CONNECTED_ALLOWED = False
            shutdown() 

        await asyncio.sleep(MQTT_PUBLISH_INTERVAL)

# ---- CORUTINA: Latido del Sistema (Heartbeat) ----
async def heartbeat_task():
    """Publica cada `PUBLISH_INTERVAL` el estado `online` para confirmar conectividad."""
    from umqtt.simple2 import MQTTException # type: ignore

    while True:
        # [v0.7.5]: Solo reportamos latido si la radio está activa
        if CONNECTED_ALLOWED and client and getattr(client, 'sock', None) and wlan and wlan.isconnected():
            try:
                async with mqtt_lock:
                    client.publish(MQTT_TOPIC_STATUS, b"online", retain=True, qos=0)
            except (MQTTException, OSError) as e:
                log_mqtt_exception("Publicación del Heartbeat omitida", e)

        await asyncio.sleep(MQTT_PUBLISH_INTERVAL)

# ---- CORUTINA: Programa Principal ----
async def main():
    from gc        import collect
    from machine   import WDT
    from network   import STA_IF, WLAN # type: ignore
    from ubinascii import hexlify      # type: ignore

    # ---- Identificación unica del ESP32 ----
    mac_address = hexlify(WLAN(STA_IF).config('mac')).decode()
    client_id = f"ESP32-Environmental-Monitor-ZONA_A-{mac_address}"

    # ---- Inicialización del Hardware ----
    setup_sensors()

    # ---- Tareas Asíncronas ----
    asyncio.create_task(wifi_coro())
    asyncio.create_task(mqtt_connector_task(client_id))
    asyncio.create_task(sensor_publish_task())
    asyncio.create_task(heartbeat_task())
    
    # ---- Watchdog Timer ----
    try:
        wdt = WDT(timeout=WDT_TIMEOUT_MS)
        log(f"🐕  Watchdog Activado: {Colors.MAGENTA}{WDT_TIMEOUT_MS//1000} segundos{Colors.RESET}")
    except Exception as e:
        log(f"⚠️  No se pudo iniciar el Watchdog: {e}")
        wdt = None

    while True:
        if wdt: wdt.feed()
        collect()
        await asyncio.sleep(13)

# ---- Función Auxiliar: Parada del Programa ----
def stopped_program():
    """
    #### Parada Local de Emergencia (Sensores)
    * Publica 'offline' para evitar latencias de LWT.
    * Invalida el cliente MQTT.
    """
    if DEBUG:
        print(f"\n\n📡  Programa {Colors.GREEN}Detenido{Colors.RESET}")

    # Publicamos 'offline' explícitamente antes de la desconexión limpia.
    if client and hasattr(client, 'sock') and client.sock and wlan and wlan.isconnected():
        try:
            client.publish(MQTT_TOPIC_STATUS, b"offline", retain=True, qos=1)
            from utime import sleep_ms
            sleep_ms(300)
        except:
            pass

    force_disconnect_mqtt()

    if wlan and wlan.isconnected():
        try:
            wlan.disconnect()
            log(f"📡  WiFi     {Colors.GREEN}Desconectado{Colors.RESET}\n")
        except:
            pass

# ---- Función Auxiliar: Safe Reset ----
def safe_reset():
    from machine import reset # type: ignore
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
        try: shutdown()
        except: pass
        safe_reset()
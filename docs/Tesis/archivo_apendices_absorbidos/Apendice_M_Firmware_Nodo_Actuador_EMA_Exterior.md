# **Apéndice M. Firmware del Nodo Actuador y Estación Exterior**

El presente apéndice documenta la arquitectura de software embebido, el conexionado físico y las rutinas de control implementadas en el Nodo Actuador y Estación Meteorológica Exterior de la plataforma PristinoPlant. Desarrollado en MicroPython sobre un microcontrolador ESP32 de doble núcleo, este firmware coordina en tiempo real la conmutación de potencia del circuito hidráulico, la adquisición climática en intemperie y la ejecución de mecanismos autónomos de resiliencia física y lógica.

---

### 1. Arquitectura Asíncrona y Gestión de Memoria en MicroPython

El firmware se diseñó bajo el paradigma de programación asíncrona mediante la biblioteca `uasyncio`, estableciendo un bucle de eventos cooperativo no bloqueante. Esta arquitectura permite que el microcontrolador ejecute concurrentemente la escucha de comandos en el bróker MQTTS, el procesamiento de temporizadores de riego, la lectura periódica de transductores ambientales y el envío de tramas de mantenimiento de enlace (*keepalive*), erradicando las pausas ciegas (`time.sleep`) que degradaban la capacidad de respuesta en versiones tempranas del prototipo.

###### Tabla Ap-M1.  *Parámetros de temporización y resiliencia en el firmware del Nodo Actuador.*
| Parámetro | Valor Constante | Propósito y Justificación Operativa |
| :--- | :--- | :--- |
| `MQTT_KEEPALIVE` | 90 s | Ventana máxima tolerada por el bróker antes de considerar desconectado al nodo. |
| `MQTT_PING_INTERVAL` | 29 s | Frecuencia de envío de pings para garantizar 4 transacciones por cada intervalo de guarda. |
| `MQTT_SOCKET_TIMEOUT` | 45 s | Límite de espera en socket SSL para fallar rápidamente e iniciar reconexión limpia. |
| `WDT_TIMEOUT_MS` | 125.000 ms (125 s) | Watchdog de hardware para forzar reinicio del ESP32 ante bloqueos de firmware. |
| `MAX_OFFLINE_RESET_SEC` | 600 s (10 min) | Tiempo máximo en desconexión antes de gatillar un reinicio por hardware del sistema. |
| `MAX_BUFFER_SIZE` | 15 mensajes | Búfer circular para el patrón productor-consumidor que previene fallos por falta de memoria. |
| `BATCH_SIZE` | 10 muestras (10 min) | Tamaño del lote telemétrico alineado a las ventanas horarias del reloj RTC. |

*Nota.* Fuente: Constantes de configuración de `firmware/relay_modules/main.py`. Elaboración propia.

Dadas las restricciones de memoria dinámica (RAM) en el microcontrolador ESP32, se aplicaron técnicas avanzadas de optimización: todas las constantes numéricas se declararon mediante la directiva `const()` del compilador de MicroPython; los tópicos de mensajería se estructuraron como literales de bytes en memoria flash (`b""`) para evitar concatenaciones de cadenas en tiempo de ejecución; y el código fuente se precompiló en bytecode optimizado (`app.mpy`) utilizando la herramienta `mpy-cross`, minimizando la fragmentación del heap de memoria.

---

### 2. Mapeo Físico de Hardware y Topología del Circuito Hidráulico

El nodo gobierna ocho canales de conmutación electromecánica articulados con la instrumentación climática exterior. La asignación de pines y responsabilidades sobre el tablero eléctrico se detalla a continuación:

###### Tabla Ap-M2.  *Mapeo de pines GPIO, actuadores y sensores en el Nodo Actuador.*
| Canal / Dispositivo | Pin GPIO | Estado Inicial | Función en el Sistema |
| :--- | :--- | :--- | :--- |
| Relé 1 (`main_water`) | GPIO 13 | Apagado (`LOW`) | Electroválvula fuente de agua directa de red pública. |
| Relé 2 (`agrochemical`) | GPIO 12 | Apagado (`LOW`) | Electroválvula fuente del tanque auxiliar de agroquímicos. |
| Relé 3 (`pump`) | GPIO 14 | Apagado (`LOW`) | Bobina del contactor de 30A que energiza la bomba de 1 HP. |
| Relé 4 (`fogger`) | GPIO 26 | Apagado (`LOW`) | Electroválvula de línea de micro-nebulización ambiental. |
| Relé 5 (`fertigation`) | GPIO 25 | Apagado (`LOW`) | Electroválvula de línea de dosificación y fertirrigación. |
| Relé 6 (`sprinkler`) | GPIO 33 | Apagado (`LOW`) | Electroválvula de línea de aspersores de follaje y raíces. |
| Relé 7 (`soil_wet`) | GPIO 32 | Apagado (`LOW`) | Electroválvula de línea de humectación sobre el suelo. |
| Relé 8 (`sensor_power`)| GPIO 27 | Encendido (`HIGH`) | Alimentación conmutada de 5V para el bus de sensores ambientales. |
| Sensor DHT22 | GPIO 23 | Entrada con Pull-Up | Lectura de temperatura y humedad relativa en intemperie. |
| Sensor BH1750 | GPIO 22/21 | Bus I2C (400 kHz) | SCL (GPIO 22) y SDA (GPIO 21) para medición de iluminancia. |
| Sensor de Gotas | GPIO 35 | Entrada Analógica | Canal ADC para detección de lluvia y caracterización de ráfaga. |

*Nota.* Fuente: Mapeo de hardware en `firmware/relay_modules/main.py`. Elaboración propia.

Para salvaguardar la integridad de las tuberías de polietileno y PVC del circuito hidráulico, el firmware incorpora una rutina de cebado previa (`PUMP_PRIME_DELAY = const(10)` segundos). Cuando se recibe una orden de riego, el microcontrolador abre secuencialmente la válvula fuente y la válvula de distribución correspondiente; únicamente tras transcurrir diez segundos de flujo gravitacional estabilizado, se comanda el cierre del contactor industrial para arrancar la bomba de 1 HP, erradicando los golpes de ariete y las sobrepresiones que dañaban el sistema en fases previas.

---

### 3. Mecanismos de Resiliencia, Watchdog y Ciclo de Potencia de Sensores

El entorno operacional del orquideario somete al hardware a interferencias electromagnéticas por la conmutación de cargas inductivas y a fluctuaciones de conectividad en intemperie. Para asegurar un funcionamiento desatendido robusto, el firmware implementa tres mecanismos de salvaguarda:

1. **Temporizador de Seguridad Embebido (*Fail-Safe Timer*):** Cuando el planificador despacha una tarea de riego, el microcontrolador programa una cuenta regresiva asíncrona local asociada a la duración autorizada. Si ocurre una pérdida de conectividad Wi-Fi o del enlace MQTTS durante la conmutación, el temporizador del firmware continúa su conteo en memoria y desenergiza la bomba y las electroválvulas al expirar el tiempo programado, previniendo sobre-riego o inundaciones accidentales.
2. **Watchdog de Hardware (WDT):** Configurado en 125 segundos, este temporizador independiente a nivel de silicio se refresca periódicamente dentro del bucle asíncrono. Ante un eventual bloqueo de tareas, el WDT fuerza el reinicio integral del ESP32, mientras que la regla de desconexión prolongada (`MAX_OFFLINE_RESET_SEC = 600`) reinicia el hardware si se superan los diez minutos continuos sin reconexión.
3. **Autorrecuperación Física por Relé 8:** Los sensores I2C expuestos a variaciones térmicas y humedad pueden sufrir bloqueos transitorios en las líneas de datos. En lugar de reiniciar el microcontrolador completo (lo que interrumpiría la sesión segura con el servidor y apagaría el riego), el nodo implementa un ciclo de potencia sobre el Relé 8: la línea de alimentación de 5V se desenergiza durante dos segundos y se reactiva, drenando los buses capacitivos y restableciendo los transductores en menos de dos segundos sin afectar el resto de las operaciones.

---

### 4. Muestreo Adaptativo y Sincronización Horaria RTC

El firmware sincroniza su reloj interno de tiempo real (RTC) mediante la trama de ajuste despachada por el servidor tras cada reinicio (`NODE REBOOT`), fijando la hora legal de Venezuela (UTC-4). Esta calibración asegura que el lote de diez muestras de telemetría (`BATCH_SIZE = 10`) se publique con marcas de tiempo rigurosamente alineadas a las ventanas fijas de diez minutos del reloj (:00, :10, :20, etc.), garantizando la coincidencia con las lecturas de la estación interior.

Paralelamente, el muestreo de lluvia opera de forma adaptativa: en condiciones normales muestrea el transductor cada cinco minutos (`INTERVAL_NORMAL = 300` s); no obstante, cuando el planificador detecta caídas abruptas de iluminancia que anticipan una precipitación, conmuta el nodo al modo ráfaga (`INTERVAL_BURST = 60` s). En este modo, el microcontrolador promedia diez lecturas analógicas cada cincuenta milisegundos para filtrar el ruido eléctrico, transmitiendo el estado de lluvia con histéresis estricta para alimentar el motor de inferencia meteorológica.

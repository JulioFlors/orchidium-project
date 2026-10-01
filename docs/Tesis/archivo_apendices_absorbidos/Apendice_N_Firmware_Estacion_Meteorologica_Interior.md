# **Apéndice N. Firmware y Reposo de la Estación Interior**

El presente apéndice describe la arquitectura de software embebido, la gestión de consumo ultra-bajo y el protocolo de comunicación implementados en la Estación Meteorológica Automatizada Interior (EMA Interior, designada operativamente como ZONA_A) de la plataforma PristinoPlant. Diseñado en MicroPython para ejecutarse sobre un microcontrolador ESP32 alojado dentro de una garita meteorológica portátil tipo Stevenson, este firmware tiene como objetivo primordial maximizar la autonomía energética a batería sin comprometer la fidelidad telemétrica del microclima interno del orquideario.

---

### 1. Restricciones Energéticas y Operación a Batería

A diferencia del nodo actuador, cuya ubicación contigua al tablero eléctrico le permite disponer de alimentación ininterrumpida de red, la estación meteorológica interior fue concebida como un dispositivo móvil e inalámbrico. Su función es evaluar gradientes higrotérmicos y lumínicos entre distintas secciones y alturas de las mesas de cultivo de orquídeas sin tender cables que entorpezcan las labores agronómicas.

La estación se alimenta mediante una celda recargable de iones de litio formato 18650 (3.7V / 2500 mAh) acoplada a un circuito de regulación y carga TP4056. Dado que el consumo promedio del ESP32 con el módem Wi-Fi activo oscila entre 120 mA y 160 mA, mantener el sistema encendido de forma continua agotaría la carga de la batería en menos de veinte horas. Por ende, la arquitectura del firmware se diseñó en torno al paradigma de ciclo de trabajo reducido (*Duty Cycle*), alternando breves ráfagas de transmisión activa con periodos prolongados de reposo profundo (*Deep Sleep*).

---

### 2. Arquitectura de Reposo Profundo y Aislamiento por GPIO

El microcontrolador implementa una máquina de estados optimizada donde permanece en estado de sueño profundo durante intervalos regulares de sesenta minutos gobernados por su reloj de tiempo real (RTC). En este modo, se desenergizan los núcleos de la CPU, la memoria RAM principal y el módem de radiofrecuencia, reduciendo el consumo estático del silicio a menos de 15 µA.

###### Tabla Ap-N1.  *Asignación de pines y aislamiento de alimentación en la EMA Interior.*
| Línea de Hardware | Pin GPIO | Modo Operativo | Función y Estrategia de Ahorro Energético |
| :--- | :--- | :--- | :--- |
| Alimentación DHT22 (`PIN_DHT_VCC`) | GPIO 15 | Salida Digital | VCC conmutado: energiza el DHT22 únicamente durante el muestreo. |
| Datos DHT22 (`PIN_DHT_DATA`) | GPIO 4 | Entrada Pull-Up | Línea bidireccional de lectura higrotérmica. |
| Alimentación BH1750 (`PIN_BH1750_VCC`) | GPIO 23 | Salida Digital | VCC conmutado: energiza el luxómetro I2C únicamente durante la lectura. |
| Reloj I2C (`PIN_I2C_SCL`) | GPIO 22 | Bus I2C | Línea de sincronismo de reloj hacia el sensor BH1750. |
| Datos I2C (`PIN_I2C_SDA`) | GPIO 21 | Bus I2C | Línea bidireccional de datos del sensor BH1750. |

*Nota.* Fuente: Constantes de hardware en `firmware/weather_station/main.py`. Elaboración propia.

Para erradicar corrientes parásitas durante el reposo, el diseño prescindió de conectar los sensores a la línea fija de 3.3V. La alimentación de los módulos DHT22 y BH1750 se comanda a través de pines GPIO digitales dedicados (GPIO 15 y GPIO 23). Al despertar, el microcontrolador activa estos pines en nivel alto (`HIGH`), estabiliza los transductores durante cincuenta milisegundos, adquiere las lecturas ambientales y apaga de inmediato las salidas (`LOW`), anulando cualquier fuga de energía a través de los chips o de las resistencias de polarización durante la hora de sueño.

---

### 3. Protocolo de Handshake y Negociación con el Servidor

Una vez adquiridas las variables climáticas, el firmware activa el subsistema de red para transmitir los datos de forma ágil y coordinada con el microservicio planificador (*Scheduler*), cumpliendo una secuencia determinista de cuatro etapas:

1. **Conexión Rápida y Transmisión:** El nodo se asocia a la red Wi-Fi y abre un socket seguro TLS con el bróker Eclipse Mosquitto, publicando su estado (`online`) en el tópico `/status` y el lote de telemetría en `/readings` con un tamaño de doce muestras horarias (`BATCH_SIZE = const(12)`).
2. **Sincronización Horaria y Calibración:** El microcontrolador queda a la escucha en su canal de comandos (`/cmd`), donde el planificador despacha la marca horaria para corregir derivas del RTC interno y la orden de encendido o suspensión del muestreo lumínico (`lux_sampling:off`) al anochecer.
3. **Orden de Reposo y Acuse de Recibo:** Tras asentar los datos en la base de datos, el servidor despacha el comando unívoco `sleep`. El microcontrolador devuelve una trama de acuse de recibo (`ACK`) certificando la recepción de la orden.
4. **Desconexión Limpia y Retorno a Sueño:** Tras emitir el acuse, el firmware cierra formalmente la conexión MQTTS para no generar alertas falsas de caída abrupta (LWT) y ejecuta la llamada nativa `deepsleep(3600000)`, reingresando a reposo por sesenta minutos.

```
SECUENCIA DE NEGOCIACIÓN DE LA ESTACIÓN INTERIOR (EMA)
ESP32 (Garita Interior)                               Servidor (Scheduler)
   │                                                           │
   ├── Despierta de Deep Sleep (RTC x 60 min)                  │
   ├── Energiza sensores (GPIO 15/23 HIGH)                     │
   ├── Adquiere variables microclimáticas                      │
   ├── Apaga sensores (GPIO 15/23 LOW)                         │
   ├── Conecta Wi-Fi + MQTTS TLS ─────────────────────────────>│
   ├── Publica Telemetría (/readings) ────────────────────────>│ Ingesta en InfluxDB
   ├── Publica Estado ONLINE (/status) ───────────────────────>│ Actualiza Gemelo Digital
   │                                                           │
   │<── Comando: Sincronización Horaria RTC ───────────────────┤ Ajusta RTC local
   │─── Trama ACK ────────────────────────────────────────────>│
   │                                                           │
   │<── Comando: lux_sampling:off (Ciclo Solar) ───────────────┤ Si es de noche
   │─── Trama ACK ────────────────────────────────────────────>│
   │                                                           │
   │<── Comando: sleep (Autorización de Reposo) ───────────────┤ Servidor valida cierre
   │─── Trama ACK ────────────────────────────────────────────>│
   ├── Cierre limpio de Socket TLS                             │
   └── Retorno a Deep Sleep por 60 minutos                     └── Marca nodo en SLEEP
```

---

### 4. Salvaguarda Energética por Tiempo Límite (Timeout Fallback)

En redes inalámbricas sujetas a fluctuaciones de propagación, existe el riesgo de que el microcontrolador quede bloqueado en bucles infinitos de espera si un paquete se extravía o si el servidor experimenta demoras en responder. Si el firmware permaneciera esperando el comando de reposo con el módem encendido, la batería se descargaría rápidamente.

Para neutralizar esta vulnerabilidad, el firmware integra una guarda estricta por tiempo límite (*Timeout Fallback*). El temporizador del socket se calibra en cuarenta y cinco segundos (`MQTT_SOCKET_TIMEOUT = const(45)`): si al cabo de este lapso el servidor no ha emitido la orden `sleep`, el microcontrolador aborta la espera, fuerza el cierre del radioenlace y ejecuta el reingreso autónomo a *Deep Sleep*. Paralelamente, el planificador en el backend detecta el vencimiento del acuse y asienta el registro de contingencia correspondiente, preservando la sincronía del sistema sin sacrificar la vida útil de la celda de litio.

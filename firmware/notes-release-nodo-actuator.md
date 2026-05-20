# Notas de Lanzamiento - Nodo Actuador (Firmware v0.15.0)

**Fecha**: 20-05-2026
**Plataforma**: ESP32 (MicroPython v1.19+)
**Componente**: `firmware/relay_modules`

Este documento resume los cambios arquitectónicos, optimizaciones de memoria (RAM) y mejoras de resiliencia física introducidas en el firmware del Nodo Actuador (Riego + Estación Meteorológica Exterior) para la versión **v0.15.0**.

---

## 1. Resiliencia Sensorial Unificada & Mecanismos de Recuperación

### 1.1 Robustez en el Arranque (Boot) del DHT22

Para mitigar fallos transitorios en el encendido causados por capacitancia en cables largos de señal:

* **Frecuencia de reintento**: Se modificó `setup_sensors()` para que, si falla la verificación inicial, realice un bucle de **hasta 3 ciclos de hard reset y validación**.
* **Intentos Totales**: Esto se traduce en **4 intentos de lectura/conexión** en el arranque (el intento inicial + 3 intentos de rescate con corte de energía previo).
* **Mitigación**: Si el sensor se estabiliza en cualquiera de los reintentos, el boot prosigue sin marcar el sensor como ausente.

### 1.2 Auto-recuperación Autónoma en Caliente

* Si la tarea periódica `climate_monitor_task` experimenta **3 fallos consecutivos de lectura** (intervalos de 60 segundos), asume corrupción del bus o congelamiento físico del sensor y ejecuta de forma autónoma `hard_reset_sensors()` cortando la alimentación a través del Relé 8.
* Esto complementa el Watchdog de 25 minutos del Scheduler (que actúa como plan de contingencia si el nodo pierde conexión al broker).

### 1.3 Preservación de Buffers de Telemetría (RingBuffers)

* Al ejecutar un `hard_reset_sensors()`, las variables globales de hardware (`dht_sensor`, `rain_sensor_analog`, `illuminance_sensor`) se invalidan a `None` para limpiar los canales lógicos, pero **los RingBuffers de telemetría acumulada permanecen intactos**.
* Los datos históricos previos al fallo **no se pierden** y se enviarán en el próximo ciclo exitoso de transmisión.

---

## 2. Optimizaciones Críticas de Memoria RAM (MicroPython Heap)

En MicroPython, la memoria RAM es un recurso extremadamente limitado (~100KB de Heap útil). Se introdujeron dos optimizaciones que reducen drásticamente la fragmentación del recolector de basura (GC):

### 2.1 Eliminación de Diccionarios Literales en Rutas Calientes (`log_mqtt_exception`)

* **Problema**: El mapeo de códigos de error de `MQTTException` a mensajes de depuración utilizaba un diccionario de 17 entradas definido en el cuerpo de la función. Cada llamada asignaba dinámicamente ~400 bytes en el Heap. Durante ráfagas de desconexión sucesivas, esto fragmentaba la memoria y gatillaba reboots por falta de memoria.
* **Solución**: Se reemplazó el diccionario por una estructura de decisiones síncrona `if/elif`. Los condicionales se resuelven a nivel de bytecode estático, lo que reduce la asignación en el Heap a **0 bytes** por ejecución.

### 2.2 Transición de List Comprehensions a Generator Expressions

* **Problema**: La serialización de buffers para MQTT (`illuminance`, `temperature`, `humidity`, `rain_intensity`) mediante `",".join([ ... for it in items ])` creaba una lista temporal de strings formateados en el Heap antes de unirlos.
* **Solución**: Se removieron los corchetes internos para usar expresiones generadoras: `",".join( ... for it in items )`. La concatenación se realiza de manera perezosa elemento por elemento, **reduciendo el pico transitorio de asignación de RAM en un 50%**.

---

## 3. Resolución de Conflictos de Pines Físicos (Hardware)

Se modificó la asignación de pines en `setup_relays()` para resolver una colisión eléctrica:

* **Conflicto original**: El actuador del `fogger` (Relé 4) y el corte de energía física `sensor_power` (Relé 8) compartían el Pin 26.
* **Solución**: Se reasignó el actuador de corte físico `sensor_power` (Relé 8) al **Pin 27**.
* **Ajuste de dependencias**: La bomba (`pump`, Relé 3) se reubicó al **Pin 14** y los agroquímicos (`agrochemical`, Relé 2) al **Pin 12**.

---

## 4. Limpieza del Canal Obsoleto `/climate/sync`

* Se eliminó el canal de respuesta rápida `/climate/sync`.
* El comando MQTT `sync_climate` ahora ejecuta un ciclo físico completo (`hard_reset_sensors`), mide los valores de inmediato e inyecta la lectura al canal general `/readings` con un retardo seguro (offset de 2 segundos) para evitar colisiones de red.
* Se reordenaron los bloques `except` en el manejador del comando `sync_climate` para interceptar `MQTTException` y `OSError` antes de la excepción general, asegurando que las fallas de red forcen la desconexión del cliente y su respectiva reconexión.

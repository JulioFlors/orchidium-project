# Irrigation Lifecycle Telemetry & State Synchronization

## 1. Introducción

Este documento detalla cómo interactúan el **Scheduler (Node.js)** y el **Firmware del Relay Module (ESP32)** para mantener una trazabilidad exacta del ciclo de vida de un evento de riego. Se garantiza que cada eventualidad (desde problemas de hardware hasta caídas de red) se registre como histórico en la base de datos de la plataforma.

## 2. Matriz de Eventos de Ciclo de Vida

### Trazabilidad de Éxito (Happy Path)

1. **Creación**: La tarea nace en BD como `PENDING` o `WAITING_CONFIRMATION` (agroquímicos). Evento registrado.
2. **Despacho (`DISPATCHED`)**: El programador Cron del Scheduler madura y pública el payload hacia `PristinoPlant/Actuator_Controller/irrigation/cmd`.
3. **Confirmación de Hardware (`ACKNOWLEDGED`)**:
   - *ESP32*: Recibe el mensaje (QoS 1) y evalúa que no está corrupto, publicando un eco del payload en `.../cmd/received`.
   - *Scheduler*: Lee el eco y anota en BD que el Nodo Actuador formalmente aceptó la tarea.
4. **Encendido Hidráulico (`IN_PROGRESS`)**:
   - *ESP32*: Activa pines físicos (Relés de válvulas/bomba).
   - *ESP32*: Publica `ON` en `.../irrigation/state/<actuator>`.
   - *Scheduler*: Registra la fecha exacta (`actualStartAt`) con el evento.
5. **Apagado (`COMPLETED`)**:
   - *ESP32*: El timer de hardware culmina el conteo de la duración. Apaga los pines de hardware.
   - *ESP32*: Publica `OFF` en `.../irrigation/state/<actuator>`.
   - *Scheduler*: Calcula el tiempo desde el `actualStartAt` en base de datos. Pone estado `COMPLETED` indicando `(X min)` regados.

### Trazabilidad de Fallos y Resiliencia (Casos Borde)

| Evento | Actuación del Firmware ESP32 | Actuación del Scheduler | Estado Resultante |
| --- | --- | --- | --- |
| **Lluvia Inminente** | N/A (Ignorante del clima) | Detiene antes de `DISPATCH`. Consulta InfluxDB. | `CANCELLED` (Notas de lluvia) |
| **Pérdida de Conexión en Riego** | Sigue regando usando `utime`. Guarda contingencia en NVS Flash Timer cada vez que riega. | Detecta `offline` mediante tópico de LWT (Last Will). | `FAILED` ("Interrumpida tras X min") |
| **Baja Tensión / Reinicio / Corte Físico** | Salva milisegundos restantes en disco EEPROM/Flash rápido antes del Crash. Al bootear no hay WiFi. | LWT se dispara por timeout de PINGS UDP en el Broker MQTT. Detecta `offline`. | `FAILED` ("Interrumpida tras X min") |
| **Reconexión Rápida (< 20 min)** | `boot_recovery_check()` detecta que está en la ventana de gracia. Reactiva pines físicos de inmediato. | Retorna el módulo LWT `online`. `resumeInterruptedTasks()` ve tareas `FAILED` que están en ventana y las re-pasa a `DISPATCHED` con los minutos restantes. | `IN_PROGRESS` (Nueva iteración sobre el hardware `state/ON`) |
| **Descuido del Hardware (Sordo / Nunca hay ACK)** | El hardware está bugeado, ocupado en SSL o simplemente no suscripto a QoS 1 de forma óptima. | Polling del `Scheduler` caza tareas con estado `DISPATCHED` que luego de 2 minutos no transmutaron. | `FAILED` ("Timeout: El Nodo Actuador nunca confirmó...") |
| **Interrupción de Vía de Retorno (SLA Excedido)** | Terminó de regar pero sin internet, y el backend perdió la LWT (fallo de infraestructura en Cloud). | Polling (GC Limpieza Atascadas). Busca las `IN_PROGRESS` cuya ETA (`duration + 20 min`) venció hace mucho tiempo. | `FAILED` ("Tarea atascada: no se recibió telemetría...") |
| **Expiración de Ventana de Recuperación** | Tras 20 min offline, `boot_recovery_check()` ignora la tarea vencida. Borra NVS y no actúa. | Polling (GC Limpieza de Interrumpidas) busca tareas en `FAILED` excedidas del tiempo absoluto y dicta expiración en BD. | `FAILED` ("Ventana de recuperación agotada. Tarea descartada...") |

---

## 3. Análisis de Brecha de Trazabilidad (Identificada)

El análisis del código fuente del **Firmware (`main.py`)** detecta una acción estricta y silenciosa respecto al descarte de tareas diferidas/pausadas:

```python
# Firmware / main.py
if elapsed_offline > RECOVERY_WINDOW: # (> 20 min)
    if DEBUG:
        print(f"🗑️ Tarea Pausada (Vencida) ID:{actuator_id}")
    NVSManager.clear_task(actuator_id) # Descarte silencioso (Sin telemetría)
    continue
```

**Problema:**
El ESP32 descarta tareas "vencidas" internamente, pero al no existir red en su booteo u omisión intencional para priorizar estabilidad, no reporta al Broker Central que la tarea "caducó".
El Scheduler asume la interrupción inicial (`FAILED` por fallo de red), pero un usuario que lee el historial vería "Interrumpida tras 10 min", y nunca sabrá si la orden logró reanudarse en otro instante o si simplemente la ventana expiró permanentemente.

**Solución Implementable en Scheduler:**
El motor de Polling del Scheduler (`checkPendingTasks()`) debe integrar un sub-método:

- **Recolector de Expiradas**: Buscamos todas las tareas marcadas como `FAILED` con el tag transitorio (`"Interrumpida"`), revisamos si `Date.now()` ha quebrado el margen de `graceWindow` (20 min).
- **Acción Correctora**: Actualizamos la bitácora con un nuevo Log Event (`TaskEventLog` / Status: `FAILED`), anexando la nota: *"Ventana de recuperación agotada (20 min). Tarea descartada permanentemente."*

Esta adición dotará al sistema de un 100% de coherencia bidireccional, incluso con módulos satélites en silencio.

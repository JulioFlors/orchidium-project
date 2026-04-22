# Service: Scheduler

El servicio `Scheduler` es el cerebro operativo de PristinoPlant. Se encarga de la gestión de tiempos, ejecución de rutinas automatizadas y mantenimiento del estado coherente del hardware.

## Responsabilidades

- Cargar y gestionar rutinas programadas (Crons) desde PostgreSQL.
- Ejecutar el **Motor de Inferencia** para decidir si una tarea debe saltarse por razones ambientales (WeatherGuard).
- Gestionar reintentos de comandos MQTT mediante el `retryManager`.
- Sincronizar estados operativos (Eco Mode, Lux Sampling) con los nodos.

## Estrategia de Sincronización: Pessimistic Push

PristinoPlant utiliza un modelo de sincronización basado en **Push Pesimista** desde el backend hacia los nodos.

### ¿Cómo funciona?

1. El backend determina el estado ideal (ej. "Muestreo de Lux: ON" por ser horario diurno).
2. El backend monitorea la presencia de los nodos vía MQTT (LWT/Status).
3. Tras detectar una transición a `ONLINE`, el backend "empuja" agresivamente el estado deseado al nodo.
4. Si el nodo no confirma (ACK), el `retryManager` reintenta la entrega hasta 20 veces.

### Evaluación de la Estrategia

| Ventaja | Desventaja |
| :--- | :--- |
| **Simplicidad en Firmware**: El nodo no necesita saber "qué" pedir ni gestionar lógica de tiempo compleja. | **Redundancia**: Se envían comandos de sincronización aunque el nodo ya tenga la configuración correcta. |
| **Recuperación Automática**: Si un nodo se reinicia, el backend lo detecta y restaura su estado en milisegundos. | **Dependencia de Conectividad**: Requiere que el backend detecte correctamente el estado `online` para no enviar comandos a ciegas. |
| **Centralización**: El horario de "Amanecer/Anochecer" se cambia en el backend sin tocar el código del dispositivo. | **Overhead en Broker**: Más tráfico de mensajes durante ventanas de reconexión masiva. |

## Motor de Inferencia

Antes de cada riego, el scheduler consulta al `InferenceEngine`. Este analiza:

- Pronóstico de lluvia inminente (Weather Oracle).
- Humedad del suelo (AgroMonitoring/Sensores).
- Intensidad de luz actual.
Si las condiciones no son óptimas, la tarea se registra como `SKIPPED`.

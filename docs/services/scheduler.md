# Service: Scheduler

El servicio `Scheduler` es el cerebro operativo de PristinoPlant. Se encarga de la gestión de tiempos, ejecución de rutinas automatizadas y mantenimiento del estado coherente del hardware.

## Responsabilidades

- Cargar y gestionar rutinas programadas (Crons) desde PostgreSQL.
- Ejecutar el **Motor de Inferencia** para decidir si una tarea debe saltarse por razones ambientales (WeatherGuard).
- Gestionar la ejecución secuencial de comandos MQTT mediante el `CommandSequencer` con colas de prioridad.
- Sincronizar estados operativos (Eco Mode, Lux Sampling) con los nodos de forma proactiva tras reconexiones.
- **Gestión de Eventos de Lluvia**: Apertura, cierre y cálculo de duración de eventos de lluvia en Postgres (`RainEvent`), absorbiendo la lógica anteriormente delegada al firmware (NVS).
- **Recuperación Elástica de Riego**: Reinicio automático de tareas interrumpidas por fallos de hardware o red, basándose en el estado persistido en PostgreSQL.

## Estrategia de Sincronización: Pessimistic Push & Proactive Retry

PristinoPlant utiliza un modelo de sincronización basado en **Push Pesimista** desde el backend hacia los nodos, reforzado por un sistema de reintentos proactivos.

### ¿Cómo funciona?

1. El backend determina el estado ideal (ej. "Muestreo de Lux: ON" por ser horario diurno).
2. El backend monitorea la presencia de los nodos vía MQTT (LWT/Status) y un **Watchdog de 90s**.
3. Tras detectar una transición a `ONLINE` o un mensaje de `boot`, el backend "empuja" agresivamente el estado deseado al nodo mediante `retryAllPending`.
4. Si el nodo no confirma (ACK), el `CommandSequencer` gestiona la insistencia dentro de una ventana de oportunidad dinámica (20 min + duración de la tarea).

### Gestión de Estados de Conectividad

El Scheduler realiza una detección semántica del estado del hardware:

- **ONLINE**: El nodo está conectado y respondiendo.
- **REBOOT**: Se detecta un reinicio físico (tiempo desde último heartbeat < 30min). Ante este estado, el Scheduler **cancela automáticamente** las tareas activas para evitar estados inconsistentes en los relés.
- **OFFLINE**: El nodo no es visible. Se categoriza el origen del fallo: `[BROKER]`, `[NODE]` o `[SCHEDULER]`.

## Motor de Ejecución: CommandSequencer

El `CommandSequencer` reemplaza al antiguo gestor de reintentos, aportando:

- **Colas de Prioridad**: Los comandos de estado (Eco/Lux) tienen prioridad sobre las tareas de riego.
- **Ventanas Dinámicas**: Los comandos expiran si no pueden entregarse en un tiempo razonable, evitando riegos fuera de horario.
- **Gestión Estricta de ACKs**: La confirmación del firmware es el único disparador válido para marcar una tarea como completada en la base de datos.

## Motor de Inferencia

Antes de cada riego, el scheduler consulta al `InferenceEngine`. Este analiza:

- **Clima Exterior**: Pronóstico y estado actual (MUY_SOLEADO, SOLEADO, TEMPLADO, NUBLADO, LLUVIOSO).
- **Gestión de Lluvia Real**: Procesa estados `Raining`/`Dry` para persistir la duración exacta de los eventos hídricos, fundamental para el cálculo de vetos ambientales.
- **Factores de Fallback**: En caso de fallo de sensores interiores, aplica correcciones automáticas (-2°C, +8% HR) basadas en el efecto de la malla sombra.
- **Acumuladores**: Minutos de nublado consecutivo para decisiones de riego suplementario.
- **KPIs Botánicos**: DLI (Daily Light Integral) y VPD (Vapor Pressure Deficit) para optimizar el crecimiento.

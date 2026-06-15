# Especificación: weather-station-sync-consolidation

Esta especificación detalla los cambios requeridos para consolidar la lógica duplicada de la ventana de sincronización de la estación meteorológica (`firmware/weather_station/main.py`).

## 1. Requerimientos

### 1.1 Extracción de Lógica Duplicada
- Crear una función auxiliar asíncrona parametrizada que encapsule el bucle de espera de comandos (`sync_event`) y la extensión de la ventana de sincronización.
- La función debe aceptar como argumentos:
  - El tiempo de timeout en milisegundos (`timeout_ms`).
  - Una referencia opcional al watchdog de hardware (`wdt`).

### 1.2 Unificación de Parámetros de Ventana
- En `transmit_and_sync`, llamar a la nueva función auxiliar con una ventana de 60 segundos (`60000` ms).
- En `main_transmission`, llamar a la nueva función auxiliar con una ventana de 30 segundos (`30000` ms), pasando la instancia del watchdog `wdt` si está disponible.

### 1.3 Corrección de Consistencia en Mensajes de Log
- Asegurar que los mensajes de log en consola (`print`) reflejen dinámicamente el tiempo de timeout configurado para evitar mensajes contradictorios (por ejemplo, reportar un timeout de 30s cuando el límite real era de 60s).

### 1.4 Consolidación DRY de Telemetría (Caso A)
- Definir un array centralizado de configuración de lotes climáticos `METRIC_BATCHES` con tuplas conteniendo el nombre de la métrica y su respectivo `RingBuffer`.
- Refactorizar las corrutinas `flush_telemetry_batches_async` y `flush_telemetry_batches` para eliminar código redundante y recorrer la lista de lotes climáticos iterativamente.

### 1.5 Unificación de Backoff de Conexión MQTT (Caso B)
- Crear una función auxiliar `handle_mqtt_backoff(failures_count, context="conexion")` para centralizar el cálculo del retraso exponencial, logs y recolección de basura RAM.
- Reemplazar las dos ocurrencias dispersas de cálculo de backoff en `mqtt_connector_task` con llamadas a la nueva función.

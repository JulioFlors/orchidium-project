# Service: Ingest

El servicio `Ingest` actúa como el puente principal (bridge) entre el ecosistema MQTT de PristinoPlant y la base de datos de telemetría de series temporales (InfluxDB v3).

## Responsabilidades

- Suscribirse a todos los tópicos relevantes bajo el prefijo `PristinoPlant/#`.
- Analizar y normalizar los payloads JSON provenientes de estaciones meteorológicas y controladores.
- Persistir métricas de entorno, eventos de lluvia y estados de dispositivos en InfluxDB.

## Procesamiento de Datos

### Normalización de Timestamps (MicroPython Offset)

Dado que los controladores ESP32 usan la época de MicroPython (iniciando el 1 de enero de 2000) en lugar de la época Unix estándar (1970), el ingest aplica automáticamente un offset de **946,684,800 segundos** a cualquier timestamp que detecte como "pre-2000" para garantizar la alineación con el backend.

### Mapeo de Tópicos

| Tópico | Descripción | Medición (Influx) |
| :--- | :--- | :--- |
| `/*/readings` | Telemetría ambiental (Temp, Hum, Lux, etc) | `environment_metrics` |
| `/*/rain/event` | Resumen de eventos de lluvia finalizados | `rain_events` |
| `/*/rain/state` | Cambios de estado en tiempo real (Dry/Raining) | `system_events` |
| `/*/status` | Heartbeat (online/offline) de dispositivos | `system_events` |

## Configuración de Seguridad

El servicio detecta si está operando en un entorno local o de producción. Para conexiones a hosts internos de Docker (`influxdb`), se utiliza una configuración de seguridad granular (`rejectUnauthorized`) dentro del cliente InfluxDB para facilitar la comunicación gRPC/HTTP interna sin comprometer la seguridad global del proceso.

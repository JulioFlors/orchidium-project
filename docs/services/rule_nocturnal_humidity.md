# Regla: Veto por Respaldo de Humedad Exterior (Promedio de 3 Horas / Humedad Saturada)

Esta especificación detalla el funcionamiento del veto de redundancia climática que cancela preventivamente el riego de aspersión de las 6:00 AM si el ambiente exterior estuvo sostenidamente saturado de humedad en la noche/madrugada.

---

## Reglas de Negocio y Tipos de Validación

Para el control del riego de aspersión a las 6:00 AM, se aplican dos tipos de validación basadas en humedad exterior y lluvia para evitar falsos positivos provocados por la humedad residual:

### 1. Validación de Eventos de Lluvia Registrados ($\ge 20$ min)
* **Condición**: Se suman todos los minutos de duración de los eventos de lluvia formales (`RainEvent`) registrados en Postgres durante las últimas 24 horas (`RAIN_LOOKBACK_IRRIGATION_HOURS`).
* **Efecto**: Si la lluvia acumulada total es $\ge 20$ minutos (`MIN_RAIN_DURATION_IRRIGATION_24H`), se considera un día regado y se cancela el riego por aspersión del día siguiente (o el de emergencia).

### 2. Validación de Humedad Sostenida Exterior ($\ge 3$h con promedio $\ge 98\%$)
* **Condición**: Si el promedio de la humedad relativa exterior (`exterior.hum`) registrado en las últimas **3 horas** (`BACKUP_NOCTURNAL_LOOKBACK_MIN` $\ge 180$ minutos) es **mayor o igual a 98.0%** (`BACKUP_NOCTURNAL_HR_THRESHOLD`).
* **Ventana Horaria de Evaluación**: Desde las **7:00 PM (19:00)** hasta las **5:59:59 AM** del día siguiente.
* **Efecto**: Se cancela y omite (SKIP) de manera preventiva el riego por aspersión de las 6:00 AM (incluido el riego de emergencia).
* **Lluvia Implícita Instantánea**: Una lectura de humedad exterior instantánea **$\ge 98.0\%$** en cualquier horario activa el estado de lluvia activa (`isTelemetryRainActive = true`) bloqueando las tareas en tiempo real, pero **no abre un `RainEvent` en la base de datos**.

---

## Diseño Técnico

En `InferenceEngine.evaluate`, cuando la rutina es `IRRIGATION` (riego de aspersión de las 6:00 AM) y la hora local de Caracas está en la ventana nocturna:

1. **Consulta de Historial InfluxDB**:
   - Query para obtener el promedio de los últimos 180 minutos de humedad en la zona `EXTERIOR`:
     ```sql
     SELECT AVG(humidity) as avg_hum, COUNT(humidity) as count_hum
     FROM "environment_metrics"
     WHERE time >= now() - INTERVAL '180 minutes'
       AND source = 'Weather_Station'
       AND zone = 'EXTERIOR'
     ```
2. **Evaluación de Veto**:
   - Si el promedio retornado es $\ge$ `BACKUP_NOCTURNAL_HR_THRESHOLD` (98.0%):
     - Cancelar la ejecución (SKIP) reportando el veto.

---

## Parámetros

| Parámetro | Constante / Valor | Unidad |
| :--- | :--- | :--- |
| **Zona Evaluada** | `EXTERIOR` (Estación Exterior) | - |
| **Variable** | `humidity` | $\%$ |
| **Ventana Temporal** | `BACKUP_NOCTURNAL_LOOKBACK_MIN` (180) | minutos |
| **Umbral Promedio Veto** | `BACKUP_NOCTURNAL_HR_THRESHOLD` (98.0%) | $\%$ |
| **Tareas Afectadas** | `IRRIGATION` (Aspersión) | - |


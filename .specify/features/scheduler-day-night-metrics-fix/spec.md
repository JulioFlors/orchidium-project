# Especificación: Corrección de Procesamiento de Métricas Diurnas y Nocturnas en el Scheduler

## 1. Contexto y Problema

El Scheduler procesa diariamente las métricas ambientales de InfluxDB y las consolida en la tabla `DailyEnvironmentStat` de PostgreSQL mediante la función `processDay` en `telemetry-processor.ts`. Actualmente, el procesamiento de las fases diurnas y nocturnas presenta tres problemas críticos:

1. **Desfase de Ventana Temporal (Desfase UTC)**:
   - La consulta a InfluxDB se realiza con límites UTC planos (`00:00:00Z` a `24:00:00Z` del día anterior).
   - Para la zona horaria de Caracas (`America/Caracas`, UTC-4), esta ventana equivale a `08:00 PM del día anterior` hasta `08:00 PM del día actual`.
   - Como consecuencia, las métricas de la fase nocturna del registro de un día se calculan con datos fragmentados: se suma la noche del día anterior con un segmento de la noche del día actual. Las últimas 4 horas del día calendario (08:00 PM a 11:59 PM) se atribuyen al registro del día siguiente.
   - Esto distorsiona las métricas nocturnas y el cálculo del diferencial térmico (`dif = avgTempDay - avgTempNight`).

2. **Descarte Rígido de Métricas por Límite Global de Muestras**:
   - Si el día completo no cuenta con un mínimo de muestras de 24 horas (`ZONE_LIMITS` exige al menos 173 muestras para la ZONA_A y 864 para EXTERIOR), las variables `isTempValid` e `isHumValid` se evalúan como `false`.
   - Esto invalida por completo todas las estadísticas del día, incluyendo los promedios diurnos y nocturnos, dejándolos en `null` en la base de datos (como ocurrió el 20 de junio en `ZONA_A`), a pesar de tener suficientes lecturas válidas dentro de la ventana diurna o nocturna en sí.

3. **Discrepancia en Rangos Horarios de la Noche**:
   - El código en `telemetry-processor.ts` define la fase nocturna como `localHour >= 19 || localHour <= 5` (07:00 PM a 05:59 AM), lo cual incluye la hora 5 completa, extendiéndose hasta las 05:59 AM en lugar de terminar a las 05:00 AM.

## 2. Requerimientos de Solución

1. **Normalización a Día Calendario Local (Caracas)**:
   - Modificar el cálculo de `dayStart` y `dayEnd` en el scheduler y en los scripts de backfill para que representen la ventana de tiempo del día natural de Caracas desfasada a UTC:
     - `dayStart`: 12:00:00 AM de Caracas (`04:00:00Z` UTC del día a procesar).
     - `dayEnd`: 12:00:00 AM de Caracas (`04:00:00Z` UTC del día siguiente).
   - Esto asegura que todo el procesamiento diario represente exactamente el día calendario local en Caracas de 12:00 AM a 11:59 PM.

2. **Validación Independiente por Ventana**:
   - En lugar de anular todas las métricas por un conteo global de 24 horas (`isTempValid`/`isHumValid`), evaluar la validez de los datos de forma independiente para cada ventana (día, noche, amanecer, fotoperíodo, atardecer) basándose en la densidad de muestras esperadas para esa ventana específica:
     - Si la ventana diurna tiene suficientes muestras, se calcula y guarda `avgTempDay` y `avgHumDay`.
     - Si la ventana nocturna tiene suficientes muestras, se calcula y guarda `avgTempNight` y `avgHumNight`.
     - El cálculo del diferencial térmico (`dif`) solo requiere que tanto el promedio diurno como el nocturno sean válidos.

3. **Alineación de Ventanas Horarias**:
   - Ajustar la ventana nocturna y diurna en `telemetry-processor.ts` para que coincidan exactamente con las especificaciones (Diurna: 8:00 AM - 4:00 PM, Nocturna: 7:00 PM - 5:00 AM VET):
     - `isDaytime`: `(localHour >= 8 && localHour < 16) || (localHour === 16 && localMin === 0)` (08:00 AM a 04:00 PM).
     - `isNighttime`: `localHour >= 19 || localHour < 5` (07:00 PM a 04:59 AM).

## 3. Plan de Verificación

- Ejecutar el script de diagnóstico en local para verificar que los datos recuperados de InfluxDB y consolidados en Postgres correspondan a ventanas calendario correctas.
- Validar el cálculo del diferencial térmico (`dif`) y los promedios diurnos/nocturnos en una corrida de prueba (dry-run).

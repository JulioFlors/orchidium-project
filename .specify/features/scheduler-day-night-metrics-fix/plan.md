# Plan: Corrección de Procesamiento de Métricas Diurnas y Nocturnas en el Scheduler

## 1. Modificaciones Propuestas

### `telemetry-processor.ts`

1. **Definir función utilitaria `getCaracasMidnight(date: Date): Date`**:
   - Usar `Intl.DateTimeFormat` para formatear en la zona `America/Caracas` y extraer los componentes de año, mes y día.
   - Devolver un objeto Date correspondiente a la medianoche de Caracas desfasada a UTC: `new Date('${y}-${m}-${d}T04:00:00.000Z')`.

2. **Actualizar `ZONE_LIMITS`**:
   - Reemplazar `minTempHum` por límites desglosados:
     - `minTempHum24h`: Límite global (60% de 24h).
     - `minTempHumDay`: Límite para la ventana diurna (60% de 8h).
     - `minTempHumNight`: Límite para la ventana nocturna (60% de 10h).

3. **Ajustar la ventana de tiempo en `processDay`**:
   - Cambiar la definición de `dayEnd`. Actualmente hace `dayEnd.setDate(dayEnd.getDate() + 1)`. Dado que `dayStart` será la medianoche de Caracas, `dayEnd` se calculará agregándole exactamente 24 horas (`dayStart.getTime() + 24 * 60 * 60 * 1000`).

4. **Ajustar variables horarias de ventana**:
   - `isDaytime`: `(localHour >= 8 && localHour < 16) || (localHour === 16 && localMin === 0)` (08:00 AM a 04:00 PM).
   - `isNighttime`: `localHour >= 19 || localHour < 5` (07:00 PM a 04:59 AM).

5. **Modificar validación de métricas**:
   - Evaluar por separado:
     - `isTempDayValid = countTempDay >= limits.minTempHumDay`
     - `isTempNightValid = countTempNight >= limits.minTempHumNight`
     - `isHumDayValid = countHumDay >= limits.minTempHumDay`
     - `isHumNightValid = countHumNight >= limits.minTempHumNight`
   - Actualizar `coreData` para usar estas banderas específicas de ventana en lugar del global `isTempValid` e `isHumValid`.
   - `avgTempDay` y `avgTempNight` se calculan usando estas banderas locales.
   - El diferencial térmico `dif` se calcula si `avgTempDay !== null && avgTempNight !== null`.

### `index.ts`

1. **Ajustar el cron worker de las 12:01 AM**:
   - Utilizar `getCaracasMidnight` para definir la fecha fin (`dayEnd`) y restar 24 horas para definir la fecha de inicio (`dayStart`).
   - Pasar `dayStart` a `processDay`.

2. **Ajustar la función de recuperación retroactiva `checkAndRecoverMissingStats`**:
   - Usar `getCaracasMidnight` para alinear las fechas de los días a recuperar al huso horario de Caracas.

### `backfill-history.ts`

1. **Ajustar el script de backfill**:
   - Utilizar `getCaracasMidnight` para normalizar las fechas que se procesan retroactivamente.

## 2. Plan de Verificación

### Pruebas Locales (Dry-Run)
- Ejecutar el script `backfill-history.ts` en modo `DRY_RUN` para verificar que calcule correctamente las métricas y las agrupe en las nuevas ventanas horarias de Caracas.
- Verificar mediante logs de consola que las métricas diurnas y nocturnas se calculen y no queden en `null` en días con baja densidad de muestras (como el 20 de junio).

### Pruebas de Integración (Base de Datos)
- Ejecutar el script `backfill-history.ts` sin `DRY_RUN` para un rango de los últimos 4 días y comprobar en Postgres que los campos diurnos y nocturnos se guarden con valores reales coherentes.

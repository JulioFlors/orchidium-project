# Plan: Motor de Inferencia Meteorológica y Frontend de Monitoreo

Este plan detalla los cambios para reintroducir el Paso 3 (30 min previos), refactorizar los nombres de cese a "Recuperación Progresiva", eliminar emojis duplicados, corregir el trigger nocturno a `NIGHT_10M` y depurar los scripts.

## Cambios Propuestos

### 1. Inferencia: `services/scheduler/src/lib/rain-manager.ts`
- Agregar la lógica para comparar el lote actual (B0) con B3 (30 min previos / 30M) cuando `!triggered` tras evaluar el Paso 2 en `evaluateClimateInference`.
- Definir los umbrales específicos de la Rama A, B, y C para el Paso 3 (temperatura, humedad, lux, pre-saturación, veto).
- Generar el triggerType: `DAY_RAMA_A_OSCURO_30M`, `DAY_RAMA_A_NUBLADO_30M`, `DAY_RAMA_C_INTERMEDIO_SENSIBLE_30M`, etc.
- Cambiar la inferencia nocturna para que registre `NIGHT_10M` en lugar de `NIGHT_20M`.
- Renombrar la causa de cese `THERMAL_SOLAR_RECOVERY` a `PROGRESSIVE_RECOVERY`.
- Corregir el string en `SOLAR_RECOVERY` para que no contenga el emoji al inicio del texto del log/evento:
  `closeReasonText = 'Recuperación Solar — Sol radiante pleno y constante...'`.

### 2. Frontend Visualizer: `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx`
- Eliminar por completo el mapeo de `BASELINE_RECOVERY`.
- Agregar soporte y mapeo de `PROGRESSIVE_RECOVERY` asignándole el título `"Recuperación Progresiva"`.
- Cambiar el trigger nocturno de `NIGHT_20M` a `NIGHT_10M` con el título `"🌙 Cielo Nocturno 10min"`.
- Modificar el mapeo de emojis en `closeIcon` para que compruebe si `closeTitle` es `"Recuperación Solar"`, `"Recuperación Progresiva"`, etc., y asigne el emoji correcto (`☀️`, `🌤️`, `☁️`, `🌡️`) sin duplicarlo.
- Modificar el subtítulo de `SOLAR_RECOVERY` para remover `— todas las muestras del lote ≥ 26k lux` y la palabra `Ilum promedio`, y cambiarlo a `Iluminancia promedio de X lx` (sin emoji en el string).
- Asegurar soporte de `_30M` finalizando como `30min` para `timeLabel`.

### 3. Guía de Monitoreo: `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/InferredRainGuide.tsx`
- Actualizar la documentación interactiva en el componente para incluir las reglas del Paso 3 (30 min previos / 30M).
- Actualizar las descripciones de los criterios de cese para reflejar el término "Recuperación Progresiva" unificado, eliminando la antigua regla "recuperación adaptativa".
- Modificar la inferencia nocturna a `NIGHT_10M` y documentar que evalúa 10 min previos.

### 4. Scripts: `services/scheduler/src/scripts/rebuild-rain-history.ts`
- Reintroducir el Paso 3 de inferencia (B0 vs B3) en la lógica de `rebuildInferredRain`.
- Modificar la regla 2 del cese para usar `PROGRESSIVE_RECOVERY` (los 3 parámetros) en lugar de `BASELINE_RECOVERY`, eliminando esta última por completo de la base de datos reconstruida.
- Registrar el tipo `NIGHT_10M` para los eventos nocturnos.
- Clasificar/analizar la efectividad de cada regla e imprimir las estadísticas al final del script.

## Plan de Verificación
1. Ejecutar el script `rebuild-rain-history.ts` en modo DRY_RUN (`BACKFILL_DRY_RUN=true`) para verificar que las reglas se evalúan y clasifican correctamente.
2. Comprobar que no haya errores de TypeScript en el backend ni en el frontend.

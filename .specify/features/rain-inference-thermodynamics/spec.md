# Spec: Motor de Inferencia Meteorológica y Frontend de Monitoreo

Este documento especifica los cambios requeridos en el motor de inferencia de lluvia, la lógica de reconstrucción de historial, y el frontend de visualización de /monitoring y /botanics.

## 1. Reintroducción del Paso 3 (30 min previos / 30M)
Se reintroduce la evaluación de 30 minutos previos al lote actual (B0 vs B3) durante el horario diurno para detectar tormentas de desarrollo lento.
Las reglas aplicadas son:
- **Rama A (Cielo Nublado, baseLux3 ≤ 15k lx):**
  - Condición de luz: Incondicional (true).
  - Caída térmica: Temp ≤ -3.5°C.
  - Alza de humedad: Robusta ≥ 16.0% HR, Sensible ≥ 14.0% HR.
- **Rama B (Cielo Soleado, baseLux3 > 26k lx):**
  - Condición de luz: Luz actual ≤ 40% de baseLux3.
  - Caída térmica: Temp ≤ -4.0°C.
  - Alza de humedad: Robusta ≥ 14.0% HR, Sensible ≥ 12.0% HR.
- **Rama C (Cielo Intermedio, 15k lx < baseLux3 ≤ 26k lx):**
  - Condición de luz: Luz actual ≤ 60% de baseLux3.
  - Caída térmica: Temp ≤ -3.5°C.
  - Alza de humedad: Robusta ≥ 14.0% HR, Sensible ≥ 12.0% HR.
- **Pre-saturación:** baseHum3 entre 86% y 95% y actual ≥ 98% HR.
- **Veto de Gradiente:** Si no alcanza el umbral Robusto pero sí el Sensible, requiere cambio rápido (Humedad ≥1.8% en 1 min, ≥2.5% en 2 min, o caída térmica ≤-0.5°C en 1 min).

Esto se implementará en:
- `services/scheduler/src/lib/rain-manager.ts`
- `services/scheduler/src/scripts/rebuild-rain-history.ts`
- `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/InferredRainGuide.tsx`

## 2. Refactorización de Nombres y Emojis de Cese
Para evitar inconsistencias y duplicados visuales:
- Unificar las reglas de cese bajo **Recuperación Progresiva** (código `PROGRESSIVE_RECOVERY`), eliminando la antigua `BASELINE_RECOVERY` de raíz del codebase (motor de inferencia, script de reconstrucción de historial, y visualizador).
- En la visualización de Recuperación Solar:
  - El título debe ser simplemente "Recuperación Solar" (sin emoji dentro del string de texto, ya que la UI antepone el emoji dinámicamente).
  - El subtítulo no requiere emoji.
  - Se debe cambiar el subtítulo `- todas las muestras del lote >= 26 klx` por simplemente `Iluminancia promedio de X lx` (ej. `Iluminancia promedio de 39k lx`), siendo X el promedio del lote (`closeLuxMax`).
- Ajustar el frontend `EnvironmentDataChart.tsx` para mapear correctamente los emojis de cese sin duplicación:
  - `closeIcon` = `☀️` para `SOLAR_RECOVERY`
  - `closeIcon` = `🌤️` para `PROGRESSIVE_RECOVERY`
  - `closeIcon` = `☁️` para `STAGNANT`
  - `closeIcon` = `🌡️` para `THERMAL_VARIATION`

## 3. Scripts de Reconstrucción y Clasificación
- Reconstruir eventos de lluvia mediante `rebuild-rain-history.ts` aplicando las nuevas reglas del Paso 3 y el tipo `NIGHT_10M` para noche.
- Analizar y clasificar la efectividad de cada regla, umbral, rama y protección.

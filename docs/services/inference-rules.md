# Reglas del Motor de Inferencia (WeatherGuard v2)

El `InferenceEngine` actúa como la capa de protección (guardrail) antes de ejecutar cualquier tarea logística (riego o fertirriego). Evalúa múltiples fuentes de datos para tomar una decisión informada, compensando las inexactitudes de los pronósticos satelitales con telemetría local cruda.

## Fuentes de Datos Cruzadas

1. **Estación Meteorológica Exterior (Local)**:
   - `Temp`, `Hum`, `Lux`, y Detección de Lluvia (Física).
   - *Peso: Crítico (Fuente de Verdad en Tiempo Real).*
2. **Imágenes Satelitales (AgroMonitoring)**:
   - Humedad del suelo a 10cm (`soilMoisture`).
   - Temperatura del suelo (`t10`).
   - *Peso: Referencial a corto-mediano plazo.*
3. **Pronóstico Meteorológico (Open-Meteo / OpenWeatherMap)**:
   - Probabilidad de precipitación (`precipProb`).
   - *Peso: Especulativo.*

---

## Reglas de Evaluación y Pesos (Score System)

Para evitar rechazos falsos (ej. 100% prob. lluvia pero día soleado), el sistema usará un modelo de devaluación de riesgo. Si el riesgo global supera un umbral, se omite el riego (`SKIP`).

### 1. Hard Blocks (Cancelación Inmediata - Bloqueo Absoluto)

- **Lluvia Física Detectada**: Si el sensor de la estación exterior reporta lluvia en los últimos 30-60 minutos.
- **Humedad Relativa del Suelo Crítica**: Si `soilMoisture` saturado > `40%` (El histórico demuestra que 20-25% es suelo de seco a normal bajo sol intenso, y >35% es el valor tras lluvia prolongada).
- **Cancelación Manual Reciente**: Si el usuario canceló una tarea desde la interfaz hace menos de 5 minutos.

### 2. Evaluaciones Cruzadas (Cross-Check Logic)

Cuando hay factores de alerta moderada, se requiere validación cruzada:

#### Riesgo de Lluvia Inminente

Si el Pronóstico indica `precipProb >= 70%`:

- **Condición Refutadora (Falso Positivo)**: Si el sensor exterior reporta insolación alta (`Lux > 50000`) o temperatura alta (`Temp > 30°C`) y la humedad local es baja (`Hum < 50%`) cerca de la hora programada.
  *Acción*: **Ejecutar Riego** (El pronóstico satelital está equivocado o la nube falló en precipitar localmente).
- **Condición Confirmadora**: Si el pronóstico indica lluvia Y los sensores locales reportan `Lux < 10000` (muy nublado) y `Hum > 85%` (saturación en el aire).
  *Acción*: **Cancelar Riego** (Convergencia de pronóstico y clima local).

#### Evaluación de Horario y VPD (Vapor Pressure Deficit)

Si es mediodía (11:00 AM - 03:00 PM):

- Riego foliar / nebulización puede causar efecto lupa o estrés térmico si `Temp > 32°C` y `Lux > 80000`.
- *Acción*: **Diferir o Cancelar** por protección biológica.

#### Exceso de Humedad Residual (Suelo + Ambiente)

- Si `soilMoisture` está entre `28% - 35%` (Humedad media-alta) **Y** la humedad ambiente de las estaciones (Interior/Exterior) es **mayor a 85%** constantes.
- *Acción*: **Cancelar Riego** para evitar proliferación fúngica, ya que el sustrato no se evaporará rápido.

---

## Problemas Identificados en la Lógica Actual

1. **Umbral de Suelo Irreal**: Considerar `soilMoisture >= 20%` como húmedo era un fallo de calibración satelital. El suelo venezolano árido arroja ~20% incluso cuarteado. Se debe ajustar a `> 35%`.
2. **Ceguera Local**: El oráculo y el motor confiaban ciegamente en el pronóstico (`precipProb`). La estación meteorológica local no tenía voz en la decisión final.
3. **Carencia de Validación Cruzada**: Una API afirmaba que llovía y el riego se cancelaba, ignorando que los fotodiodos locales estaban saturados de sol a mediodía.

## Próximos Pasos de Implementación (Plan)

1. **Ajustar UI del Oráculo (`OracleDecisionCard.tsx`)**: Elevar la barrera de "Suelo Húmedo" al 35% o más, y agregar el aviso si el sensor local refuta al satélite.
2. **Refactorizar `InferenceEngine.evaluate`**:
   - Programar la query para extraer último reporte de la **Estación Exterior** e **Interior** en InfluxDB.
   - Construir los bloques de decisión (Hard Blocks y Validación Cruzada).
   - Generar registros detallados de la refutación: *"Pronóstico 100% de lluvia ignorado debido a Sol intenso (45k Lux) detectado por sensores locales."*

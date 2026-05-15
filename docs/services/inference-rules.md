# Reglas del Motor de Inferencia Ambiental (v6)

> **Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas**
>
> Ciudad Guayana, Estado Bolívar, Venezuela — Clima Tropical (Aw según Köppen).
>
> *Referencia Académica: PTG — UCAB Guayana, Ingeniería Informática.*
> *"Aprovechar las innovaciones tecnológicas para el diagnóstico, toma de decisiones y ejecución de las actividades relacionadas al cultivo de orquídeas."*

El `InferenceEngine` es el cerebro de toma de decisiones del Scheduler. Cumple **dos roles fundamentales**:

## Rol 1: Guardián (Protección contra Rutinas Ciegas)

Las rutinas programadas (`AutomationSchedule`) son tareas cron que se ejecutan en horarios fijos sin conocimiento del estado actual del orquideario. El motor de inferencia **intercepta cada tarea antes de su ejecución** y evalúa si las condiciones ambientales actuales justifican o contraindican su ejecución. Si una rutina programada pone en riesgo la integridad de las plantas (exceso hídrico, condiciones favorables a hongos, suelo saturado), el motor la **cancela** con un motivo auditado.

### Rol 2: Proactivo (Generación de Tareas Diferidas)

Cuando el motor detecta que las condiciones ambientales del orquideario se están desviando del rango óptimo, debe ser capaz de **crear tareas diferidas** (`source: INFERENCE`) para regular las condiciones.

> [!WARNING]
> **Restricción anti-duplicación:** Antes de generar una tarea diferida, el motor **DEBE** verificar que no exista ya una tarea encolada o programada en las **ventanas óptimas de ejecución** (ver Sección 2.1) que satisfaga la necesidad diagnosticada. Las rutinas programadas ya cubren estas ventanas; el motor solo genera tareas `INFERENCE` cuando ninguna rutina pendiente resolvería el problema detectado.

Ejemplo: si a las 2pm detecta temperatura >35°C, HR <50%, VWC <25%, **primero verifica** si hay una humectación programada a las 3pm. Si existe → no duplica. Si no existe (fue cancelada o no está programada hoy) → genera tarea `INFERENCE`.

### Principio Rector

> El objetivo del motor es **mantener las condiciones ambientales del orquideario dentro del rango óptimo para el cultivo de orquídeas**, adaptándose a las condiciones climáticas del momento:
>
> - **En temporada de lluvia:** Proteger contra pudrición de raíces, proliferación de hongos (Botrytis), bacterias e insectos causada por exceso de humedad sostenida.
> - **En temporada de sequía:** Asegurar hidratación suficiente (humectación, nebulización, riego) sin excederse al punto de crear condiciones favorables a patógenos.

---

## 1. Fuentes de Datos Disponibles

El motor dispone de las siguientes fuentes de información, listadas por prioridad de confianza:

### 1.1 Telemetría en Tiempo Real (InfluxDB — últimos 30 min)

| Fuente | Sensores | Datos |
| :--- | :--- | :--- |
| **Estación Exterior** (`Weather_Station`) | BH1750, DHT22, Sensor de Gotas | Iluminancia (lux), Temperatura (°C), Humedad Relativa (%), Intensidad de Lluvia |
| **Estación Interior** (`Weather_Station`) | BH1750, DHT22 | Iluminancia (lux), Temperatura (°C), Humedad Relativa (%) |

### 1.2 Eventos de Lluvia (InfluxDB — `rain_events`)

Registros discretos de cada evento pluvial con duración en segundos y zona. Consultables por ventanas de N horas hacia atrás.

### 1.3 Clasificación del Día (DayClassifier — InfluxDB 8:00-16:00)

Promedio de iluminancia acumulada en la ventana diurna. Produce una clasificación categórica:

| Clasificación | Rango de Lux (Promedio 8am-4pm) |
| :--- | :--- |
| `EXTREMADAMENTE_SOLEADO` | ≥ 40,000 |
| `SOLEADO` | ≥ 30,000 |
| `TEMPLADO` | ≥ 26,000 |
| `NUBLADO` | ≥ 15,000 |
| `LLUVIOSO` | < 15,000 |

Incluye: minutos consecutivos bajo umbral de nubosidad (26k lux) con protección contra vacíos de datos (>20 min sin reportes rompen la cadena).

### 1.4 Historial de Tareas Ejecutadas (PostgreSQL — `TaskLog`)

Registro completo de **todas** las acciones hídricas ejecutadas en el orquideario:

| Campo | Información |
| :--- | :--- |
| `purpose` | Tipo: `IRRIGATION`, `SOIL_WETTING`, `HUMIDIFICATION`, `FERTIGATION`, `FUMIGATION` |
| `status` | Estado final: `COMPLETED`, `CANCELLED`, `FAILED`, `DISPATCHED`, etc. |
| `source` | Origen: `ROUTINE` (programada), `MANUAL` (usuario), `DEFERRED` (pospuesta), `INFERENCE` (generada por el motor) |
| `completedMinutes` | Duración real ejecutada (no la programada) |
| `scheduledAt` | Hora programada original |
| `actualStartAt` | Hora de inicio real |
| `notes` | Motivo de cancelación o contexto de ejecución |

### 1.5 Estadísticas Diarias Procesadas (PostgreSQL — `DailyEnvironmentStat`)

Resumen calculado cada noche por el `TelemetryProcessor` (CRON 00:01 AM):

| Métrica | Descripción |
| :--- | :--- |
| `avgTemperature`, `minTemperature`, `maxTemperature` | Rangos térmicos del día |
| `avgHumidity`, `minHumidity`, `maxHumidity` | Rangos de humedad |
| `avgIlluminance`, `maxIlluminance` | Perfil lumínico |
| `dif` | Diferencial Térmico Día/Noche (°C) |
| `dli` | Daily Light Integral (mol/m²/d) |
| `highHumidityHours` | Horas con HR >85% en período nocturno |
| `irrigationMinutes` | Minutos totales de riego ejecutado |
| `nebulizationMinutes` | Minutos totales de nebulización ejecutada |
| `totalWaterEvents` | Conteo total de eventos de agua |
| `totalRainDuration` | Segundos totales de lluvia |
| `dayType` | Clasificación del día |

### 1.6 Pronóstico Meteorológico (PostgreSQL — `WeatherForecast`)

Consenso de dos APIs independientes + datos satelitales de suelo:

| Fuente | Datos |
| :--- | :--- |
| **OpenWeatherMap** | Prob. precipitación, temperatura, humedad, condición |
| **Open-Meteo** | Prob. precipitación, temperatura, humedad, condición |
| **AgroMonitoring** | Humedad volumétrica del suelo (VWC), temperatura del suelo |

#### Interpretación de VWC (Humedad Volumétrica del Suelo — Satelital)

El dato de AgroMonitoring es una imagen satelital que se renueva cada ~12h (8am/8pm). No mide el sustrato del orquideario directamente, sino el suelo de la zona geográfica. Sirve como **indicador de tendencia** para confirmar o refutar decisiones:

| VWC | Interpretación | Implicación para el Motor |
| :--- | :--- | :--- |
| < 25% | **Suelo seco** | Favorecer ejecución de tareas hídricas |
| 25% — 35% | **Suelo secándose** | Evaluar con contexto (lluvia reciente, riego previo) |
| > 35% | **Suelo saturado** | Favorecer cancelación de tareas hídricas |

### 1.7 Bitácora de Agroquímicos (Registro/Diario de Fertilización y Fumigación)

Para tomar decisiones basadas en datos, se debe registrar **toda** actividad de fertilización y fumigación, independientemente de si fue automatizada o manual, y de la zona donde se realizó.

**Propósito dual:**

1. **Registro histórico para el motor de inferencia:** Alimentar el historial de `TaskLog` con `source: MANUAL` para que el motor tenga visibilidad completa de todas las intervenciones en el orquideario, no solo las automatizadas en `ZONA_A`.
2. **Seguimiento de protocolos fitosanitarios:** Las tareas de fumigación deben seguir reglas estrictas (ciclo de **3 aplicaciones** por producto). El sistema debe rastrear el cumplimiento de este ciclo independientemente de la zona.

> [!IMPORTANT]
> **Brecha identificada:** Actualmente el sistema solo registra tareas automatizadas para `ZONA_A`. Las zonas `ZONA_B`, `ZONA_C` y `ZONA_D` no cuentan con automatización y requieren un mecanismo de **registro manual**.
>
> // TODO: Implementar formulario de registro manual de fertilización/fumigación que permita al usuario indicar: zona, producto aplicado (`agrochemicalId`), fecha/hora, duración, notas y secuencia dentro del ciclo. Esto debe funcionar tanto para crear instancias manuales de tareas como para documentar aplicaciones ya realizadas (bitácora retroactiva).

### 1.8 Fuentes de Datos Pendientes de Integración

| Fuente | Estado | Prioridad |
| :--- | :--- | :--- |
| Estación Interior (`Weather_Station`) | Sensor DHT22 pendiente de puesta en producción | Alta |
| Registro manual de agroquímicos (todas las zonas) | Por implementar | Alta |
| Sensor de humedad de sustrato (capacitivo) | No instalado | Media |
| Cámara de monitoreo visual | No implementada | Baja |

---

## 2. Filosofía de Seguridad por Circuito

El sistema distingue entre tareas vitales (supervivencia vegetal) y tareas químicas (riesgo económico/fitosanitario):

### 2.1 Circuito de Irrigación (Vital)

- **Fail-safe:** Ante fallos de telemetría o API, el riego **SIEMPRE** se ejecuta. Es preferible un exceso hídrico controlado a la deshidratación por un fallo de software.
- **Veto:** Solo se cancela si hay **evidencia física inapelable** de lluvia real acumulada (sensor de gotas).

### 2.2 Circuito de Agroquímicos (Riesgo)

- **Fail-safe:** Ante fallos de telemetría o API, la tarea **SE DETIENE** y solicita confirmación manual (`REQUIRE_CONFIRMATION`).
- **Veto:** Requiere consenso total (Sensores + Pronóstico) para cancelar una tarea ya autorizada por el usuario.

### 2.3 Ventanas Óptimas de Ejecución

Las rutinas programadas (`AutomationSchedule`) están diseñadas para ejecutarse en **ventanas horarias óptimas** determinadas empíricamente por el cultivador. El motor de inferencia debe conocer estas ventanas para:

1. **No duplicar:** No generar tareas `INFERENCE` si ya existe una rutina en la ventana que cubre la necesidad.
2. **Proteger:** Evaluar el riesgo real de cada ventana antes de permitir la ejecución.

| Ventana | Hora | Propósito | Justificación Empírica | Riesgo |
| :--- | :--- | :--- | :--- | :--- |
| **Riego** | 6:00 AM | `IRRIGATION` | Regar temprano permite que el sustrato drene y seque antes de que la radiación solar se intensifique después de las 8am. Reduce riesgo de quemaduras por efecto lupa. | Bajo |
| **Humectación AM** | 11:00 AM | `SOIL_WETTING` | Combatir el calor acumulado de la mañana. Se espera reducción de temperatura y aumento de HR tras humectar el suelo. | Bajo |
| **Humectación PM** | 3:00 PM | `SOIL_WETTING` | Mantener suelo húmedo durante el pico de calor vespertino. | Bajo |
| **Nebulización** | 4:00 PM | `HUMIDIFICATION` | A las 4pm la radiación directa sobre el orquideario cesó, permitiendo pulverizar agua para elevar HR y reducir temperatura sin riesgo de quemaduras. | **Alto** — Riesgo de humedecer plantas → pudrición, hongos, bacterias. Máx: 3 min. |
| **Agroquímicos** | 5:00 PM | `FERTIGATION`/`FUMIGATION` | Sin radiación directa. Permite tiempo de preparación del tanque. La aplicación manual en zonas B/C/D toma ~2h, finalizando al anochecer. | **Alto** — Riesgo fitosanitario si hay humedad alta sostenida (Sección 3). |

> [!CAUTION]
> La **nebulización (4pm)** es la tarea de mayor riesgo. Si se ejecuta ciegamente en un día nublado con HR alta, crea el ambiente ideal para patógenos. Es la tarea que más depende de la evaluación del motor de inferencia.

---

## 3. Protocolo de Agroquímicos (Doble Seguro)

Las tareas de `FUMIGATION` y `FERTIGATION` siguen un flujo de dos pasos:

### Paso 1: Autorización del Usuario (12h antes)

- La tarea se pre-agenda en estado `WAITING_CONFIRMATION`.
- **Sin autorización explícita, la tarea nunca se despacha.**
- Si no se confirma en un plazo de 24h desde la hora programada, pasa a `EXPIRED`.

### Paso 2: Veto Ambiental Automático (Momento de ejecución)

Incluso con autorización, el motor puede vetar si detecta tormenta inminente.

**Lógica de Veto:** Se cancela (`SKIP`) si se cumple `((Condición A OR Condición B) AND Condición C)`:

- **Condición A (Lluvia Real):** Está lloviendo ahora O llovió en las últimas 4 horas.
- **Condición B (Microclima Crítico):** Día muy nublado (promedio < 20k lux) **Y** HR > 95%.
- **Condición C (Pronóstico Agresivo):** Consenso de APIs (OWM + Open-Meteo) indica probabilidad de lluvia > 95%.

---

## 4. Reglas de Evaluación por Propósito

### 4.1 IRRIGATION (Aspersión — 6:00 AM, Interdiaria)

**Objetivo:** Regar las raíces aéreas y el sustrato con aspersión directa.

```text
SI lluvia_acumulada(últimas 24h) ≥ 20 minutos → SKIP
MOTIVO: La lluvia ya proporcionó el agua equivalente en el ciclo diario previo.
```

#### Evaluación Cruzada con Historial

```text
// TODO: Implementar cuando haya datos de producción del orquideario interior.
// La siguiente regla utiliza el historial de tareas para reforzar la decisión:

SI lluvia_acumulada(últimas 12h) ≥ 10 min
   Y DailyEnvironmentStat[ayer].totalRainDuration > 1200s
   Y DailyEnvironmentStat[ayer].irrigationMinutes > 0
   → SKIP (el suelo ya está saturado por lluvia + riego de ayer)
```

### 4.2 SOIL_WETTING (Humectación de Suelo — 11:00 AM y 3:00 PM)

**Objetivo:** Mantener la humedad del sustrato durante el pico de calor.

#### Hard Block: Lluvia Reciente

```text
SI lluvia_acumulada(últimas 4h) ≥ 20 minutos → SKIP
```

#### Evaluación Contextual con Timeline de Eventos

```text
// TODO: Implementar análisis cruzado de eventos hídricos.
// Reconstruir el "balance hídrico" del día actual consultando TaskLog:

TaskLog[hoy, COMPLETED] donde purpose IN (IRRIGATION, SOIL_WETTING)
  → Sumar completedMinutes de cada tarea ejecutada hoy.

SI total_riego_hoy ≥ (duracion_programada × 2)
   Y DayClassifier.type IN (NUBLADO, LLUVIOSO)
   Y exterior.hum > 80%
   → SKIP (exceso hídrico en día de baja evapotranspiración)
```

### 4.3 HUMIDIFICATION (Nebulización/Pulverización — 4:00 PM)

**Objetivo:** Elevar la humedad ambiental al cierre del fotoperiodo.

#### Regla Principal: Día Nublado → Innecesario

```text
SI DayClassifier.avgLuxSince8am < 26,000 lux
   Y DayClassifier.type ≠ DESCONOCIDO
   → SKIP (la evapotranspiración fue baja, la humedad ambiental es suficiente)
```

#### Regla de Temperatura Fresca

```text
SI exterior.hum > 80%
   Y exterior.temp < 28°C
   Y DayClassifier.avgLuxSince8am < 26,000 lux
   → SKIP (ambiente ya fresco y húmedo, nebulizar agrega riesgo fúngico)
```

#### Evaluación con Historial del Día Anterior

```text
// TODO: Implementar análisis comparativo entre días consecutivos.
// Ejemplo de regla avanzada:

SI DailyEnvironmentStat[ayer].dayType = 'NUBLADO'
   Y DailyEnvironmentStat[ayer].avgHumidity > 75%
   Y DailyEnvironmentStat[ayer].highHumidityHours > 4
   Y DayClassifier[hoy].type IN (NUBLADO, LLUVIOSO)
   → SKIP (dos días consecutivos de alta humedad = riesgo epidemiológico activo)
```

---

## 5. Evaluación Integral del Estado del Orquideario

> [!IMPORTANT]
> **Principio Fundamental:** El motor de inferencia **NO fabrica datos**. Cuando la estación interior no está disponible, no aplica offsets estáticos arbitrarios. En su lugar, **reconstruye el timeline hídrico y ambiental del orquideario** cruzando todas las fuentes de datos reales disponibles para responder una sola pregunta:
>
> *"Dado todo lo que ha ocurrido en las últimas 36 horas — lluvia, riego, humectación, nebulización, radiación solar, humedad del suelo — ¿el orquideario necesita esta intervención o la intervención lo pondría en riesgo?"*
>
> [!NOTE]
> Esta lógica de evaluación cruzada **aplica siempre**, no solo en ausencia de la estación interior. Cuando los datos interiores están disponibles, se usan como fuente primaria y el cruce de datos actúa como validación. Cuando no están disponibles, el cruce de datos se convierte en la fuente primaria de decisión.

### 5.1 Variables de Contexto para la Toma de Decisiones

El motor reconstruye el estado del orquideario consultando:

| # | Variable | Fuente | Pregunta que responde |
| :--- | :--- | :--- | :--- |
| 1 | `lluvia_ayer` | `DailyEnvironmentStat[ayer].totalRainDuration` | ¿Llovió ayer? ¿Cuánto? |
| 2 | `lluvia_hoy` | `getRecentRainAccumulation(12h)` | ¿Ha llovido hoy? |
| 3 | `dia_ayer` | `DailyEnvironmentStat[ayer].dayType` | ¿Qué tipo de día fue ayer? |
| 4 | `dia_hoy` | `DayClassifier[hoy].type` + `avgLuxSince8am` | ¿Cómo va el día de hoy? |
| 5 | `riego_ayer` | `DailyEnvironmentStat[ayer].irrigationMinutes` | ¿Se regó ayer? |
| 6 | `nebul_ayer` | `DailyEnvironmentStat[ayer].nebulizationMinutes` | ¿Se nebulizó ayer? |
| 7 | `tareas_hoy` | `TaskLog[hoy, COMPLETED/IN_PROGRESS]` | ¿Qué se ha ejecutado hoy? |
| 8 | `vwc` | `WeatherForecast[AgroMonitoring].soilMoisture` | ¿Está seco o saturado el suelo? |
| 9 | `ext_temp` | `Weather_Station.temperature` (tiempo real) | ¿Hace calor o fresco? |
| 10 | `ext_hum` | `Weather_Station.humidity` (tiempo real) | ¿El aire exterior está seco o saturado? |
| 11 | `ext_lux` | `Weather_Station.illuminance` (tiempo real) | ¿Hay sol suficiente para evaporación? |
| 12 | `hr_nocturna` | `DailyEnvironmentStat[ayer].highHumidityHours` | ¿Hubo riesgo epidemiológico anoche? |
| 13 | `dif_ayer` | `DailyEnvironmentStat[ayer].dif` | ¿Hubo salto térmico anoche? |
| 14 | `forecast` | `WeatherForecast[OWM + Open-Meteo]` | ¿Va a llover en las próximas horas? |

### 5.2 Reglas de Decisión por Tarea

#### IRRIGATION (Aspersión — 6:00 AM)

```text
Reconstruir timeline hídrico:
  lluvia_ayer     = DailyEnvironmentStat[ayer].totalRainDuration
  lluvia_hoy      = getRecentRainAccumulation(12h)
  riego_ayer      = DailyEnvironmentStat[ayer].irrigationMinutes
  dia_ayer        = DailyEnvironmentStat[ayer].dayType
  dia_hoy         = DayClassifier[hoy].type
  vwc             = WeatherForecast[AgroMonitoring].soilMoisture

SI lluvia_ayer > 1200s Y lluvia_hoy > 600s
   → SKIP (lluvia sostenida en ambos días)

SI riego_ayer > 0 Y lluvia_hoy > 600s
   → SKIP (se regó ayer + llovió hoy)

SI dia_ayer = 'LLUVIOSO' Y dia_hoy IN ('NUBLADO', 'LLUVIOSO')
   Y exterior.hum > 85%
   Y vwc > 0.35
   → SKIP (ambiente saturado por tendencia multi-día + suelo confirmado por satélite)

SI vwc > 0.35 Y lluvia_hoy > 600s
   → SKIP (suelo saturado confirmado + lluvia reciente)

ELSE → EXECUTE (fail-safe: las orquídeas no deben deshidratarse)
```

#### SOIL_WETTING (Humectación de Suelo — 11:00 AM y 3:00 PM)

```text
Reconstruir actividad hídrica del día:
  tareas_hoy = TaskLog[hoy, status IN (COMPLETED, IN_PROGRESS)]
    .filter(purpose IN (IRRIGATION, SOIL_WETTING))
  
  lluvia_4h  = getRecentRainAccumulation(4h)
  dia_hoy    = DayClassifier[hoy].type
  
SI lluvia_4h.durationSeconds ≥ 1200
   → SKIP

SI tareas_hoy.count ≥ 2 Y dia_hoy IN ('NUBLADO', 'LLUVIOSO')
   → SKIP (ya se ejecutaron 2+ tareas hídricas en día de baja evaporación)

ELSE → EXECUTE
```

#### HUMIDIFICATION (Nebulización — 4:00 PM)

```text
La nebulización es la tarea más dependiente de la radiación solar.
Sin datos interiores, la decisión se basa enteramente en el DayClassifier:

SI DayClassifier.avgLuxSince8am < 26,000
   → SKIP (día sin radiación fuerte = sin necesidad de nebulizar)

SI DayClassifier.type = 'EXTREMADAMENTE_SOLEADO'
   Y exterior.temp > 32°C
   Y exterior.hum < 60%
   → EXECUTE (día extremo, alta evapotranspiración probable)

// TODO: Implementar análisis de DLI acumulado parcial.
// Si el DLI acumulado hasta las 4pm ya superó 12 mol/m²/d,
// la planta transpiró activamente y necesita reposición hídrica foliar.
```

### 5.3 Ventanas Biológicas (Protección de Plantas)

Estas reglas aplican **siempre**, con o sin estación interior:

| Regla | Condición | Acción |
| :--- | :--- | :--- |
| **Nebulización Máxima** | Duración > 3 min | Limitar a 3 min (la línea gotea y riega plantas debajo) |
| **Salto Térmico (DIF)** | `DailyEnvironmentStat[ayer].dif < 5°C` Y `avgHumidity > 85%` | Alerta de riesgo epidemiológico (Botrytis) |
| **HR Nocturna Sostenida** | `highHumidityHours > 6` | Alerta: condiciones favorables para hongos foliares |

---

## 6. Validaciones Cruzadas (Refutación de APIs)

Para evitar "cielos de papel" (pronósticos que no ocurren):

| Regla | Condición | Resultado |
| :--- | :--- | :--- |
| **Refutación por Insolación** | Pronóstico dice lluvia PERO lux > 50,000 Y temp alta | Riego **PROCEDE** (el pronóstico es incorrecto) |
| **Confirmación por Nubosidad** | Pronóstico dice lluvia Y lux < 10,000 Y HR saturada | Riego **SE CANCELA** (convergencia de evidencia) |

---

## 7. Configuración de Umbrales (Calibración 2026)

| Factor | Umbral | Aplicación |
| :--- | :--- | :--- |
| **Lluvia Acumulada** | > 1200s (20 min) / ventana | Veto Riego (24h) / Humectación (4h) |
| **Veto Inteligente: Lux** | > 20% sobre Baseline Mín. | Liberación de Veto (Recuperación Lumínica) |
| **Veto Inteligente: Temp** | > +2.0°C sobre Baseline Mín. | Liberación de Veto (Recuperación Térmica) |
| **Veto Inteligente: Hum** | < -2.0% bajo Baseline Mín. | Liberación de Veto (Desaturación) |
| **Cielo Templado** | > 26,000 lux (tiempo real) | Liberación inmediata de Veto (Sol despejado) |
| **Anti-Intermitencia** | Lux/Temp regresan a Baseline | Anulación de Veto (Re-apertura de evento) |
| **Nebulización Máxima** | 3 minutos | Limitación de duración |

> [!NOTE]
> Toda cancelación realizada por el motor de inferencia queda registrada en el historial (`TaskLog.notes`) con el motivo detallado, permitiendo auditar por qué el sistema tomó dicha decisión.

---

## 8. Contexto Geográfico y Estacional

> [!IMPORTANT]
> **Ciudad Guayana, Venezuela** se ubica en la franja tropical (8°N). El régimen climático presenta dos estaciones marcadas que afectan directamente las decisiones de riego:

### Temporada de Sequía (Enero — Mayo)

- Radiación solar intensa y sostenida (promedios > 40k lux).
- Humedad relativa exterior baja (40-60%).
- Alta evapotranspiración: las orquídeas pierden agua rápidamente.
- **Sesgo del motor:** Favorecer la ejecución de tareas hídricas.

### Temporada de Lluvia (Junio — Diciembre)

- Nubosidad frecuente, lluvias vespertinas diarias.
- Humedad relativa exterior saturada (80-95%).
- Baja evapotranspiración: riesgo de encharcamiento y hongos.
- **Sesgo del motor:** Favorecer la cancelación de tareas hídricas.

```text
// TODO: Implementar detección automática de temporada.
// Basarse en DailyEnvironmentStat de los últimos 14 días:
//   SI promedio(totalRainDuration) > 600s/día → TEMPORADA_LLUVIA
//   SI promedio(avgIlluminance) > 35,000 lux → TEMPORADA_SEQUIA
// Esto permitiría ajustar los umbrales dinámicamente.
```

---

## 9. Mapa de Datos por Tarea

Resumen visual de qué fuentes de datos consulta el motor para cada tipo de tarea:

| Fuente | IRRIGATION | SOIL_WETTING | HUMIDIFICATION | FERTIGATION | FUMIGATION |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Lluvia en curso | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lluvia acumulada (N horas) | ✅ (12h) | ✅ (4h) | — | ✅ (4h) | ✅ (4h) |
| DayClassifier (hoy) | ✅ | ✅ | ✅ | ✅ | ✅ |
| DailyEnvironmentStat (ayer) | ✅ | ✅ | ✅ | — | — |
| Historial de Tareas (hoy) | ✅ | ✅ | — | — | — |
| Estación Exterior (tiempo real) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Estación Interior (tiempo real) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pronóstico APIs | — | — | — | ✅ | ✅ |
| Cancelación Manual | ✅ | ✅ | ✅ | ✅ | ✅ |

> [!TIP]
> Las columnas de FERTIGATION y FUMIGATION no consultan el historial de tareas previas porque su flujo de autorización ya incluye validación manual del usuario (Paso 1 del Protocolo de Doble Seguro).

---

## 10. Evolución Planificada

```text
// TODO: Las siguientes mejoras requieren datos de producción del orquideario interior.

1. Calibración de Umbrales de HR:
   Los valores actuales (90%, 80%, 50%) son tentativos.
   Requieren validación con el sensor DHT22 del orquideario en operación.

2. Detección Automática de Temporada:
   Basada en promedios móviles de 14 días de lluvia e iluminancia.
   Permite ajuste dinámico de umbrales sin intervención manual.

3. Análisis de Correlación Interior/Exterior:
   Una vez que ambas estaciones operen simultáneamente durante un ciclo
   completo (sequía + lluvia), se podrán calcular los coeficientes reales
   de relación entre el microclima del orquideario y el exterior.
   Fecha estimada de datos suficientes: Diciembre 2026.

4. Score de Estrés Hídrico Compuesto:
   Combinar DLI + VPD + DIF + Historial de Riego para generar un índice
   numérico (0-100) que represente el nivel de estrés hídrico de las
   orquídeas en cualquier momento dado.
```

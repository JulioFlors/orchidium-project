# Especificación y Plan de Acción: Motor de Inferencias Ambientales

## 1. Filosofía y Problema Actual

Actualmente, el sistema recopila telemetría cruda (lux, temperatura, humedad) minuto a minuto. Leer el último dato crudo y atarlo directamente a una etiqueta de estado (Ej. `LUX > 45000 = ALTO`) induce a errores, ya que las fluctuaciones momentáneas (una nube pasajera, un reflejo de luz) generan alertas sin contexto biológico.

El usuario final (cultivador) no puede tomar decisiones basándose exclusivamente en gráficos de líneas fluctuantes. El backend debe **procesar, promediar y cruzar** esta información para entregar "Inteligencia Agronómica".

---

## 2. Las 4 Métricas de Inferencia Botánica

El Motor de Inferencia calculará las siguientes métricas derivadas basadas en las lecturas crudas:

### A. VPD (Déficit de Presión de Vapor)

- **Propósito:** Mide la "fuerza de secado" del aire. Indica qué tan fácil pueden transpirar las orquídeas.
- **Cálculo:** Se deriva combinando la Temperatura y la Humedad Relativa.
- **Decisión:** Un VPD muy alto (aire muy seco) obliga a cerrar estomas. Un VPD muy bajo impide la transpiración y atrae hongos.
- **Matiz Botánico (CAM):** Dado que muchas orquídeas (*Cattleya*) abren estomas de **noche**, el VPD nocturno debe estar entre **0.4 - 0.6 kPa** para permitir la transpiración necesaria para el transporte de Calcio sin agotar sus reservas hídricas.
- **Ideal General:** 0.8 - 1.2 kPa (Día).

### B. DLI (Daily Light Integral)

- **Propósito:** La planta no "come" picos de luz, come "volumen total" de luz acumulada en 24 horas.
- **Cálculo:** Convertir Lux a PPFD (radiación fotosintéticamente activa, factor aproximado $Lux \times 0.018$ para espectro solar) e integrarlo en el transcurso del fotoperiodo.
- **Decisión:** Confirmar que las *Cattleya* llegaron a sus 12-15 $mol/m^2/d$ requeridos, independientemente de si hubo picos de sol o un día nublado largo.

### C. DIF (Diferencial Térmico)

- **Propósito:** Las orquídeas (especialmente *Cattleya* y *Encyclia*) necesitan que la noche sea más fría que el día para inducir floración.
- **Cálculo:** Media Temp. Diurna - Media Temp. Nocturna.
- **Decisión:** Validar si se está cumpliendo el salto térmico de 5°C - 8°C.

### D. Riesgo Epidemiológico (Humedad Foliar Constante)

- **Propósito:** Predecir aparición de podredumbre o Botrytis.
- **Cálculo:** Horas consecutivas donde la Humedad Relativa supere el 85% durante la noche sin salto térmico.

---

## 3. Arquitectura del Procesamiento Backend

Para evitar cálculos masivos en el frontend, introduciremos el **Analyzer Cron Worker** (Cron Job en el servicio de Scheduler o Ingest).

### 3.1. Inferencias en Tiempo Real (Ventanas Móviles)

Para el *Dashboard* actual de monitoreo:

- En lugar de la última lectura, la API `/history/current` retornará una **Media Móvil Simple (SMA) de los últimos 10 a 15 minutos**.
- Esto aplana las fluctuaciones. Si un pájaro tapa el sensor 1 minuto, el estado ("Óptimo", "Paso") no parpadeará, estabilizando la visualización y las alertas.

### 3.2. Agregación Nocturna (Cierre Diario)

Cada noche a las 23:55, el backend ejecutará el volcado de insights:

1. Extrae todos los registros de InfluxDB del día de esa Zona.
2. Calcula promedios diarios, máximos absolutos y mínimos absolutos.
3. Calcula el **DLI Total** del día.
4. Calcula el **DIF**.
5. Persiste este registro refinado en PostgreSQL (`DailyEnvironmentStat`) o en un *bucket downsampled* en InfluxDB.

---

## 4. Reglas de Veto Climático en Tiempo Real (Saturación Hídrica y Condensación)

Para proteger las orquídeas contra el exceso hídrico, el shock térmico por frío y la proliferación de patógenos, el motor de inferencia implementa reglas móviles en tiempo real para vetar de forma automática las tareas programadas (`HUMIDIFICATION`, `SOIL_WETTING`, `FUMIGATION`, `FERTIGATION` e `IRRIGATION`).

### 4.1 Veto Diurno por Saturación Hídrica Móvil (4 Horas)
* **Propósito**: Cancelar riegos y nebulizaciones si la atmósfera y el suelo ya están saturados por una lluvia diurna reciente o en curso.
* **Regla**: Evalúa que la media móvil simple (SMA) de la humedad relativa exterior o interior de las últimas 4 horas sea $\ge 85.0\%$.
* **Justificación Técnica**: 
  - Las temperaturas diurnas en Ciudad Guayana y Caracas (promedios de $31^\circ\text{C}$ a $37^\circ\text{C}$) expanden la capacidad volumétrica de retención de humedad del aire. Por ello, incluso bajo lluvia torrencial diurna, la humedad relativa sostenida en 4 horas es físicamente incapca de promediar el $98\%$.
  - Establecer el umbral de saturación hídrica diurno en **$\ge 85.0\%$** proporciona el balance óptimo: evita regar bajo lluvias activas o tormentas recientes, y previene falsos positivos en días secos donde la humedad promedio de la tarde se mantiene en el rango de **$58\%$ - $59\%$**.

### 4.2 Veto Nocturno por Condensación y Rocío Natural (1 Hora)
* **Propósito**: Cancelar el riego de aspersión nocturno/madrugada si se detecta una llovizna persistente o si la madrugada está saturada, previniendo hongos y asfixia radicular.
* **Regla**: Evalúa si se registraron al menos 6 horas (bloques de 1h) continuas con humedad relativa exterior promedio $\ge 98.0\%$.
* **Justificación Técnica**:
  - Durante la noche y madrugada, el enfriamiento de la atmósfera provoca que la humedad relativa ascienda gradualmente hasta llegar a la condensación natural (rocío a las 5:00 AM) sin necesidad de que ocurra precipitación.
  - Para evitar que la condensación natural vete falsamente el riego programado, el umbral nocturno se mantiene en un nivel sumamente estricto del **$\ge 98.0\%$** y exige persistencia prolongada (6 horas), distinguiendo el rocío natural (aumento gradual) de la saturación por lloviznas (saturación rápida y caída térmica abrupta).

---

## 5. Datos Empíricos de la Auditoría Climática (30 Días de Historial)

La calibración de los umbrales del motor de inferencia se basó en el análisis estadístico sin sesgos de 42,629 muestras de InfluxDB y 45 eventos de lluvia de Postgres registrados en Caracas (UTC-4) entre mayo y junio de 2026. Los promedios reales de humedad relativa y temperatura por ventana diurna y categoría climática se resumen a continuación:

### 5.1 Ventana 1: 7:00 AM - 11:00 AM (Previo a Humectación 11 AM)
* **Días Secos**: **73.8% HR** (Mín: 60.2% - Máx: 94.9%) | Temp: **32.6°C**
* **Durante la Lluvia (Solapada)**: **83.5% HR** (Mín: 75.6% - Máx: 91.1%) | Temp: **30.6°C**
* **Después de la Lluvia**: **81.4% HR** | Temp: **31.2°C**
* **Antes de la Lluvia**: **75.6% HR** | Temp: **32.9°C**

### 5.2 Ventana 2: 11:00 AM - 3:00 PM (Previo a Humectación 3 PM)
* **Días Secos**: **58.5% HR** (Mín: 49.9% - Máx: 98.5%) | Temp: **37.4°C**
* **Durante la Lluvia (Solapada)**: **74.1% HR** (Mín: 57.7% - Máx: 89.6%) | Temp: **33.8°C**
* **Después de la Lluvia**: **62.4% HR** (Mín: 53.3% - Máx: 75.9%) | Temp: **36.6°C**
* **Antes de la Lluvia**: **57.4% HR** | Temp: **36.5°C**

### 5.3 Ventana 3: 12:00 PM - 4:00 PM (Previo a Humidificación 4 PM)
* **Días Secos**: **58.0% HR** (Mín: 49.0% - Máx: 98.2%) | Temp: **37.4°C**
* **Durante la Lluvia (Solapada)**: **80.1% HR** (Mín: 60.7% - Máx: 93.6%) | Temp: **31.7°C**
* **Después de la Lluvia**: **62.3% HR** (Mín: 53.5% - Máx: 75.3%) | Temp: **36.1°C**
* **Antes de la Lluvia**: **60.6% HR** | Temp: **34.7°C**

---

## 6. Plan de Acción (Hoja de Ruta de Ingeniería)

Este es el roadmap accionable a integrar en el `todos.md` (Fase 3):

- **Fase 3.2.1: Estabilización de Datos en Vivo (Smooth Data):**
  - Modificar las consultas de la API en el backend para que devuelvan promedios (SMA) de la última ventana temporal (ej. 15 min), en vez del dato crudo absoluto.
- **Fase 3.2.2: Implementación de VPD (Vapor Pressure Deficit) y Reglas de Veto:**
  - Integrar el cálculo de VPD nocturno y diurno y acoplar el veto hídrico diurno móvil de 4h ($\ge 85\%$) y de rocío nocturno ($\ge 98\%$) en el backend del scheduler.
- **Fase 3.2.3: Worker de Agregación Diaria (CRON 23:55):**
  - Desarrollar el script backend que procese los miles de puntos diarios en InfluxDB, calculando DLI y DIF, y persistiendo los resultados en PostgreSQL (`DailyEnvironmentStat`).

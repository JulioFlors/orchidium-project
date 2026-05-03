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

## 4. Plan de Acción (Hoja de Ruta de Ingeniería)

Este es el roadmap accionable a integrar en el `todos.md` (Fase 3):

- **Fase 3.2.1: Estabilización de Datos en Vivo (Smooth Data):**
  - Modificar las consultas de la API en el backend para que devuelvan promedios (SMA) de la última ventana temporal (ej. 15 min), en vez del dato crudo absoluto, para nutrir las cards del frontend.
- **Fase 3.2.2: Implementación de VPD (Vapor Pressure Deficit):**
  - Crear función de cálculo de VPD e incluirlo en el payload hacia la base de datos o como dato derivado en la vista en tiempo real.
  - Actualizar UI para mostrar Dial/Gauge de VPD.
- **Fase 3.2.3: Worker de Agregación Diaria (CRON 23:55):**
  - Desarrollar el script backend que procese los miles de puntos diarios en InfluxDB.
  - Implementar ecuaciones de DLI (Lux -> PPFD -> Integral) y DIF.
  - Insertar los resultados procesados en la base de datos relacional para consultas de alto nivel (Gemelos Digitales y Diario Biológico).
- **Fase 3.2.4: Evolución del Frontend (Inteligencia sobre Gráficos):**
  - Ofrecer "Scorecards" diarios: "El DLI de ayer fue 14 mol (Perfecto para Cattleyas)".
  - Transformar los gráficos de líneas espagueti históricos en Gráficos de Velas (Max/Min/Avg) o Bandas, como se definió en la Fase 4 de UX.

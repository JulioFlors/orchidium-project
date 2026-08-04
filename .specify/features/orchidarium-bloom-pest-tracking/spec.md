# Especificación SDD: Seguimiento de Floración y Avistamiento de Plagas en Orquideario

## 1. Visión General
Implementación de un sistema de registro rápido y análisis correlativo de eventos biológicos (floración y avistamiento de plagas) en la ruta `/orchidarium`. El objetivo es capturar la climatología promedio del último mes (30 días) para determinar condiciones inductoras de floración, estacionalidad, duración y frecuencia anual, así como factores ambientales predisponentes para el surgimiento de plagas.

## 2. Requerimientos Funcionales

### 2.1 Módulo de Floración
1. **Registro Rápido**: Formulario/modal optimizado en `/orchidarium` para registrar inicio de floración de una orquídea/planta.
2. **Inducción Climática a 30 Días**: Al guardar el evento, consultar automáticamente `DailyEnvironmentStat` de los últimos 30 días en la zona correspondiente y almacenar:
   - `tempDayAverage`, `tempNightAverage`
   - `humDayAverage`, `humNightAverage`
   - `difAtInduction` (Diferencial térmico día-noche)
   - `dliAtInduction` (Daily Light Integral acumulado)
   - `vpdAverage` (Déficit de presión de vapor promedio)
3. **Cierre de Floración y Duración**: Permitir marcar el fin de la floración y calcular la duración exacta en días.
4. **Métricas Biológicas**:
   - **Época del año (Estacionalidad)**: Distribución de floraciones por mes del año por especie.
   - **Frecuencia Anual**: Conteo de eventos de floración por planta/especie en los últimos 365 días.
   - **Duración Promedio**: Días promedio que la flor se mantiene abierta antes de marchitarse.

### 2.2 Módulo de Avistamiento de Plagas
1. **Registro Rápido de Plagas**: Modal optimizado para seleccionar la plaga (o ingresar nueva), la zona, la severidad (LOW, MEDIUM, HIGH, CRITICAL) y opcionalmente la planta afectada.
2. **Correlación Ambiental a 30 Días**: Al registrar la plaga, capturar automáticamente las condiciones climáticas promedio de la zona durante los últimos 30 días (`avgTemp`, `avgHumidity`, `maxHumidityHours`, `avgDli`).
3. **Análisis de Predisposición**:
   - Conteo histórico total de avistamientos por plaga y zona.
   - Meses de mayor frecuencia de avistamiento por tipo de plaga.
   - Perfil de condiciones ambientales desfavorables / predisponentes (ej. alta humedad + temperatura moderada -> Botrytis/Hongos).

### 2.3 Interfaz de Usuario (`/orchidarium`)
1. **Accesos Rápidos (Quick Actions)**: Botones directos para "Registrar Floración" y "Reportar Plaga".
2. **Tarjetas de Estadísticas y Insights Botánicos**:
   - Promedio de duración de floración por especie.
   - Calendario/gráfico de floración por mes.
   - Historial de plagas y alerta de condiciones climáticas actuales favorables para plagas.
3. **Modales Responsivos**: Integración fluida en móvil y desktop sin desbordes.

## 3. Requerimientos No Funcionales
- **TypeScript**: Estricto (Sin `any`).
- **Imports**: Usar barriles de primer nivel (`@/components`, `@/actions`, `@/lib`).
- **Formato de Hora UI**: Formato 12 horas (`a. m.` / `p. m.`).
- **Estándar CSS**: Clases semánticas Tailwind (`bg-surface`, `text-primary`, `border-input-outline`).

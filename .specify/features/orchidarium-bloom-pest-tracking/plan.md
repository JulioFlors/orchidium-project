# Plan de Implementación SDD: Seguimiento de Floración y Avistamiento de Plagas

## 1. Arquitectura de Datos y Modificaciones al Esquema

### 1.1 Modelo `FloweringEvent`
Campos existentes: `startDate`, `endDate`, `dliAtInduction`, `difAtInduction`, `tempDayAverage`, `tempNightAverage`, `humDayAverage`, `humNightAverage`.
Nuevos campos o extensiones:
- `vpdAverageAtInduction` (Float?): VPD promedio del último mes de inducción.
- `inductionWindowDays` (Int @default(30)): Días de la ventana evaluada (30 días).

### 1.2 Modelo `PestSighting`
Campos existentes: `pestId`, `pestName`, `zone`, `severity`, `notes`, `capturedAt`, `plantId`.
Nuevos campos para correlación ambiental a 30 días:
- `avgTemp30d` (Float?)
- `avgHum30d` (Float?)
- `avgDli30d` (Float?)
- `highHumHours30d` (Float?)
- `notes` (String?)

## 2. Server Actions (`src/actions/operations/biological-actions.ts`)

1. **`registerFlowering`**:
   - Ajustar ventana de cálculo de climatología previa de 7 días a **30 días**.
   - Calcular promedios de `DailyEnvironmentStat`: `tempDayAverage`, `tempNightAverage`, `humDayAverage`, `humNightAverage`, `difAtInduction`, `dliAtInduction`, `vpdAverageAtInduction`.
2. **`registerPestSighting`**:
   - Calcular climatología promedio de los últimos 30 días en la zona del avistamiento.
   - Almacenar las métricas de correlación ambiental en el registro `PestSighting`.
3. **`getBiologicalAnalytics`**:
   - Conteo de floraciones anuales por especie y planta.
   - Duración promedio de floraciones cerradas.
   - Meses pico de floración (estacionalidad 1-12).
   - Conteo total de avistamientos de plagas por tipo y meses predisponentes.
   - Alertas climáticas de predisposición de plagas basadas en el clima actual vs histórico de avistamientos.

## 3. Componentes Frontend UI (`app/src/app/(orchidarium)/orchidarium/ui`)

1. **Modales de Registro**:
   - `FloweringModal.tsx`: Selector de zona/planta, notas opcionales, feedback explícito de registro exitoso.
   - `PestSightingModal.tsx`: Selector de plaga, zona, severidad, planta opcional y notas.
2. **Componentes de Visualización e Insights**:
   - `BotanicalInsightsGrid.tsx`: Métrica de estacionalidad, duración promedio de floración, tasa de floración anual, historial y frecuencia de plagas.
   - `BiologicalAuditPanel.tsx`: Eventos de floración activos con botón para "Finalizar Floración" (calculando duración final), y timeline de avistamientos recientes de plagas con badges de severidad.

## 4. Estrategia de Migración de Base de Datos
- Generación de migración limpia de Prisma (`pnpm prisma migrate diff`) con flag `-o`.
- Sin breaking changes destructivos (adición de columnas opcionales a `PestSighting` y `FloweringEvent`).

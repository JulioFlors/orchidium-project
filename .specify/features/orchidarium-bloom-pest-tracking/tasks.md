# Lista de Tareas SDD: Seguimiento de Floración y Avistamiento de Plagas

- [x] **Tarea 1: Actualización del Esquema Prisma y Migración**
  - [x] Agregar campos opcionales de correlación ambiental a `PestSighting` (`avgTemp30d`, `avgHum30d`, `avgDli30d`, `highHumHours30d`) y a `FloweringEvent` (`vpdAverageAtInduction`, `inductionWindowDays`).
  - [x] Generar migración SQL en `packages/database/prisma/migrations/`.
  - [x] Ejecutar `pnpm db:generate` / build client.

- [x] **Tarea 2: Optimización de Server Actions (`biological-actions.ts`)**
  - [x] Actualizar `registerFlowering` para calcular métricas climáticas promedio de los últimos 30 días.
  - [x] Actualizar `registerPestSighting` para capturar y guardar métricas climáticas de 30 días.
  - [x] Crear Server Action `getBiologicalAnalytics` para obtener estacionalidad, duración promedio de floración, tasa anual y predisposición de plagas.

- [x] **Tarea 3: Ajuste y Validación de Modales UI**
  - [x] Revisar `FloweringModal.tsx` y `PestSightingModal.tsx` para asegurar usabilidad móvil, sin `any`, imports barril `@/components`, y clases semánticas.

- [x] **Tarea 4: Implementación de Paneles de Analítica e Insights en `/orchidarium`**
  - [x] Integrar `BiologicalAnalyticsGrid.tsx` en `OrchidariumView.tsx`.
  - [x] Agregar visualización de duración de floraciones, épocas del año (estacionalidad) y frecuencia anual.
  - [x] Mostrar conteo de plagas registradas y condiciones climáticas desfavorables/predisponentes.

- [x] **Tarea 5: Verificación, Linting y Documentación**
  - [x] Ejecutar `pnpm lint` / `pnpm build` para verificar cero errores TypeScript/ESLint.
  - [x] Actualizar `commit.txt` con el changelog formatted en Conventional Commits.
  - [x] Generar `walkthrough.md` con los resultados.

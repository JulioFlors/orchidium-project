# Tareas: Corrección de Procesamiento de Métricas Diurnas y Nocturnas en el Scheduler

- [x] **Fase 3: Planificación y Aprobación**
  - [x] Crear especificación de la feature (`spec.md`)
  - [x] Crear plan de implementación (`plan.md`)
  - [x] Obtener aprobación del plan por parte del usuario

- [x] **Fase 4: Implementación Técnica**
  - [x] Implementar `getCaracasMidnight` en `telemetry-processor.ts`
  - [x] Actualizar `ZONE_LIMITS` y desagregar validación de muestras por ventana en `telemetry-processor.ts`
  - [x] Ajustar rangos horarios (`isDaytime` e `isNighttime`) en `telemetry-processor.ts`
  - [x] Ajustar lógica de cron y recuperación histórica en `index.ts`
  - [x] Ajustar lógica de backfill en `backfill-history.ts`

- [ ] **Fase 5: Validación y Cierre**
  - [x] Ejecutar backfill en modo `DRY_RUN` para verificar cálculos
  - [x] Aplicar backfill para los últimos 7 días y consolidar datos en Postgres
  - [x] Verificar consistencia de datos de día/noche en Postgres
  - [ ] Generar walkthrough y actualizar `todos.md`/`ROADMAP.md`

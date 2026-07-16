# Tareas: Corrección de Inferencia y Modularización de Lógica de Lluvia

- [x] **Fase 3: Planificación y Aprobación**
  - [x] Crear especificación de la feature (`spec.md`)
  - [x] Crear plan de implementación (`plan.md`)
  - [x] Obtener aprobación del plan y del nombre del archivo por parte del usuario

- [x] **Fase 4: Refactorización e Implementación Técnica**
  - [x] Crear el nuevo archivo para la lógica del sensor físico de lluvia (`drops-sensor-manager.ts`)
  - [x] Modificar `services/scheduler/src/lib/rain-manager.ts` para eliminar lógica física y corregir `pushBatchMetrics`
  - [x] Modificar `services/scheduler/src/index.ts` para redirigir las llamadas del sensor físico

- [ ] **Fase 5: Validación y Cierre**
  - [ ] Verificar el comportamiento de rotación de lotes en caliente
  - [ ] Validar la persistencia de eventos de lluvia física y lluvia inferida independientes
  - [ ] Ejecutar el script `rebuild-rain-history.ts` para verificar la consistencia de los datos históricos
  - [ ] Crear walkthrough de los cambios realizados

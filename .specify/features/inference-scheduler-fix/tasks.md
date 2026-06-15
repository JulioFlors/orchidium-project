# Checklist de Tareas: Reestructuración de Reglas Diarias, Gestión de Zonas y Corrección de Desfases del Scheduler

- [x] **Paso 1: Modificación de la hora de evaluación en `index.ts`**
  - [x] Localizar el cron de evaluación diaria de la máquina de estados en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts#L2008).
  - [x] Cambiar la regla a `50 5 * * *` para que se ejecute a las 05:50 AM America/Caracas.
- [x] **Paso 2: Corrección horaria y de zonas en `inference-engine.ts`**
  - [x] Localizar `getNext6am` en [inference-engine.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/inference-engine.ts#L1311).
  - [x] Modificar el retorno para forzar el slot de las 6:00 AM Caracas usando `.setUTCHours(10, 0, 0, 0)`.
  - [x] Localizar `createDeferredIrrigation` en [inference-engine.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/inference-engine.ts#L1320).
  - [x] Modificar el parámetro `zones` para que contenga únicamente `[ZoneType.ZONA_A]`.
- [x] **Paso 3: Depuración y eliminación del Límite de Emergencia**
  - [x] Localizar `evaluateDailyRules` en [inference-engine.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/inference-engine.ts#L1360).
  - [x] Eliminar por completo el bloque condicional del Límite de Emergencia (antiguas líneas 1377 a 1411).
- [x] **Paso 4: Robustecimiento de la Alternancia Interdiaria**
  - [x] Modificar la expresión `isDryAndSunny` en [inference-engine.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/inference-engine.ts#L1538) para que evalúe `rainToday.eventCount === 0`.
- [x] **Paso 5: Validación y compilación**
  - [x] Ejecutar compilador TypeScript del scheduler para verificar tipos.

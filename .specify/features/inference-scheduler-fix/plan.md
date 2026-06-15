# Plan de Implementación: Reestructuración de Reglas Diarias, Gestión de Zonas y Corrección de Desfases del Scheduler

Propuesta técnica para resolver las inconsistencias horarias, de asignación de zonas y comportamiento redundante en las reglas de inferencia de riego.

## Cambios Propuestos

### Componente: Scheduler (Backend)

#### [MODIFY] [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts)
- **Modificación de la hora de evaluación diaria**:
  - Cambiar el cron de `InferenceEngine.evaluateDailyRules()` de las 8:00 PM (`0 20 * * *`) a las **5:50 AM America/Caracas** (`50 5 * * *`).
  - Esto asegura que las tareas de emergencia o reprogramaciones se evalúen y programen minutos antes del slot estándar de riego de las 6:00 AM, usando el clima acumulado de la madrugada.

#### [MODIFY] [inference-engine.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/inference-engine.ts)
- **Corrección de `getNext6am`**:
  - Ajustar el cálculo de la fecha para evitar desfases de UTC. En lugar de usar `.setHours(6, 0, 0, 0)` en la hora local del servidor, calcular la fecha basándose en la hora de Caracas (UTC-4) traduciéndola a su equivalente exacto en UTC (`10:00:00.000Z`).
  ```typescript
  private static getNext6am(from: Date, daysAhead: number): Date {
    const target = new Date(from);
    target.setDate(target.getDate() + daysAhead);
    // 6:00 AM Caracas = 10:00 AM UTC (Caracas es UTC-4)
    target.setUTCHours(10, 0, 0, 0);
    return target;
  }
  ```
- **Corrección de `createDeferredIrrigation`**:
  - Modificar la asignación dura de zonas de aspersión. Reemplazar `[ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D]` por únicamente `[ZoneType.ZONA_A]`.
- **Eliminación completa del "Límite de Emergencia"**:
  - Remover por completo la sección del límite de emergencia de 3 días consecutivos sin riego completo de `evaluateDailyRules`.
- **Robustecimiento de la Alternancia Interdiaria**:
  - Cambiar la condición de `isDryAndSunny` para que requiera estrictamente que `rainToday.eventCount === 0`.
  - Si existió **cualquier** evento de lluvia registrado hoy (aunque haya sido breve), no se considerará seco/soleado para alternancia y se suspenderá el riego diferido de mañana.

---

## Plan de Verificación

### Pruebas Manuales
1. Ejecutar el compilador TypeScript en el backend del scheduler para verificar la ausencia de errores de tipos:
   ```bash
   pnpm --filter scheduler exec tsc --noEmit
   ```
2. Realizar un smoke test simulando la ejecución de `evaluateDailyRules()` con marcas de tiempo personalizadas para asegurar que la tarea diferida se inserte con fecha de las 10:00:00 UTC (6:00 AM Caracas) y únicamente en la zona `ZONA_A`.

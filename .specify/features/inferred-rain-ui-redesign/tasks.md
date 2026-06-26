# Checklist de Tareas: Reconstrucción Híbrida de Lluvia y Corrección de Métricas de Inferencia

## Fase 1: Planificación y Diseño (SDD)
- [x] Analizar discrepancias de baseline en los logs y tooltip.
- [x] Crear especificación funcional y técnica (`spec.md` y `plan.md`).

## Fase 2: Desarrollo del Script de Reconstrucción
- [x] Crear el script de utilidad [rebuild-rain-history.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/scripts/rebuild-rain-history.ts).
- [x] Implementar la simulación de colas y batches con el motor de inferencia de lluvia diurna/nocturna sobre el histórico de InfluxDB.
- [x] Implementar el agrupamiento y cooldown de 15 minutos para la lluvia física.
- [x] Validar guardado mediante upsert en PostgreSQL de forma resiliente.

## Fase 3: Ajustes en el Scheduler
- [x] Cambiar el texto `"en 30m"` por `"en 10m"` en `index.ts`.
- [x] Cambiar la variable `baselineAgeMinutes` a `10` en `index.ts`.

## Fase 4: Frontend y Visualización
- [x] Ajustar el renderizado en `EnvironmentDataChart.tsx` para usar `baselineAgeMinutes` de forma dinámica.

## Fase 5: Verificación
- [x] Ejecutar build de prueba.
- [ ] Validar script localmente.


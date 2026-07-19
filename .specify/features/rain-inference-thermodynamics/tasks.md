# Tareas: Motor de Inferencia Meteorológica y Frontend de Monitoreo

- [ ] Modificar `services/scheduler/src/lib/rain-manager.ts` para reintroducir el Paso 3 de inferencia diurna.
- [ ] Cambiar la inferencia nocturna a `NIGHT_10M` en `rain-manager.ts`.
- [ ] Renombrar `THERMAL_SOLAR_RECOVERY` a `PROGRESSIVE_RECOVERY` en `rain-manager.ts` y quitar el emoji de `SOLAR_RECOVERY`.
- [ ] Modificar `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx` para soportar `NIGHT_10M`, `PROGRESSIVE_RECOVERY`, `_30M` y unificar los nombres/emojis de cese.
- [ ] Corregir la lógica de `closeIcon` y los textos/emojis duplicados del subtítulo de `SOLAR_RECOVERY` en `EnvironmentDataChart.tsx`.
- [ ] Modificar `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/InferredRainGuide.tsx` para documentar el Paso 3, `NIGHT_10M` y usar el término "Recuperación Progresiva".
- [ ] Refactorizar `services/scheduler/src/scripts/rebuild-rain-history.ts` para reintroducir el Paso 3 y usar `PROGRESSIVE_RECOVERY` y `NIGHT_10M`.
- [ ] Agregar métricas de efectividad de reglas/ramas en `rebuild-rain-history.ts` y reportarlas al finalizar.
- [ ] Ejecutar simulación local y validar la consistencia.

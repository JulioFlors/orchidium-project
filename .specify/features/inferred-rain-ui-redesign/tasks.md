# Checklist de Tareas: Rediseño de la UI de Lluvia Inferida

## Fase 1: Modificación del Scheduler
- [ ] Implementar el cálculo exacto de la caída relativa de luz diurna en porcentaje (`dropPct`) en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts).
- [ ] Implementar el acotamiento del umbral de recuperación de iluminancia (`luxRecoveryThreshold`) entre un piso de 16,000 lx y un techo de 26,000 lx en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts).
- [ ] Actualizar los strings de `triggerReason` para inyectar los deltas, tiempos exactos de 30m, e iluminancia detallada en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts).
- [ ] Actualizar el string de `closeReason` para inyectar la iluminancia final, el umbral exacto y el porcentaje $\alpha$ de recuperación de la caída de luz en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts).
- [ ] Compilar y verificar el Scheduler (`pnpm --filter scheduler run build`).

## Fase 2: Enriquecimiento del Tooltip en el Frontend
- [ ] Modificar `TooltipItem` en [EnvironmentDataChart.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx) para admitir `null`.
- [ ] Implementar la función de formato `getCaracasYMD` en [EnvironmentDataChart.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx).
- [ ] Ajustar `formatTooltipHeader` en [EnvironmentDataChart.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx) para usar "Hoy" y "Ayer" de forma relativa a Caracas.
- [ ] En `CustomTooltip` de [EnvironmentDataChart.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx), agregar la sección "Condiciones Climáticas Previas (45 min antes)" y los motivos en español si `data.isVirtual` es verdadero.

## Fase 3: Refactorización del Panel Principal
- [ ] Modificar [MonitoringView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/MonitoringView.tsx) para remover la importación de `RainCrossoverChart`.
- [ ] Eliminar la variable de estado `selectedEventId` y la consulta de telemetría de InfluxDB `eventTelemetryResponse`.
- [ ] Definir el estado `isInfoOpen` para la guía explicativa colapsable.
- [ ] Modificar `getChartProps()` en [MonitoringView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/MonitoringView.tsx) para dar soporte a `'rain_inferred'` con tipo barra, color púrpura y el mapeo en `customData` de baselines y motivos.
- [ ] Remover el bloque condicional JSX `selectedMetric === 'rain_inferred'` en [MonitoringView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/MonitoringView.tsx).
- [ ] Configurar `allowedRanges` para `rain_inferred` al invocar `EnvironmentDataChart` en [MonitoringView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/MonitoringView.tsx).
- [ ] Inyectar la guía colapsable **"Guía de Interpretación de Lluvia Inferida"** al final de [MonitoringView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/MonitoringView.tsx) si `selectedMetric === 'rain_inferred'`.

## Fase 4: Limpieza y Eliminación de Código Obsoleto
- [ ] Quitar la exportación de `RainCrossoverChart` en el [index.ts](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/index.ts) de componentes.
- [ ] Eliminar físicamente el archivo `app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/RainCrossoverChart.tsx`.

## Fase 5: Verificación
- [ ] Correr la compilación de Next.js en la carpeta `app` (`pnpm --filter app run build`).
- [ ] Ejecutar el linter en la carpeta `app` (`pnpm --filter app run lint`).
- [ ] Registrar la finalización del sprint en `commit.txt` en español.

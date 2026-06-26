# Plan Técnico de Implementación: Reconstrucción Híbrida de Lluvia y Corrección de Métricas de Inferencia

Este plan detalla el diseño del nuevo script `rebuild-rain-history.ts` y las correcciones a realizar en el scheduler y frontend para solventar las discrepancias de tiempos y visualización en la inferencia de lluvia.

---

## Cambios Propuestos

### 1. Script de Reconstrucción de Historial: `rebuild-rain-history.ts`
#### [NEW] [rebuild-rain-history.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/scripts/rebuild-rain-history.ts)
- Creación del script en la carpeta de scripts del planificador.
- Implementación de consultas segmentadas a InfluxDB por bloques de 5 días.
- Lógica de simulación secuencial:
  - Leer series temporales de `temperature`, `humidity`, e `illuminance` de la zona `EXTERIOR`.
  - Agrupar datos en lotes de 15 minutos (para simular la misma granularidad y velocidad que la ingesta real del scheduler).
  - Población de buffers temporales deslizantes.
  - Al detectarse las condiciones delta del motor de inferencia, crear y abrir virtualmente el evento.
  - Evaluar condiciones de cierre sobre los batches subsiguientes y guardar el registro final en Postgres mediante upsert.

### 2. Modificaciones en el Scheduler (`index.ts`)
#### [MODIFY] [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts)
- Cambiar la definición de `baselineAgeMinutes` de `20` a `10`.
- Cambiar el texto de `triggerReason` en la inferencia diurna y nocturna para reemplazar la mención estática de `"en 30m"` por `"en 10m"`.

### 3. Modificaciones en el Frontend
#### [MODIFY] [EnvironmentDataChart.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(monitoring)/monitoring/ui/components/EnvironmentDataChart.tsx)
- Asegurar que el renderizado condicional del tooltip lea `data.baselineAgeMinutes` dinámicamente y no use un valor estático por defecto si está presente en el payload.

---

## Plan de Verificación

### Pruebas Automatizadas
- Compilar el Scheduler:
  ```powershell
  pnpm --filter scheduler build
  ```
- Ejecutar el script en modo Dry Run (`BACKFILL_DRY_RUN=true`):
  ```powershell
  npx dotenv-cli -e ../../.env -- pnpm tsx services/scheduler/src/scripts/rebuild-rain-history.ts
  ```

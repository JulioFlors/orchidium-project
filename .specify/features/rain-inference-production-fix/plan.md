# Plan de Implementación: Corrección de Inferencia y Modularización de Lógica de Lluvia

Este plan detalla la extracción de la lógica del sensor físico de gotas a un archivo independiente y la corrección del bug de deslizamiento temporal en las colas climáticas del motor de inferencia.

## 1. Modificaciones Propuestas

### [NEW] `services/scheduler/src/lib/physical-rain-manager.ts`
*(Nota: El nombre del archivo se seleccionará a partir de las alternativas propuestas)*

Este archivo encapsulará toda la lógica del sensor físico de lluvia (gotas):
1. **Variables de Estado Privadas**:
   - `physicalRainActive`, `physicalRainOverridden`, `physicalRainStartedAt`, `lastPhysicalVetoAt`, `openPhysicalRainEventId`, `physicalBaselineLux`, `physicalBaselineTemp`, `physicalBaselineHum`, `physicalIsWaitingForBaselineFallback`.
2. **Funciones Exportadas**:
   - `handlePhysicalRainState(state: string, rainTimestamp: Date): Promise<void>`
   - `evaluatePhysicalRainVeto(lux: number, temp: number, hum: number): Promise<void>`
   - `checkRainOrphanTimeout(): Promise<void>`
   - `isPhysicalRainActive(): boolean`: Retorna `physicalRainActive && !physicalRainOverridden`.
   - `getPhysicalRainStatusSummary()`: Retorna un objeto con el estado actual para depuración.
   - `hydratePhysicalState()`: Carga el evento físico huérfano desde Postgres al arrancar.

### [MODIFY] `services/scheduler/src/lib/rain-manager.ts`

Este archivo se centrará **exclusivamente** en la inferencia termodinámica:
1. **Remoción de Lógica Física**:
   - Eliminar todas las variables de estado físico y las funciones asociadas (`handlePhysicalRainState`, `evaluatePhysicalRainVeto`, `checkRainOrphanTimeout`).
2. **Integración con el Módulo de Lluvia Física**:
   - Importar `isPhysicalRainActive` y `getPhysicalRainStatusSummary` desde el nuevo archivo.
   - Ajustar `isCurrentlyRaining()` para que combine la inferencia local con la llamada a `isPhysicalRainActive()`.
   - Ajustar `hydrateState()` para que delegue la hidratación física en `hydratePhysicalState()`.
3. **Corrección de Acumulación en `pushBatchMetrics`**:
   - Cambiar el límite de acumulación del lote de `5 * 60 * 1000` a `10 * 60 * 1000`.
   - Eliminar la línea `queue[0].timestamp = now` dentro de la condición de anexado para evitar el bug de deslizamiento infinito.

### [MODIFY] `services/scheduler/src/index.ts`

1. **Ajustar Importaciones y Llamadas**:
   - Importar las funciones de lluvia física (`handlePhysicalRainState`, `evaluatePhysicalRainVeto`, `checkRainOrphanTimeout`) desde el nuevo archivo de sensor físico.
   - Ajustar las llamadas correspondientes en los callbacks MQTT (líneas 1061, 1107 y 1742) para que apunten al nuevo gestor físico en lugar de `RainManager`.

---

## 2. Plan de Verificación

### Pruebas de Compilación y Tipado
- Verificar que el scheduler compile sin errores de TypeScript (`pnpm build`).
- Asegurar que no se use `any` en las nuevas definiciones de funciones.

### Pruebas de Simulación en Local
- Simular la llegada de telemetría de ráfagas para verificar que los lotes en caliente de `rain-manager.ts` roten correctamente cada 10 minutos en lugar de acumularse infinitamente.
- Simular mensajes MQTT de lluvia física (`Raining` / `Dry`) para comprobar que el nuevo archivo de sensor físico abra y cierre los eventos correctamente en Postgres.

### Pruebas de Reconstrucción Histórica
- Ejecutar el script `rebuild-rain-history.ts` para verificar la estabilidad de la inferencia en históricos.

# Feature Specification: Reconstrucción Híbrida de Lluvia y Corrección de Métricas de Inferencia

Esta especificación detalla la planificación del desarrollo de un script unificado de reconstrucción de lluvia histórica (física y virtual inferida) desde InfluxDB hacia PostgreSQL y la resolución de la visualización estática incorrecta de "Condiciones climáticas hace 20min" y notas fijas de "en 30min" en los metadatos de los eventos virtuales.

---

## Contexto y Diagnóstico

### 1. Reconstrucción Histórica Resiliente (Peligro de Sembrado)
Actualmente, el comando `db:seed` limpia la base de datos PostgreSQL. Esto causa la pérdida de todos los eventos de lluvia histórica guardados en `RainEvent`.
- **Lluvia Física**: Se puede reconstruir consultando las series temporales de la variable `rain_intensity` en InfluxDB mediante un algoritmo de agrupamiento y cooldown de 15 minutos (ya planteado parcialmente en `backfill-rain-events.ts`).
- **Lluvia Inferida (Virtual)**: No existe un script que la reconstruya. Dado que InfluxDB conserva todo el historial de Temperatura, Humedad e Iluminancia, es perfectamente factible re-correr el algoritmo del `InferenceEngine` de forma retroactiva sobre los datos de InfluxDB para regenerar e insertar los `RainEvent` virtuales (`isInfered: true`) con sus respectivos baselines (`baselineTemp`, `baselineHum`, `baselineLux`), `triggerReason` y `closeReason`.

### 2. Discrepancia del Desfase de Inferencia
En el tooltip de la interfaz de usuario se aprecian dos anomalías críticas:
1. **Condiciones climáticas hace 20min**: Esta etiqueta en el frontend es estática o semicargada basada en `baselineAgeMinutes`. Sin embargo, la lógica de inicio del Scheduler calcula la diferencia de los parámetros utilizando lotes históricos con un desplazamiento real del buffer de **10 minutos** atrás (lotes 2 y 3, que representan 10 min de acumulado por lote del nodo exterior).
2. **Mensaje Fijo "en 30min"**: En el Scheduler (`index.ts`), el texto de `triggerReason` inyecta `"en 30m"` de forma hardcoded en frases como:
   `Inferencia de Día: Incremento de +22.4% HR y caída térmica de -8.5°C en 30m...`
   Esto es incorrecto ya que el buffer de datos analizado no es de 30 minutos fijos sino dinámico según la ventana real de los batches del nodo exterior (10 minutos reales).

---

## Requerimientos

### 1. Script Unificado de Reconstrucción: `rebuild-rain-history.ts` [NEW]
- **Operación**: Leer secuencialmente datos de InfluxDB en bloques de 5 días para evitar desbordar la memoria o el límite del query engine.
- **Doble Flujo**:
  1. **Flujo Físico**: Agrupar lecturas de `rain_intensity > 0` en el nodo `EXTERIOR`. Si pasan más de 15 minutos sin detección de intensidad, cerrar el evento, calcular la duración y hacer upsert en `RainEvent` con `isInfered: false` y `closedBy: 'REBUILD_SCRIPT'`.
  2. **Flujo Virtual (Inferencia Retroactiva)**: 
     - Instanciar colas deslizantes de batches (`tempBatches`, `humBatches`, `luxBatches`) simulando la ingesta secuencial de 10 minutos.
     - Ejecutar las mismas reglas lógicas de disparo (`deltaHum >= 12.0 && deltaTemp <= -3.0` de día con caída de iluminancia, o `deltaHum >= 10.0 && deltaTemp <= -2.0` de noche) sobre los datos históricos de InfluxDB.
     - Al detectar una transición de lluvia inferida abierta, registrar los baselines y buscar de forma retroactiva su cese por retorno de baselines, despeje solar adaptativo acotado (16k - 26k lx), atascamiento térmico o timeout absoluto.
     - Registrar y hacer upsert en `RainEvent` con `isInfered: true` poblando los campos de baseline y motivos.

### 2. Sincronización y Corrección de Metadatos de Inferencia
- **Corrección en el Scheduler**:
  - Reemplazar las referencias de baseline de `"en 30m"` por `"en 10m"` en los strings de `triggerReason` inyectados en [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts) para coincidir con el lapso real de los lotes.
  - Ajustar `baselineAgeMinutes` a exactamente `10` en las llamadas a `openRainEvent` para que el frontend renderice `"Condiciones climáticas hace 10min"` de forma dinámica y real.

---

## Criterios de Aceptación
- La ejecución de `rebuild-rain-history.ts` debe regenerar tanto los eventos físicos como los virtuales en Postgres a partir del histórico completo de InfluxDB.
- Los nuevos eventos inferidos creados en Postgres deben almacenar `baselineAgeMinutes: 10`.
- El tooltip del frontend de la Lluvia Inferida debe mostrar dinámicamente `"Condiciones climáticas hace 10min"`.
- Los textos de inicio del evento no deben contener la cadena estática incorrecta `"en 30m"`.

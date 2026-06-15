# Plan de Implementación: Rediseño de la UI de Lluvia Inferida

Este documento detalla el plan técnico para refactorizar la visualización de la lluvia inferida, reemplazando la interfaz compleja por la gráfica de barras del componente `EnvironmentDataChart`, enriqueciendo el tooltip con metadatos específicos en español, calibrando los umbrales de recuperación solar del Scheduler y habilitando una guía colapsable con las reglas de inferencia.

---

## Cambios Propuestos

### 1. Scheduler (`services/scheduler/src/index.ts`)
- ** triggerReason (Inicio)**:
  - En la inferencia de día (línea 2448), calcular la caída relativa de iluminancia en porcentaje:
    ```typescript
    const dropPct = currentBaselineLux > 0 ? ((currentBaselineLux - lux) / currentBaselineLux) * 100 : 0;
    ```
  - Guardar el trigger con el porcentaje de caída y los valores reales:
    ```typescript
    `Inferencia de Día: Incremento de +${deltaHum30.toFixed(1)}% HR y caída térmica de ${deltaTemp30.toFixed(1)}°C en 30m (iluminancia cayó un ${dropPct.toFixed(0)}% a ${Math.round(lux).toLocaleString()} lx).`
    ```
- **closeReason (Cierre)**:
  - En el cierre por recuperación solar diurna (línea 2571), aplicar el acotamiento adaptativo:
    ```typescript
    let luxRecoveryThreshold = minLux + alpha * (preLux - minLux);
    // Acotar el umbral entre 16,000 lx (piso de cese de lluvia) y 26,000 lx (techo de nublado normal)
    luxRecoveryThreshold = Math.max(16000, Math.min(26000, luxRecoveryThreshold));
    ```
  - Guardar el motivo de cierre incluyendo el umbral acotado y el porcentaje $\alpha$ de recuperación:
    ```typescript
    `Despeje solar: iluminancia subió a ${Math.round(lux).toLocaleString()} lx (superó el umbral adaptativo de ${Math.round(luxRecoveryThreshold).toLocaleString()} lx, requiriendo un ${Math.round(alpha * 100)}% de recuperación de la caída de luz de ${Math.round(preLux - minLux).toLocaleString()} lx).`
    ```

### 2. Enriquecimiento del Tooltip en `EnvironmentDataChart.tsx`
- **Tipado de Tooltip**:
  - Modificar `interface TooltipItem` para que admita `null` en la propiedad `payload`:
    ```typescript
    interface TooltipItem {
      payload: Record<string, string | number | boolean | null | undefined>
      dataKey: string
      value: string | number
    }
    ```
- **Formato Horario en Cabecera (`formatTooltipHeader`)**:
  - Implementar una comparación basada en el huso horario de Caracas (`America/Caracas`) para determinar si la fecha del evento corresponde a **"Hoy"** o **"Ayer"**.
  - Si es hoy ➔ `Hoy, hh:mm a. m.` / `p. m.`
  - Si es ayer ➔ `Ayer, hh:mm a. m.` / `p. m.`
  - En otros casos ➔ `Día, DD Mes, hh:mm a. m.` / `p. m.`
- **Sección de Metadatos de Lluvia Inferida**:
  - En `CustomTooltip`, si `data.isVirtual` es verdadero, renderizar una sección estructurada:
    - **Condiciones Climáticas Previas (45 min antes)**: Temperatura, Humedad, Iluminancia (formateando los Lux con sufijo `k lx` si es $\ge 1000$ o `lx` en caso contrario).
    - **Inferencia de Inicio**: Mapear `data.triggerReason` (Causa de apertura).
    - **Inferencia de Cierre**: Mapear `data.closeReason` (Causa de cierre).

### 3. Refactorización de `MonitoringView.tsx`
- **Eliminar Variables de Telemetría Cruzada**:
  - Eliminar el estado `selectedEventId`, `setSelectedEventId` y la llamada `useSWR` de `eventTelemetryResponse`.
  - Crear un estado `isInfoOpen` de tipo booleano inicializado en `false` para controlar el colapso de la guía.
- **Actualizar `getChartProps()`**:
  - Añadir la rama `case 'rain_inferred'` para devolver la configuración púrpura (`#a855f7`), tipo de gráfico barra (`chartType: 'bar'`), y mapear los eventos inferidos (`ev.isVirtual`) poblando `customData`.
  - Inyectar en cada elemento de `customData` las propiedades `baselineTemp`, `baselineHum`, `baselineLux`, `triggerReason` y `closeReason` (usando `?? undefined` para normalizar los nulos).
- **Remover Condición JSX**:
  - Eliminar por completo el renderizado condicional de `selectedMetric === 'rain_inferred'` (anteriormente líneas 1081 a 1268).
- **Filtro de Rangos**:
  - En la renderización de `EnvironmentDataChart`, habilitar `allowedRanges` para `rain_inferred` (`['today', 'yesterday', '7d', '30d', 'all']`).
- **Guía Explicativa Colapsable**:
  - Si `selectedMetric === 'rain_inferred'`, inyectar al final del componente la tarjeta colapsable **"Guía de Interpretación de Lluvia Inferida"** explicando detalladamente la ventana deslizante de 30 minutos, los deltas de inicio, la caída de iluminancia diurna, y los 4 criterios de cierre adaptativos (con los límites del umbral solar).

### 4. Limpieza de Código Obsoleto
- Remover `export * from './RainCrossoverChart'` en `components/index.ts`.
- Eliminar físicamente el archivo `components/RainCrossoverChart.tsx`.

---

## Plan de Verificación

### Pruebas de Compilación
- Ejecutar la compilación en desarrollo para asegurar la resolución de tipos de TypeScript y sintaxis de React/Node:
  ```powershell
  pnpm --filter app run build
  pnpm --filter scheduler run build
  ```

### Pruebas de Linter
- Ejecutar el linter para comprobar que cumple con el formateo de código unificado:
  ```powershell
  pnpm --filter app run lint
  pnpm --filter scheduler run lint
  ```

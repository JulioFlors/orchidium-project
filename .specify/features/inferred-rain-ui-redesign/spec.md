# Feature Specification: Rediseño de la UI de Lluvia Inferida y Enriquecimiento del Tooltip

Este documento define la especificación para unificar la visualización de la Lluvia Inferida (`rain_inferred`) con la estructura de las otras gráficas de variables ambientales en el panel de monitoreo, implementando un diseño de barras con un tooltip detallado en español que describa con precisión las condiciones de inicio y culminación del evento, y una guía de interpretación botánica/climática para las reglas de inferencia.

---

## Contexto y Motivación

La interfaz gráfica de lluvia inferida posee actualmente un panel asimétrico de doble columna y una gráfica de cruce (`RainCrossoverChart`) que no sigue el estándar visual del resto de las variables climáticas. Se requiere consolidar esta métrica usando la gráfica de barras de duraciones provista por el componente unificado `EnvironmentDataChart`, eliminando la gráfica de cruce obsoleta y el historial lateral de tarjetas.

Para conservar los metadatos analíticos clave que diferencian la lluvia inferida de la lluvia física, diseñaremos un tooltip enriquecido y preciso en español que reemplace descripciones genéricas por los valores y tiempos exactos calculados por el Scheduler.

Adicionalmente, al seleccionar la métrica de Lluvia Inferida, se habilitará una guía explicativa colapsable al final de la página que detalle las reglas matemáticas y climáticas de apertura y cierre que rigen el algoritmo de inferencia.

---

## Requerimientos

### 1. Consolidación de Gráfica
- **Componente**: La lluvia inferida se representará como una gráfica de barras de duraciones a pantalla completa a través de `EnvironmentDataChart` con color púrpura (`#a855f7`).
- **Eliminación**: Descartar por completo el panel de historial lateral y la gráfica cruzada de InfluxDB (`RainCrossoverChart`), reduciendo el consumo innecesario de consultas concurrentes.

### 2. Formato de Fechas en Cabecera del Tooltip
La cabecera del tooltip se adaptará según la antigüedad del evento (usando la zona horaria `America/Caracas`):
- **Hoy**: Si el evento ocurrió hoy, se mostrará `Hoy, hh:mm a. m.` / `p. m.` (ej. `Hoy, 8:00 a. m.`).
- **Ayer**: Si el evento ocurrió ayer, se mostrará `Ayer, hh:mm a. m.` / `p. m.` (ej. `Ayer, 8:00 a. m.`).
- **Otros días**: Si ocurrió en fechas anteriores, se mantendrá el formato largo `Día, DD Mes, hh:mm a. m.` / `p. m.` (ej. `Martes, 16 Junio, 8:00 a. m.`).

### 3. Contenido Científico y Tooltip en Español
- **Terminología**: Se usará el término explicativo en español: **"Condiciones Climáticas Previas (45 min antes)"** en lugar de "Condiciones Baseline" o "Línea de Base".
- **Metadatos Analíticos**:
  - **Condiciones Climáticas Previas (45 min antes)**: Valores de referencia previos al inicio del evento de Temperatura (`baselineTemp`), Humedad (`baselineHum`) e Iluminancia (`baselineLux`).
  - **Inferencia de Inicio (`triggerReason`)**: Texto del Scheduler que explica la causa del disparo de lluvia indicando el incremento/caída exacta y los minutos del buffer evaluados (ej. *"Inferencia de Día: Incremento de +12.0% HR y caída térmica de -3.0°C en 30m (iluminancia cayó un 76% a 10,200 lx)."*).
  - **Inferencia de Cierre (`closeReason`)**: Texto del Scheduler que explica el criterio de retorno de variables o sol adaptativo indicando el porcentaje de recuperación y el umbral exacto acotado (ej. *"Despeje solar: iluminancia subió a 18,200 lx (superó el umbral adaptativo de 16,500 lx, requiriendo un 38% de recuperación de la caída de luz de 48,000 lx)."*).

### 4. Calibración del Umbral de Recuperación Solar en el Scheduler
Para solucionar el error de exigir umbrales de recuperación astronómicos en días soleados (los cuales impiden inferir el cierre de lluvia de forma efectiva):
- **Cálculo de Recuperación**: El umbral adaptativo $L_{\text{recovery}}$ calculado por la fórmula elástica del Scheduler se acotará de forma estricta entre un **piso absoluto de 16,000 lx** (para asegurar el cese de la lluvia activa $\le 10$k lx y el nublado prominente $\le 15$k lx) y un **techo absoluto de 26,000 lx** (límite donde se considera nublado normal pero no lluvia).
- **Fórmula**:
  $$L_{\text{recovery\_acotado}} = \max\left(16000, \min\left(26000, L_{\text{recovery}}\right)\right)$$

### 5. Guía Explicativa de Inferencia
- **Interfaz**: Al seleccionar `rain_inferred` en el panel de monitoreo, se mostrará una tarjeta colapsable con título **"Guía de Interpretación de Lluvia Inferida"** al final de la página (similar al diseño usado en `/botanics` con `isInfoOpen`).
- **Detalle de Reglas**:
  - Explicar la ventana de análisis deslizante de 30 minutos del Scheduler.
  - Detallar los deltas de temperatura y humedad para el inicio de lluvia (tanto de día como de noche).
  - Explicar la caída de iluminancia relativa y su evaluación diurna.
  - Detallar las 4 reglas de cierre: Retorno a baselines, Despeje solar adaptativo (acotado entre 16,000 lx y 26,000 lx), Atascamiento de variables (60 min) y Timeout absoluto (120 min).

---

## Criterios de Aceptación

- La selección de la métrica de Lluvia Inferida en la interfaz debe renderizar únicamente la gráfica de barras del componente `EnvironmentDataChart`.
- El tooltip debe presentarse en formato de tarjeta flotante oscura premium, mostrando las condiciones previas (45 min antes), causa de apertura y causa de cierre si la barra corresponde a un evento virtual (`isVirtual: true`).
- Todas las marcas horarias deben cumplir con el formato estándar de 12 horas en minúsculas (`a. m.` / `p. m.`).
- El Scheduler debe inyectar a partir de ahora los porcentajes exactos de caída y el umbral de recuperación acotado en los motivos de base de datos.
- La guía explicativa debe colapsar y expandirse correctamente en el footer de la vista de monitoreo al tener seleccionada la lluvia inferida.

# Regla: Motor de Correlación Climática (Derivadas y Recuperación Dinámica)

Esta especificación detalla el diseño matemático y algorítmico del motor de correlación climática para la detección del inicio de lluvia, detección de lluvia persistente bajo sensores mojados (re-trigger) y recuperación adaptativa para el veto inteligente de lluvia en **PristinoPlant**.

---

## Leyenda de Variables y Parámetros

| Variable / Parámetro | Descripción | Unidad |
| :--- | :--- | :--- |
| $T$ o $T_{now}$ | Temperatura actual registrada en la zona exterior. | $^\circ\text{C}$ |
| $dT/dt$ | Derivada temporal de la temperatura calculada en una ventana de 15 minutos. | $^\circ\text{C/min}$ |
| $L$ o $L_{now}$ | Iluminancia actual registrada en la zona exterior. | $\text{lux (lx)}$ |
| $dL/dt$ | Derivada temporal de la iluminancia calculada en una ventana de 15 minutos. | $\text{lx/min}$ |
| $H$ o $H_{now}$ | Humedad relativa actual registrada en la zona exterior. | $\%$ |
| $dH/dt$ | Derivada temporal de la humedad relativa calculada en una ventana de 15 minutos. | $\%/\text{min}$ |
| $T_{pre}$ | Temperatura baseline previa a la lluvia (última lectura estable antes de iniciarse el evento). | $^\circ\text{C}$ |
| $T_{min}$ | Temperatura mínima histórica registrada durante el evento de lluvia activo. | $^\circ\text{C}$ |
| $L_{pre}$ | Iluminancia baseline previa a la lluvia (última lectura estable antes de iniciarse el evento). | $\text{lux}$ |
| $L_{min}$ | Iluminancia mínima histórica registrada durante el evento de lluvia activo. | $\text{lux}$ |
| $\alpha$ | Fracción dinámica de recuperación de iluminancia (dependiente de la severidad de la caída de luz). | Adimensional |
| $L_{recovery}$ | Umbral adaptativo calculado para declarar recuperación de iluminancia. | $\text{lux}$ |
| $T_{recovery}$ | Umbral adaptativo calculado para declarar recuperación de temperatura. | $^\circ\text{C}$ |

---

## Dos Tipos de Validación para Lluvia Exterior

Para evitar que lecturas inestables abran eventos falsos en la base de datos o que la humedad residual distorsione las métricas, se separan estrictamente dos conceptos:

### 1. Lluvia Activa Implícita (Veto en Tiempo Real)

* **Condición**: Humedad relativa exterior $H_{now} \ge 98.0\%$ en cualquier horario (día o noche), o promedio de humedad exterior en las últimas 3 horas $\ge 98.0\%$.
* **Efecto**: Activa inmediatamente el flag de lluvia en memoria (`isTelemetryRainActive = true`), aplicando vetos inmediatos a las tareas de riego y nebulización.
* **Comportamiento**: **NO abre ni registra un `RainEvent` en la base de datos** por sí sola. Esto evita registrar eventos de lluvia ficticios de larga duración debido a la humedad residual ambiental o del rocío.

### 2. Eventos Formales de Lluvia (`RainEvent` en Postgres)

* **Condición**: Solo se abren mediante la detección de transiciones dinámicas (derivadas cruzadas) detalladas en las reglas de abajo, o cuando el sensor de gotas físico se activa y es validado.
* **Efecto**: Registra un evento formal en Postgres con su `startedAt` y `endedAt`.
* **Uso**: La suma de las duraciones de estos eventos (`durationSeconds`) determina la **Lluvia Acumulada del Día** (necesaria para las reglas del riego interdiario).

---

## Detección y Apertura de `RainEvent` por Derivadas

El scheduler calcula las derivadas de 15 minutos ($dT/dt$, $dL/dt$, $dH/dt$) cada vez que llega un lote de telemetría del nodo `EXTERIOR`.

### 1. Ventana Diurna (Día Botánico: 8:00 AM - 4:00 PM)

Si `isCurrentlyRaining()` es `false`, se abre un nuevo `RainEvent` si se cumple una de las siguientes condiciones:

#### Caso A (Caída Drástica Cruzada)

Detección clásica de inicio de tormenta o chubasco rápido.

* **Temperatura**: $dT/dt \le -0.08^\circ\text{C/min}$ (caída $\ge 1.2^\circ\text{C}$ en 15m).
* **Iluminancia**: $dL/dt \le -1000\text{ lx/min}$ **O** Lux actual $L_{now} < 10,000\text{ lx}$.
* **Humedad**: $H_{now} \ge 98.0\%$ **O** $dH/dt \ge 0.2\%/\text{min}$ (alza $\ge 3\%$ en 15m).

#### Caso A.2 (Subida Rápida por Lote - Lluvia Inminente)

Durante el día botánico soleado, la humedad se mantiene usualmente en el rango de $55\% - 65\%$. Si entra un frente lluvioso repentino, la humedad asciende rápido.

* **Condición**: Un incremento neto de humedad $\Delta H \ge +10\%$ en 10-15 minutos (ej: entre 2 o 3 lotes), alcanzando un valor final de humedad $\ge 85.0\%$.

#### Caso B (Subida Abrupta de Humedad)

Entrada de frente de lluvia constante con cielo muy cubierto.

* **Humedad**: $dH/dt \ge 1.3\%/\text{min}$ (alza $\ge 20\%$ en 15m; ej: de $60\%$ a $80\%$).
* **Iluminancia**: Lux actual bajo ($L_{now} < 15,000\text{ lx}$).

#### Caso C (Lluvia sobre Terreno Húmedo / Clima Lluvioso Intermitente)

Permite detectar un segundo o tercer evento de lluvia en un día inestable donde la humedad ya venía estando muy alta, pero no llegaba a saturar al $98\%$, o había bajado levemente al escampar.

* **Condición**: La humedad exterior se ha mantenido durante **$\ge 20$ minutos continuos** en el rango $[90.0\%, 96.99\%]$ **Y** la lectura actual $H_{now}$ sube **$\ge 2.0\%$** con respecto a la lectura del lote anterior.

---

### 2. Ventana Nocturna (Noche/Madrugada: 4:01 PM - 7:59 AM)

Para abrir un `RainEvent` formal durante la noche se requiere la correlación cruzada estricta (AND lógico) de temperatura y humedad:

* **Humedad**: Pasa de $< 88\%$ a **$\ge 98.0\%$** (incremento de $\Delta H \ge +10\%$ en 15 minutos).
* **Y SIMULTÁNEAMENTE**
* **Temperatura**: Caída rápida de $dT/dt \le -0.067^\circ\text{C/min}$ (caída $\ge 1.0^\circ\text{C}$ en 15 minutos).

---

## Algoritmo Matemático de Recuperación Adaptativa (Fin de Lluvia)

Durante un evento de lluvia activo (`isTelemetryRainActive === true`), el scheduler realiza el seguimiento de las siguientes variables para determinar dinámicamente si la lluvia ha cesado:

1. **Fórmula de Recuperación de Iluminancia ($L_{recovery}$)**
   Definimos la fracción de recuperación requerida $\alpha$ en función de la caída relativa de luz:
   $$\alpha = 1.0 - 0.3 \cdot \min\left(1.0, \frac{L_{pre} - L_{min}}{L_{pre}}\right)$$
   
   El umbral de luxes para declarar recuperación es:
   $$L_{recovery} = L_{min} + \alpha \cdot (L_{pre} - L_{min})$$

2. **Fórmula de Recuperación Térmica ($T_{recovery}$)**
   La temperatura debe subir al menos la mitad de la caída registrada o un mínimo absoluto de $0.5^\circ\text{C}$:
   $$T_{recovery} = T_{min} + \max\left(0.5, 0.5 \cdot (T_{pre} - T_{min})\right)$$

3. **Condiciones de Despeje (Fin de Lluvia)**
   Se declara el fin de la lluvia si es de día (8:00 AM - 4:00 PM) y se cumplen simultáneamente:
   * $L_{now} \ge L_{recovery}$
   * $T_{now} \ge T_{recovery}$
   * Humedad exterior estable o en descenso: $H_{now} \le 95\%$ **Y** $dH/dt \le 0.05\%/\text{min}$.

**Acción**: Se apaga `isTelemetryRainActive = false`, se fuerza `isRainOverridden = true` (vetando el sensor de lluvia físico mojado) y se cierra el `RainEvent` en Postgres con su duración e intensidad promedio.

---

## Simulaciones Numéricas de los Casos de Detección

### Simulación Caso C (Lluvia Intermitente)

Un día inestable. La lluvia anterior paró, pero el ambiente sigue húmedo.

* **Historial de humedad exterior**:
  * $t = -20\text{m}$: $H = 92.0\%$ (Rango $[90, 96.99]$)
  * $t = -15\text{m}$: $H = 93.5\%$ (Rango $[90, 96.99]$)
  * $t = -10\text{m}$: $H = 91.0\%$ (Rango $[90, 96.99]$)
  * $t = -5\text{m}$: $H = 93.0\%$ (Rango $[90, 96.99]$)
  * $t = 0\text{m}$ (Lectura actual): $H = 95.5\%$ (Subida de $+2.5\%$ con respecto a $t = -5\text{m}$)
* **Evaluación**:
  * La humedad estuvo los últimos 20m en el rango $[90.0\%, 96.99\%]$ (CUMPLE).
  * La lectura actual subió $2.5\% \ge 2.0\%$ respecto al lote anterior (CUMPLE).
  * **Resultado**: **NUEVO RAINEVENT DISPARADO (Caso C)**. El scheduler registra el inicio de un evento de lluvia formal en base de datos.

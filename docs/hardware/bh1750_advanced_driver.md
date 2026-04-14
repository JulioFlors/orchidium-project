# Driver Avanzado BH1750: Rango Dinámico Extendido (MTreg)

Este documento detalla la implementación del motor de auto-escala para el sensor de iluminancia BH1750, diseñado para superar las limitaciones de saturación en entornos de exposición solar directa.

## 1. La Necesidad del Cambio

En PristinoPlant, la Estación Meteorológica Exterior está sujeta a condiciones de iluminación extremas. Durante el mediodía solar en zonas ecuatoriales o días de cielo despejado, la intensidad lumínica supera fácilmente los **60,000 - 80,000 lux**.

Sin embargo, el sensor BH1750 en su configuración estándar (utilizada por casi todas las librerías genéricas de MicroPython) tiene un techo físico rígido que impide monitorear estos picos de radiación, resultando en gráficas "achatadas" o saturadas.

## 2. Limitaciones de la Librería Original

La implementación original operaba bajo los siguientes parámetros fijos:

- **Modo:** `CONT_HIRES_1` (Resolución de 1 lux).
- **MTreg (Measurement Time Register):** Valor por defecto de **69**.
- **Fórmula:** `Lux = Lectura_Bruta / 1.2`.

### El problema de la saturación

Dado que el registro de datos del BH1750 es de 16 bits, el valor máximo entregable es `65,535`.
$$65,535 / 1.2 \approx \mathbf{54,612.5\ lux}$$

Cualquier valor de luz real por encima de ~54k lux provocaba que el sensor devolviera su valor máximo de registro, perdiendo toda la información del pico solar real.

## 3. Solución Técnica: Manipulación de MTreg

El BH1750 permite ajustar su **sensibilidad óptica** modificando el registro interno de tiempo de medición (`MTreg`). Este registro define el intervalo durante el cual el sensor integra fotones para producir la lectura digital.

Nuestra nueva librería (`lib/bh1750/__init__.py`) implementa la manipulación experta de este registro en dos pasos de I2C, permitiendo alterar el factor de conversión en tiempo real.

### Relación MTreg vs Rango

La sensibilidad es directamente proporcional al valor de `MTreg`.

- **A menor MTreg:** Menor sensibilidad, pero **mayor rango** de lectura.
- **A mayor MTreg:** Mayor sensibilidad (mejor precisión en baja luz), pero el sensor satura más rápido.

## 4. Lógica de Auto-Escalar (get_auto_luminance)

La función `get_auto_luminance()` actúa como un orquestador inteligente que decide la sensibilidad óptima antes de entregar el dato:

### Escenario A: Luz Estándar (MTreg=69)

El sensor comienza con su configuración base. Si la lectura es estable y menor a 40,000 lux, devuelve el dato directamente para mantener compatibilidad.

### Escenario B: Pleno Sol (MTreg=31) - Saturación Prevenida

Si el sensor detecta que se acerca al límite de saturación (>40k lux), automáticamente:

1. Reduce el `MTreg` al mínimo permitido por hardware (**31**).
2. El sensor ahora solo captura fotones durante un ~45% del tiempo original (31/69).
3. **Nuevo Máximo Teórico:**
   $$\text{Max} = (65,535 / 1.2) \times (69 / 31) \approx \mathbf{121,557\ lux}$$
Esto permite capturar la intensidad del sol directo sin saturar.

### Escenario C: Penumbra/Noche (MTreg=254) - Máxima Precisión

Si la luz es tenue (<100 lux), el driver:

1. Sube el `MTreg` al máximo (**254**).
2. Conmuta al modo `HIRES_2` (factor 2.0).
Esto permite una precisión excepcional en condiciones críticas de baja luz, útil para calibrar el estado `IS_SAMPLING_LUX` al anochecer.

## 5. Resumen de Capacidades

| Parámetro | Driver Original | Driver PristinoPlant (Auto) |
| :--- | :--- | :--- |
| **Rango Máximo** | 54,612 lux | **121,557 lux** |
| **MTreg** | Fijo (69) | Dinámico (31 a 254) |
| **Precisión Min** | 1 lux | 0.27 lux |
| **Uso Energético** | Continuo | **One-Shot (Ahorro RAM/CPU)** |
| **Retardos** | 180ms (Fijos) | Dinámicos (ajustados al MTreg) |

---

Documentación Técnica - PristinoPlant 2026

# Integración Técnica: Transductor de Presión (0-150 PSI)

Este documento describe el uso del manómetro electrónico para medir el rendimiento de la bomba y la salud del filtro de agua.

## 1. Conexión Eléctrica (ADC)

- **Transductor**: Sensor de presión de 3 cables (VCC=5V, GND, SIG).
- **Señal (SIG)**: Rango de 0.5V a 4.5V (Lineal).
- **ADC (ESP32)**: Se recomienda usar un divisor resistivo (Ej: 10K/20K) si el pin del ESP32 no tolera 5V.
- **Pin Firmware**: Pin analógico asignado en `main.py`.

## 2. Mapa de Conversión (ADC ➔ PSI)

El firmware utiliza la siguiente fórmula de transferencia basada en 12 bits (0-4095):

| Voltaje (V) | Valor ADC | Presión (PSI) | Notas |
| :--- | :--- | :--- | :--- |
| **0.5V** | ~400 | **0 PSI** | Cero absoluto (BOMBA OFF) |
| **2.5V** | ~2048 | **75 PSI** | Punto medio |
| **4.5V** | ~3700 | **150 PSI** | Máximo escalado |

### Ecuación de Firmware

`PSI = (raw_adc - 400) * (150 / 3300)`

## 3. Diagnóstico de Salud del Filtro (v0.8.5)

El sistema implementa una lógica de "Manómetro de Referencia" para detectar obstrucciones físicas.

### Lógica de Operación

1. **Detección Actuador ID 3 (PUMP)**: El diagnóstico solo se ejecuta cuando la bomba está `ON`.
2. **Cebado**: Se espera 15 segundos después del arranque para estabilizar la presión.
3. **Comparación**: La presión actual se compara con `FILTER_IDEAL_PRESSURE_PSI` (45 PSI por defecto).
4. **Eficiencia (%)**:
   - `Si Presión Actual >= 45 PSI` -> Salud 100%.
   - `Si Presión Actual < 45 PSI` -> Salud proporcional (ej. 30 PSI = 66%).

### Umbrales de Alerta

- **Óptimo**: > 80% (Sin cambios visibles en caudal).
- **Advertencia**: 70-80% (Filtro sucio, requiere revisión en pocos días).
- **Crítico**: < 70% (Filtro obstruido, riesgo de cavitación en la bomba).

## 4. Visualización en Dashboard

- **Tarjeta Presión**: Muestra la última lectura histórica (PSI).
- **Tarjeta Salud**: Muestra el porcentaje de eficiencia calculado durante el último ciclo de riego.

> [!CAUTION]
> Si la bomba está encendida pero no hay agua en el depósito, el sensor marcará ~0 PSI. El sistema interpretará esto como "Salud del Filtro 0%", lo cual sirve también como protección contra marcha en seco indirecta.

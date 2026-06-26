# Análisis: Relación Climática entre Sensores (Exterior vs. Interior)

Este documento analiza el comportamiento de temperatura y humedad de la madrugada del 25 de junio de 2026 (12:00 AM - 6:00 AM local VET) tras las lluvias sucesivas del 24 de junio, determinando las escalas y patrones equivalentes para el sensor interior del orquideario (DHT22 en garita).

---

## 📊 Datos de Telemetría Comparada (Madrugada 25/06)

Durante las 6 horas de la madrugada, los sensores registraron el siguiente comportamiento:

| Variable | Sensor Exterior (`EXTERIOR`) | Sensor Interior (`ZONA_A`) | Relación / Acoplamiento |
| :--- | :--- | :--- | :--- |
| **Temperatura** | 24.00°C $\rightarrow$ 22.80°C | 23.70°C $\rightarrow$ 23.00°C | Diferencia térmica de apenas $\approx 0.1^\circ\text{C} - 0.2^\circ\text{C}$. Acoplamiento térmico total. |
| **Humedad** | **100.0%** (Clavado continuo) | **91.2% $\rightarrow$ 91.8%** | El sensor interior no se satura al 100% por estar en garita, pero su rango estable de **~91.5%** equivale a la saturación total exterior. |

---

## 💡 Patrones y Escalas de Equivalencia

A partir del análisis de datos estancados post-lluvia, podemos establecer las siguientes equivalencias físicas para el sensor interior:

1. **Equivalencia de Saturación Nocturna (Condensación / Rocío)**:
   * **Exterior**: $\ge 98.0\%$ HR.
   * **Interior**: **$\ge 90.0\%$ HR** (el ~91.5% promedio de hoy representa saturación física total exterior).

2. **Equivalencia de Humedad Crítica Diurna (Vetos Diurnos)**:
   * **Exterior**: $\ge 85.0\%$ HR (umbral adaptativo diurno móvil de 4h).
   * **Interior**: **$\ge 80.0\%$ HR** (bajo la malla sombra, un valor diurno $\ge 80.0\%$ equivale a humedad crítica de lluvia/lluvia reciente).

3. **Inercia Térmica**:
   * En horario nocturno, la diferencia térmica entre el exterior y el interior del orquideario tiende a cero ($\Delta\text{Temp} \le 0.3^\circ\text{C}$) debido a la homogeneización del aire húmedo post-lluvia.

---

## 🚀 Próximos Pasos de Planificación

Para robustecer el motor de inferencia usando esta paridad de sensores, se proponen las siguientes tareas en el scheduler:

1. **Reglas de Fallback por Ausencia de Telemetría**:
   * Si el sensor exterior se desconecta o pierde telemetría, el sistema debe autocalibrarse para usar los datos del sensor interior aplicando la escala equivalente:
     * Para vetos nocturnos de Riego: Usar promedio interior **$\ge 90.0\%$** en lugar del 98% exterior.
     * Para vetos diurnos: Usar promedio interior **$\ge 80.0\%$** en lugar del 85% exterior.

2. **Alineación de Detección de Lluvia Inferida en el Interior**:
   * Estudiar si las caídas de temperatura durante lluvias diurnas en el interior también siguen la misma escala (ej. caídas de 3°C a 10°C de día) para poder inferir lluvias usando únicamente el nodo interior si fuera necesario.

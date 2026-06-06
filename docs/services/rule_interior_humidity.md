# Regla: Veto por Humedad Crítica del EMA Interior (Promedio de 3 Horas)

Esta especificación detalla el veto automático de tareas de humidificación y nebulización basado en el promedio continuo de humedad del EMA Interior (`ZONA_A`).

---

## Regla de Negocio

* **Condición de Veto**: Si el promedio de la humedad relativa interior (`interior.hum`) registrado en las últimas **3 horas** (`LOOKBACK_MINUTES_3H` $\ge 180$ minutos) es **mayor o igual al Umbral Dinámico de 3h**, se aplica un veto absoluto sobre las tareas de pulverización/humidificación (`HUMIDIFICATION`).
* **Umbrales Dinámicos**:
  * **Día Templado / Soleado** (promedio de lux desde 8:00 AM $\ge 26,000$ lx): El umbral es **$\ge 88.0\%$** (`HUMIDITY_VETO_3H_SUNNY`). Bajo sol, la evaporación es activa, y una humedad de 88% representa saturación relativa (por ejemplo, después de una lluvia).
  * **Día Nublado / Lluvioso** (promedio de lux desde 8:00 AM $< 26,000$ lx o sin datos / noche): El umbral es el estándar **$\ge 95.0\%$** (`HUMIDITY_VETO_3H_CLOUDY`).
* **Justificación Botánica**: Añadir agua en un ambiente saturado impidiese la transpiración de las orquídeas y propiciaría enfermedades fúngicas e infecciones.
* **Nebulización por Enfriamiento**: A pesar de que el día sea caluroso en el interior, si la humedad promedio acumulada de 3 horas ya supera el umbral dinámico, la nebulización de enfriamiento **será cancelada**. Con el aire saturado, las microgotas no se evaporan, por lo que no ejercen enfriamiento evaporativo en las hojas y solo causan goteo excesivo sobre las raíces.

---

## Diseño Técnico

En el motor de inferencia (`InferenceEngine.evaluate`), para rutinas con `purpose` de `HUMIDIFICATION`:

1. **Consulta de Historial InfluxDB**:
   - Query para obtener el promedio de los últimos 180 minutos de humedad en la zona `ZONA_A`:
     ```sql
     SELECT AVG(humidity) as avg_hum, COUNT(humidity) as count_hum
     FROM "environment_metrics"
     WHERE time >= now() - INTERVAL '180 minutes'
       AND source = 'Weather_Station'
       AND zone = 'ZONA_A'
     ```
2. **Evaluación de Veto**:
   - Si el promedio retornado es $\ge$ Umbral Dinámico:
     - Cancelar la ejecución (SKIP) reportando el veto.

---

## Parámetros

| Parámetro | Constante / Valor | Unidad |
| :--- | :--- | :--- |
| **Zona Evaluada** | `ZONA_A` (EMA Interior) | - |
| **Variable** | `humidity` | $\%$ |
| **Ventana Temporal** | `LOOKBACK_MINUTES_3H` (180) | minutos |
| **Umbral Veto (Soleado)** | `HUMIDITY_VETO_3H_SUNNY` (88.0%) | $\%$ |
| **Umbral Veto (Nublado)** | `HUMIDITY_VETO_3H_CLOUDY` (95.0%) | $\%$ |
| **Tareas Afectadas** | `HUMIDIFICATION` | - |


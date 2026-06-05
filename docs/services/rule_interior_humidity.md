# Regla: Veto por Humedad Crítica del EMA Interior (Promedio de 3 Horas)

Esta especificación detalla el veto automático de tareas de humidificación y nebulización basado en el promedio continuo de humedad del EMA Interior (`ZONA_A`).

---

## Regla de Negocio

* **Condición de Veto**: Si el promedio de la humedad relativa interior (`interior.hum`) registrado en las últimas **3 horas** ($\ge 180$ minutos) es **mayor o igual a 95.0%**, se aplica un veto absoluto sobre las tareas de pulverización/humidificación (`HUMIDIFICATION`) y humectación del suelo (`SOIL_WETTING`).
* **Justificación Botánica**: Añadir agua en un ambiente saturado (HR promedio $\ge 95\%$ en 3h) sobre-saturará el orquideario, impidiendo la transpiración de las orquídeas y propiciando enfermedades fungicidas e infecciones.
* **Nebulización por Enfriamiento**: A pesar de que el día sea caluroso en el interior, si la humedad promedio acumulada de 3 horas ya es $\ge 95\%$, la nebulización de enfriamiento **será cancelada**. Con el aire saturado, las microgotas no se evaporan, por lo que no ejercen enfriamiento evaporativo en las hojas y solo causan goteo excesivo sobre las raíces.

---

## Diseño Técnico

En el motor de inferencia (`InferenceEngine.evaluate`), para rutinas con `purpose` de `HUMIDIFICATION` o `SOIL_WETTING`:

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
   - Si el promedio retornado es $\ge 95.0\%$:
     - Retornar `{ shouldCancel: true, reason: "VETO HUMEDAD INTERIOR: Promedio 3h de ZONA_A (" + avg_hum.toFixed(1) + "%) >= 95% (Evitando exceso hídrico).", action: "SKIP" }`

---

## Parámetros

| Parámetro | Valor |
| :--- | :--- |
| **Zona Evaluada** | `ZONA_A` (EMA Interior) |
| **Variable** | `humidity` |
| **Ventana Temporal** | 180 minutos (3 horas) |
| **Umbral Promedio Veto** | $\ge 95.0\%$ |
| **Tareas Afectadas** | `HUMIDIFICATION`, `SOIL_WETTING` |

# Reglas del Motor de Inferencia (WeatherGuard v4)

El `InferenceEngine` actúa como la capa de protección (guardrail) antes de ejecutar cualquier tarea logística (riego o agroquímicos). Evalúa múltiples fuentes de datos para tomar una decisión informada, priorizando la telemetría local cruda sobre los pronósticos satelitales.

## 🛡️ Filosofía de Seguridad por Circuito

El sistema distingue entre tareas vitales (supervivencia) y tareas químicas (riesgo/coste):

1. **Circuito de Irrigación (Vital):**
    * **Fail-safe:** Ante fallos de telemetría o API, el riego **SIEMPRE** se ejecuta (mejor exceso de agua que deshidratación por un bug).
    * **Veto:** Solo se cancela si hay evidencia física e inapelable de lluvia real acumulada.
2. **Circuito de Agroquímicos (Riesgo):**
    * **Fail-safe:** Ante fallos de telemetría o API, la tarea **SE DETIENE** y solicita confirmación manual.
    * **Veto:** Requiere consenso total (Sensores + Pronóstico) para cancelar una tarea ya autorizada por el usuario.

---

## 🏗️ Protocolo de Agroquímicos (Doble Seguro)

Las tareas de `FUMIGATION` y `FERTIGATION` siguen un flujo de ejecución de dos pasos:

### Paso 1: Autorización del Usuario (12h antes)

* La tarea se pre-agenda 12 horas antes en estado `WAITING_CONFIRMATION`.

* **Sin autorización explícita, la tarea nunca se despacha.**
* Si no se confirma en un plazo de 24h desde la hora programada, la tarea pasa a `EXPIRED`.

### Paso 2: Veto Ambiental Automático (Momento de ejecución)

Incluso si el usuario autorizó la tarea, el motor puede vetarla justo antes de abrir las válvulas si detecta tormenta inminente.

**Lógica de Veto para Agroquímicos:**
Se cancela (`SKIP`) si se cumple:
`((Condición A OR Condición B) AND Condición C)`

* **Condición A (Lluvia Real):** Está lloviendo ahora o llovió en las últimas 4 horas (según sensor de gotas).
* **Condición B (Microclima Crítico):** El día pasó muy nublado (promedio < 20,000 lux) **Y** la Humedad Relativa es > 95%.
* **Condición C (Pronóstico Agresivo):** El consenso de APIs (OWM + OpenMeteo) indica una probabilidad de lluvia > 95%.

---

## 📡 Reglas de Evaluación y Pesos

### 1. Hard Blocks (Bloqueo Absoluto - Solo Irrigación/Hídricos)

* **Lluvia Física Detectada:** Si el sensor exterior reporta lluvia en curso o acumulada (>20 min en 12h).

* **Humedad Relativa Crítica (Interior):** Si `Hum > 90%` constante y el día es nublado/lluvioso.
* **Cancelación Manual:** Si existe un registro de cancelación manual del usuario para esa misma ventana horaria.

### 2. Validaciones Cruzadas (Refutación de APIs)

Para evitar "cielos de papel" (pronósticos que no ocurren):

* **Refutación por Insolación:** Si el pronóstico indica lluvia pero los sensores locales detectan sol intenso (`Lux > 50,000`) y temperatura alta, el riego **procede**.
* **Confirmación por Nubosidad:** Si el pronóstico indica lluvia y los sensores locales detectan oscuridad inusual (`Lux < 10,000`) y humedad saturada, el riego **se cancela**.

### 3. Ventanas Biológicas (Protección de Plantas)

* **Nebulización/Humidificación:** Máximo 3 minutos para evitar goteo excesivo de la línea. Se cancela si la temperatura es fresca (< 28°C) o el día es muy nublado, ya que la humedad ambiental es suficiente.

* **Salto Térmico (DIF):** Se monitorea el diferencial día/noche (5-8°C). Si no hay salto térmico y la humedad es alta (>85%), se genera alerta de riesgo epidemiológico.

---

## ⚙️ Configuración de Umbrales (Calibración 2026)

| Factor | Umbral | Aplicación |
| :--- | :--- | :--- |
| **Lluvia Acumulada** | > 1200s (20m) / 12h | Veto Riego |
| **Humedad Crítica** | > 90% HR | Veto Hídricos |
| **Día Nublado** | < 26,000 lux (promedio) | Veto Humidificación |
| **Tormenta Inminente** | > 95% Prob. API | Veto Agroquímicos |
| **HR Crítica (Agro)** | > 95% HR | Veto Agroquímicos (TODO: Calibrar) |

> [!NOTE]
> Toda cancelación realizada por el motor de inferencia queda registrada en el historial con el motivo detallado, permitiendo auditar por qué el "Oráculo" tomó dicha decisión.

# Especificación Técnica: Reglas del Motor de Inferencia de Lluvia

Este documento detalla el análisis físico-meteorológico, el funcionamiento a nivel de software y la validación empírica en campo para cada una de las reglas de control y toma de decisiones del motor de inferencia de lluvia de PristinoPlant.

---

## 1. Regla de Apertura Física (`PHYSICAL_SENSOR`)

### A. Razonamiento Físico y de Cooldown
El sensor físico de gotas de la estación meteorológica (`Weather_Station`) detecta de forma directa y capacitiva la presencia de agua líquida precipitándose sobre su superficie. A nivel termodinámico, el registro físico directo de gotas es la prueba indiscutible e inmediata de lluvia. 

Para evitar falsas aperturas y cierres (efecto *flapping* o vibración) causadas por el viento que mueve gotas residuales sobre el sensor una vez que la lluvia se ha detenido, la regla de apertura física opera en conjunto con un periodo de cooldown o histéresis obligatoria de **15 minutos** tras el último cierre del evento.

### B. Funcionamiento en el Código
Cuando llega un lote MQTT, el scheduler inspecciona el parámetro de intensidad física:

1. Si `rainIntensity > 0`:
   - Verifica si existe un evento de lluvia activo.
   - Si no hay evento activo, abre de inmediato un evento físico en Postgres con el origen `PHYSICAL_SENSOR`.
   - Inicializa los baselines climáticos con las muestras de telemetría de ese instante exacto.

### C. Validación de Campo
* **Caso de Estudio**: En los eventos del 24 de junio al mediodía (1:00 PM) y por la tarde (2:00 PM), el sensor de gotas registró de forma inmediata la precipitación, abriendo los eventos físicos en el segundo exacto del reporte MQTT sin esperar la acumulación de deltas climáticos.

---

## 2. Regla de Apertura Diurna por Gradiente Climático (`THERMAL_DROP_DAY`)

### A. Razonamiento Físico (Nubosidad y Clausius-Clapeyron)
Durante las horas del día botánico (8:00 AM - 4:00 PM), la radiación solar directa calienta la atmósfera del orquideario. La llegada de una tormenta rompe abruptamente esta dinámica debido a dos fenómenos físicos:

1. **Oclusión de Radiación (Nubosidad)**: Las nubes de lluvia absorben y dispersan la radiación solar entrante, provocando un desplome súbito de la iluminancia (lux).
2. **Choque Térmico e Hídrico**: Las gotas de lluvia se evaporan parcialmente al caer a través del aire cálido, extrayendo calor sensible del ambiente (enfriamiento evaporativo) y forzando la humedad relativa hacia la saturación de manera abrupta.

Para diferenciar esto de nubes pasajeras, la caída de iluminancia solar debe acompañarse de una caída de temperatura severa ($\le -3.0^\circ\text{C}$) y un alza de humedad ($\ge 10.0\%$ HR o saturación inmediata) en una ventana de 20 a 30 minutos.

**Caso Especial de Nubosidad Persistente ("Lluvia sobre mojado")**:
Si el cielo ya está encapotado por lluvias anteriores (iluminancia base $\le 10,000$ lx y temperatura fresca), es termodinámicamente inviable exigir un desplome de lux adicional o una caída de $-3.0^\circ\text{C}$. En este caso, el motor se auto-calibra a un comportamiento ultrasensible, evaluando anomalías sobre la calma nublada: basta una caída de temperatura de **$\ge 1.2^\circ\text{C}$** (o $2.5 \times V_{Temp\_Ref}$ del ruido previo) y un alza de humedad de **$\ge 4.0\%$** HR (o saturación $\ge 98\%$), asumiendo la condición de iluminancia como cumplida.

### B. Funcionamiento en el Código
Durante el día (`isDay = true`), el motor evalúa en dos pasos el lote actual ($B_0$) contra los lotes anteriores:

1. **Paso 1 (20 minutos)**:
   - Si la luz previa es alta ($B_1.max > 10,000$ lx), exige que la iluminancia actual caiga por debajo del $40\%$ de la luz previa (`luxCondition`).
   - Si el sol ya era débil ($B_1.max \le 10,000$ lx), `luxCondition` se asume como `true`. En esta atmósfera enfriada y húmeda, el umbral de caída térmica se suaviza a $\le -1.2^\circ\text{C}$ y el aumento de humedad a $\ge 4.0\%$. En caso contrario, se exigen los umbrales estándar ($\le -3.0^\circ\text{C}$ de temp y $\ge 10.0\%$ HR).
2. **Paso 2 (30 minutos)**: Si el Paso 1 no se cumple (por ejemplo, porque la tormenta avanza lentamente), se realiza la misma verificación comparando $B_0$ contra $B_2$ (hace 30 min), aplicando la misma sensibilización dinámica por luz si $B_2.max \le 10,000$ lx (exigiendo $\le -1.2^\circ\text{C}$ de temp y $\ge 4.0\%$ HR o saturación). En caso de sol normal, exige la caída de temperatura estándar de $\le -3.0^\circ\text{C}$ y una subida de humedad de $\ge 12.0\%$.

### C. Validación de Campo
* **Caso de Estudio (25/06 - 2:00 PM)**: Se detectó el inicio de lluvia diurna de forma precisa a las 2:00 PM. El sensor registró un desplome solar de $48,000$ lx a $8,500$ lx (caída del $82\%$), acoplado a una bajada térmica de $3.2^\circ\text{C}$ en 20 minutos, disparando la inferencia climática de forma correcta.
* **Caso Histórico de Nubosidad Persistente (30/05 - 2:20 PM)**: El cielo venía oscuro con una radiación solar previa de apenas **$4,440$ lx** (cielo nublado). Al comenzar a llover, la iluminancia cayó a $1,179$ lx, la temperatura se desplomó **$-3.6^\circ\text{C}$** (de $32.6^\circ\text{C}$ a $29.0^\circ\text{C}$) y la humedad se disparó en **$+18.1\%$** (de $72.5\%$ a $90.6\%$). El motor detectó e infirió correctamente el evento a pesar de la bajísima iluminancia inicial.


---

## 3. Regla Nocturna Adaptativa por Gradiente Auto-Calibrable (`THERMAL_DROP_NIGHT`)

### A. Razonamiento Físico (Enfriamiento Radiativo Nocturno vs Choque por Lluvia)
De noche (4:00 PM - 8:00 AM), el suelo pierde calor de forma lenta y predecible por radiación infrarroja hacia el espacio (enfriamiento radiativo). Esto provoca una bajada térmica lineal suave de $\approx -0.18^\circ\text{C}$ cada 10 min y una subida de humedad relativa correlacionada de $\approx +0.67\%$ HR cada 10 min (según la ley de Clausius-Clapeyron).

El motor de inferencia original (Fórmula A) comparaba una caída acumulada de 40 min contra el ruido de un solo lote de 10 min, lo que causaba falsos positivos constantes al anochecer. La **Fórmula B** corrige esta asimetría temporal comparando variables del mismo dominio de tiempo: la ventana acumulada de calma previa de 30 minutos ($varTempPre$ y $varHumPre$):

1. **Choque Térmico Adaptativo**: La caída térmica acumulada debe superar en **2.0x** a la variación total acumulada previa:
   $$tempDropThreshold = \max(0.4^\circ\text{C}, varTempPre \times 2.0)$$
2. **Choque Hídrico Adaptativo**: El alza hídrica acumulada debe superar en **1.8x** a la variación total acumulada previa:
   $$humRiseThreshold = \max(1.5\%, varHumPre \times 1.8)$$

#### Explicación de los Pisos Mínimos de Seguridad (Safe Floors):
* **Piso Térmico de $0.4^\circ\text{C}$**: El sensor DHT22 posee una precisión nominal de $\pm0.5^\circ\text{C}$ y resolución de $0.1^\circ\text{C}$. En noches en calma absoluta donde la variación previa combinada ($varTempPre$) cae a niveles de $0.1^\circ\text{C}$, el piso de seguridad de **$0.4^\circ\text{C}$** actúa como barrera para evitar que una fluctuación menor o digitalización del sensor dispare un falso positivo.
* **Piso Hídrico de $1.5\%$ HR**: Protege al motor contra el ruido electrónico instrumental de lectura del sensor (que suele fluctuar $\pm1.0\%$ en calma), ignorando fluctuaciones de bits insignificantes.

### B. Funcionamiento en el Código
1. **Calcular Estabilidad y Variaciones Previas (30 min)**: Evaluamos los 3 lotes anteriores ($B_1, B_2, B_3$).
   - $varTempPre = maxTempPreAll - minTempPreAll$
   - $varHumPre = maxHumPreAll - minHumPreAll$
2. **Calcular Umbrales de Choque con Piso**:
   - $tempDropThreshold = \max(0.4^\circ\text{C}, varTempPre \times 2.0)$
   - $humRiseThreshold = \max(1.5\%, varHumPre \times 1.8)$
3. **Evaluar Anomalía**: Se infiere lluvia si la calma previa fue real ($varTempPre \le 0.6^\circ\text{C}$), el lote $B_0$ experimenta una caída térmica abrupta ($currentTempDrop \ge tempDropThreshold$), y un alza de humedad abrupta ($currentHumRise \ge humRiseThreshold$ o se encuentra pre-saturado).

### C. Estrategia de Ajuste Futuro (Fine-Tuning)
Si bajo condiciones de inestabilidad atmosférica inusual o ráfagas frías el motor continuase dando falsos positivos, se debe seguir la siguiente escala de afinación:
1. **Ajustar los Multiplicadores**: Incrementar el multiplicador térmico de `2.0` a **`2.5`** y el hídrico de `1.8` a **`2.0`** para exigir choques más severos.
2. **Elevar los Pisos de Seguridad**: Subir el piso térmico a **`0.6°C`** y el hídrico a **`2.5%`** si el sensor DHT22 experimenta desgaste físico e incremento de ruido.
3. **Sensibilizar la Calma Previa**: Reducir el límite de $varTempPre \le 0.6^\circ\text{C}$ a **$\le 0.5^\circ\text{C}$** para bloquear evaluaciones en noches con transiciones ventosas activas.

### D. Validación de Campo
* **Caso de Estudio (24/06 - 8:50 PM)**: En una noche pre-saturada, la temperatura venía estable con $varTempPre = 0.20^\circ\text{C}$. A las 8:50 PM, la temperatura cayó a $25.40^\circ\text{C}$ ($dT = 0.90^\circ\text{C}$ desde el pico previo). El umbral de choque calculado fue de $ThT = \max(0.4, 0.20 \times 2.0) = 0.40^\circ\text{C}$. Como $0.90^\circ\text{C} \ge 0.40^\circ\text{C}$ y la humedad subió al $98.7\%$, el inicio se infirió con precisión al segundo exacto del reporte de lluvia.
* **Caso de Enfriamiento del 26/06 (Falsos Positivos Filtrados)**: A las 7:40 PM del 26 de junio, la temperatura cayó $0.60^\circ\text{C}$ en 40 min por radiación nocturna neta. Al venir del enfriamiento constante de la tarde, la variación previa era $varTempPre = 0.40^\circ\text{C}$, autocalibrando el umbral a $ThT = 0.4 \times 2.0 = 0.80^\circ\text{C}$. Dado que $0.60 < 0.80$, la Fórmula B bloqueó exitosamente el falso positivo.

---

## 4. Regla de Cese por Estancamiento Climático (`STAGNANT`)

### A. Razonamiento Físico
Durante un evento de lluvia, las variables térmicas y de humedad experimentan fluctuaciones y desequilibrios constantes. Al finalizar la precipitación, la atmósfera local del orquideario entra en un estado de equilibrio estático de saturación: la humedad se congela en niveles altos y la temperatura se estabiliza.

En la noche profunda, la ausencia de sol prolonga este estado de saturación total (100% HR). Para detectar que la lluvia ya cesó y que sólo queda la humedad ambiental residual, evaluamos cuándo las muestras del sensor dejan de oscilar y se "estancan" en un comportamiento plano. 

**Esta regla es el pilar central del cierre del motor de inferencia de lluvia, eliminando por completo la necesidad de un timeout absoluto (tiempo límite arbitrario) al confiar en la termodinámica del sistema para decretar de forma precisa el final del evento.**

### B. Funcionamiento en el Código
Esta regla se activa después de que el evento lleva al menos **15 minutos** de duración:

1. Se recuperan las variaciones de referencia climáticas prelluvia guardadas en el inicio del evento (`baselineVarTemp` y `baselineVarHum`).
2. Se calculan los umbrales adaptativos de cese proporcional:
   - Umbral de calma de temperatura: $tempCeseThreshold = \max(0.4^\circ\text{C}, 1.2 \times baselineVarTemp)$
   - Umbral de calma de humedad: $humCeseThreshold = \max(1.0\%, 1.2 \times baselineVarHum)$
3. Si la fluctuación interna del lote actual ($B_0.max - B_0.min$) en temperatura es $\le tempCeseThreshold$ Y en humedad es $\le humCeseThreshold$, el evento se cierra inmediatamente con la causa `STAGNANT`.

### C. Validación de Campo
* **Caso de Estudio (24/06 - 9:20 PM)**: Tras llover por 30 minutos, la temperatura en el lote de 9:10 PM a 9:20 PM se estabilizó en un rango estrecho de $24.60^\circ\text{C}$ a $24.80^\circ\text{C}$ (variación interna = $0.20^\circ\text{C}$). La humedad osciló apenas entre $99.1\%$ y $99.7\%$ (variación interna = $0.6\%$). Dado que los umbrales adaptativos de esa noche eran $0.4^\circ\text{C}$ y $1.0\%$, el evento se cerró exactamente a las 9:20 PM. La post-lluvia posterior (9:20 PM - 9:50 PM) confirmó el estancamiento absoluto con variaciones internas térmicas de $0.10^\circ\text{C}$ e hídricas del $0.0\%$.

---

## 5. Regla de Cese por Recuperación Solar (`SOLAR_RECOVERY`)

### A. Razonamiento Físico
Durante el día, el fin de la tormenta se caracteriza por la disipación de la capa de nubes densas y el retorno de la radiación solar directa. La iluminancia solar (lux) experimenta un rebote rápido y pronunciado hacia los niveles de luz natural previos. 

Para evitar cierres falsos por destellos solares cortos o claros transitorios de 5 minutos entre nubes (donde sigue lloviendo), el cese por recuperación solar exige una **validación cruzada multivariable**:
1. La iluminancia máxima actual debe superar el umbral elástico adaptativo de recuperación.
2. La temperatura no debe estar experimentando una caída libre en el lote actual (es decir, la variación del lote actual debe sugerir estabilidad térmica o calentamiento, $\Delta T_{B0} \ge -0.2^\circ\text{C}$).
3. La humedad no debe estar en pleno ascenso de choque en el lote actual.

### B. Funcionamiento en el Código
Si el evento de lluvia está activo durante el día, evaluamos el lote actual ($B_0$):

1. Calculamos el desplome de luz relativo experimentado:
   \[relativeDrop = \frac{baselineLux - minLuxInRain}{baselineLux}\]
2. Determinamos un factor elástico $\alpha$ que reduce la exigencia de recuperación si el desplome fue masivo:
   \[\alpha = 1.0 - 0.65 \times relativeDrop\]
3. El umbral elástico de recuperación solar se define como:
   \[luxRecoveryThreshold = minLuxInRain + \alpha \times (baselineLux - minLuxInRain)\]
4. El cese se autoriza únicamente si $B_0.max \ge luxRecoveryThreshold$ **Y** la temperatura del lote actual no está cayendo drásticamente (temperatura estable o al alza, $B_0.max - B_0.min \le 0.4^\circ\text{C}$ o tendencia positiva), validando que no es un claro transitorio bajo una tormenta activa.

### C. Validación de Campo
* **Caso de Estudio**: En un día parcialmente nublado de tormentas rápidas, un desplome de luz desde $60,000$ lx (baseline) hasta $8,000$ lx (mínimo de lluvia) arroja una caída del $86\%$. El factor $\alpha$ se calcula en $0.44$, requiriendo que la luz recupere al menos el $44\%$ de la caída de luz, fijando el umbral de cese en $\approx 31,000$ lx. Cuando las nubes se abrieron, la luz subió a $35,000$ lx, y al no registrarse caídas térmicas en ese lote, la lluvia se cerró de forma inmediata.
* **Caso de Encapotamiento Persistente (30/05)**: Tras llover a las 2:00 PM, el cielo se mantuvo encapotado con una iluminancia máxima de apenas **$983$ lx** (promedio $644$ lx) durante 75 minutos. Al no rebota el sol, `SOLAR_RECOVERY` nunca se disparó (evitando bucles de apertura y cierre). El cese se ejecutó de forma limpia a los 15 minutos por la regla `STAGNANT` al estabilizarse la temperatura a nivel plano (fluctuación térmica $\le 0.2^\circ\text{C}$).


---

## 6. Regla de Cese por Recuperación Térmica e Hídrica (`BASELINE_RECOVERY`)

### A. Razonamiento Físico
En eventos lluviosos diurnos continuos o de nubosidad persistente donde el sol no rebrota con fuerza, la lluvia cesa cuando las variables de temperatura y humedad ambiental retornan de forma progresiva a su equilibrio térmico previo (secado ambiental). 

La temperatura asciende lentamente conforme la energía térmica solar difusa calienta la garita y la humedad relativa desciende al evaporarse y disiparse la masa de agua.

### B. Funcionamiento en el Código
Si estamos en horas diurnas y los baselines de prelluvia están definidos:

1. Calculamos la caída térmica total de la lluvia ($tempDrop = baselineTemp - minTempInRain$) y el alza hídrica total ($humRise = maxHumInRain - baselineHum$).
2. Establecemos umbrales de recuperación adaptativos proporcionales:
   - Recuperar al menos el $35\%$ de la caída de temperatura:
     \[tempThreshold = minTempInRain + \max(0.6^\circ\text{C}, tempDrop \times 0.35)\]
   - Secar al menos el $15\%$ del incremento de humedad:
     \[humThreshold = maxHumInRain - \max(2.0\%, humRise \times 0.15)\]
3. Si la temperatura del lote actual sube de este umbral ($currentTemp \ge tempThreshold$) Y la humedad baja de este umbral ($currentHum \le humThreshold$), el evento se cierra con la causa `BASELINE_RECOVERY`.

### C. Validación de Campo
* **Caso de Estudio**: Con un baseline prelluvia de $28.0^\circ\text{C}$ y $75.0\%$ HR, y extremos de lluvia de $24.0^\circ\text{C}$ (caída de $4^\circ\text{C}$) y $98.0\%$ HR (alza de $23\%$), el sistema exige subir a $\ge 25.4^\circ\text{C}$ (recuperar $1.4^\circ\text{C}$) y descender a $\le 94.5\%$ HR (secar $3.5\%$). Una vez que el clima superó estos valores cruzados por el calentamiento de la tarde, el evento se cerró de forma segura.

---

## 7. Arquitectura de Software Desacoplada: `RainManager`

Dado que el sensor físico de gotas no es confiable (susceptibilidad a atascos, viento y suciedad), el sistema se ha rediseñado para independizar completamente ambos dominios:

```
                  +-----------------------------------+
                  |            Scheduler              |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |           RainManager             |
                  +--------+-----------------+--------+
                           |                 |
                           v                 v
            +--------------+---+     +-------+--------------+
            |  Lluvia Física   |     |   Lluvia Inferida    |
            | (Sensor Gotas)   |     | (Termodinámica Local)|
            +--------------+---+     +-------+--------------+
                           |                 |
                           v                 v
            +--------------+---+     +-------+--------------+
            | RainEvent DB     |     | RainEvent DB         |
            | isInfered: false |     | isInfered: true      |
            +------------------+     +----------------------+
```

### Características de la Separación
1. **Eventos de Base de Datos Separados**:
   - Un evento físico (`isInfered: false`) y un evento virtual/inferido (`isInfered: true`) pueden abrirse y cerrarse de forma paralela e independiente.
   - El sensor de gotas de lluvia físico abriendo un evento NO altera en absoluto el estado, baselines ni buffers del motor de inferencia.
2. **Encapsulación Absoluta**:
   - Toda la lógica del ciclo de vida (hidratación de estado al boot, muteces de apertura/cierre, buffers de telemetría de 45m y batches de 10m) vive exclusivamente dentro de [rain-manager.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/rain-manager.ts).
   - El archivo principal `index.ts` actúa meramente como pasarela de eventos MQTT hacia el `RainManager`.
3. **Consulta de Desconexión de Riegos**:
   - La función global `isCurrentlyRaining()` determina que está lloviendo en el orquideario si cualquiera de las dos lluvias está activa de forma válida (y no vetada):
     ```typescript
     export function isCurrentlyRaining(): boolean {
       return (physicalRainActive && !physicalRainOverridden) || 
              (inferedRainActive && !inferedRainOverridden);
     }
     ```
   - Esto blinda la instalación: si el sensor de gotas falla y se queda pegado en 'Raining', el veto climático desactivará el veto físico (`physicalRainOverridden = true`) permitiendo que el orquideario se riegue, pero si en paralelo el motor de inferencia detecta un choque térmico e hídrico real, la lluvia inferida tomará el relevo marcando `isCurrentlyRaining() = true` de forma completamente segura.


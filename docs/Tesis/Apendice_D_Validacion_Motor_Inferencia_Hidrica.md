# Apéndices

## Apéndice D: Validación Experimental del Motor de Inferencia Hídrica

Este apéndice documenta la metodología de validación, los criterios de decisión algorítmica y el análisis empírico del motor de inferencia hídrica de la plataforma PristinoPlant a través de la trazabilidad de las operaciones de riego. Este componente, integrado en el microservicio `Scheduler`, gobierna de forma autónoma la activación, el espaciamiento temporal y el veto preventivo de las rutinas de irrigación, humectación y dosificación, regulando el aporte hídrico para mitigar tanto el déficit hídrico como la saturación hídrica.

---

### 1. Metodología de Validación por Trazabilidad Operacional

La validación del motor se fundamenta en la contrastación cronológica entre las operaciones ejecutadas por el planificador (`TaskLog` y `TaskEventLog`) y los eventos de precipitación registrados (`RainEvent`) en PostgreSQL a lo largo de **369 tareas procesadas entre mayo y septiembre de 2026**.

Conforme a lo documentado en el Apéndice C, para garantizar el rigor científico del análisis se descartaron los registros generados por el sensor físico resistivo de gotas, cuyas lecturas quedaron invalidadas por corrosión galvánica y falsos contactos continuos. En consecuencia, la evaluación se circunscribió exclusivamente a los **110 eventos de lluvia inferida** reconstruidos algorítmicamente por el motor meteorológico, los cuales se distribuyen en **74 días con precipitaciones confirmadas**.

El motor evalúa las lecturas de telemetría y el historial hídrico antes de despachar cualquier orden al nodo actuador, rigiéndose por las siguientes reglas de control:

1. **Bloqueo en Tiempo Real (*Hard Block*):** Inhibición inmediata de toda operación hidráulica ante lluvia activa en curso.
2. **Alternancia Interdiaria:** Veto de la rutina de aspersión general (`IRRIGATION`) si el día previo se acumuló lluvia $\ge 20\text{ minutos}$ o se completó un riego.
3. **Lluvia Reciente (Ventanas Retrospectivas):** Cancelación de humectación de suelo (`SOIL_WETTING`) ante lluvias en las últimas 4 horas, o de nebulización (`HUMIDIFICATION`) ante lluvias en las últimas 8 horas.
4. **Saturación Hídrica Diurna:** Cancelación de tareas si el promedio móvil de humedad relativa en 4 horas es $\ge 85\%$.
5. **Humedad Diaria Sostenida:** Bloqueo preventivo al acumular entre 6 y 8 bloques horarios con humedad relativa promedio $\ge 98\%$.
6. **Acoplamiento Higrotérmico:** Veto de humectación de suelo ante temperaturas $\le 30^\circ\text{C}$ con humedad relativa $\ge 80\%$.

---

### 2. Métricas Globales y Clasificación de Vetos del Motor de Inferencia Hídrica

Durante el período evaluado se procesaron 369 tareas hidráulicas en el microservicio `Scheduler`. A continuación, se desglosan los resultados mediante cuatro tablas independientes que detallan el volumen global de ejecución, la distribución funcional por propósito, la clasificación de los vetos algorítmicos autónomos y el registro de intervenciones de control y contingencias operativas.

#### Tabla Ap-D1. *Volumen global y balance de ejecución de tareas hidráulicas (mayo – septiembre 2026)*

| Estado Operativo | Tareas Procesadas | Proporción (%) | Interpretación Técnica y Operacional |
| :--- | :---: | :---: | :--- |
| Tareas programadas en el sistema | 369 tareas | 100.0 % | Universo completo de operaciones auditadas en `TaskLog`. |
| Tareas completadas exitosamente | 172 tareas | 46.6 % | Operaciones ejecutadas con verificación de apertura y cierre de electroválvulas. |
| Tareas canceladas / vetadas | 182 tareas | 49.3 % | Acciones inhibidas por reglas algorítmicas de inferencia o control manual. |
| Tareas expiradas | 15 tareas | 4.1 % | Ventana de oportunidad vencida (20 min sin enlace por corte eléctrico o de red). |

*Nota.* Fuente: Registros de `TaskLog` en la base de datos PostgreSQL de PristinoPlant.

#### Tabla Ap-D2. *Distribución de operaciones hidráulicas según el propósito de la rutina (mayo – septiembre 2026)*

| Propósito de la Tarea | Identificador del Sistema | Total Tareas | Proporción (%) | Desglose Operativo (Completadas / Canceladas / Expiradas) |
| :--- | :---: | :---: | :---: | :--- |
| Humectación de Suelo | `SOIL_WETTING` | 225 tareas | 61.0 % | 119 completadas, 98 canceladas, 8 expiradas. |
| Aspersión General | `IRRIGATION` | 63 tareas | 17.1 % | 21 completadas, 40 canceladas, 2 expiradas. |
| Nebulización / Humidificación | `HUMIDIFICATION` | 74 tareas | 20.0 % | 31 completadas, 40 canceladas, 3 expiradas. |
| Fertirrigación Foliar | `FERTIGATION` | 4 tareas | 1.1 % | 0 completadas, 2 canceladas, 2 expiradas. |
| Aplicación Fitosanitaria | `FUMIGATION` | 3 tareas | 0.8 % | 1 completada, 2 canceladas, 0 expiradas. |

*Nota.* Fuente: Clasificación de rutinas en `TaskLog`. El total corresponde a las 369 tareas programadas.

#### Tabla Ap-D3. *Clasificación de vetos algorítmicos autónomos del motor de inferencia hídrica (mayo – septiembre 2026)*

| Regla Algorítmica de Inferencia | Tareas Vetadas | Proporción de Vetos (%) | Criterio y Justificación Técnica |
| :--- | :---: | :---: | :--- |
| Veto por lluvia reciente (Lookback 4h / 8h) | 38 tareas | 20.9 % | Cancelación de humectación de suelo o nebulización por lluvia ocurrida en las últimas 4 u 8 horas. |
| Veto por alternancia interdiaria (lluvia previa) | 25 tareas | 13.7 % | Aspersión general omitida al registrarse lluvia ($\ge 20\text{ min}$) o riego completo en la víspera. |
| Veto por saturación hídrica diurna (4h) | 25 tareas | 13.7 % | Omitidas por promedio móvil higrométrico $\ge 85\%$ en ventana deslizante de 4 horas. |
| Veto por humedad sostenida ($\ge 98\%$) | 23 tareas | 12.6 % | Detección de temporal continuo al acumular de 6 a 8 bloques horarios de saturación ($\ge 98\%$). |
| Bloqueo en tiempo real (Lluvia activa) | 19 tareas | 10.4 % | Inhibición inmediata (*hard block*) por coincidencia temporal con precipitación activa. |
| Veto acoplado temperatura / humedad | 8 tareas | 4.4 % | Omitidas al registrar $\text{Temp} \le 30^\circ\text{C}$ acoplada a $\text{HR} \ge 80\%$ (baja tasa evapotranspirativa). |
| Veto de respaldo nocturno / ambiente fresco | 2 tareas | 1.1 % | Cancelaciones preventivas por saturación nocturna o estabilidad microclimática fresca. |
| **Total de Vetos Autónomos del Motor** | **137 tareas** | **75.3 %** | **Decisiones algorítmicas autónomas que evitaron irrigaciones redundantes.** |

*Nota.* Fuente: Auditoría de eventos en `TaskEventLog`. Las proporciones están calculadas respecto al universo total de 182 tareas canceladas.

#### Tabla Ap-D4. *Distribución de intervenciones de control manual y contingencias operativas (mayo – septiembre 2026)*

| Tipo de Intervención / Contingencia | Tareas Afectadas | Proporción (%) | Causa Operativa e Impacto en el Sistema |
| :--- | :---: | :---: | :--- |
| Parada manual temprana (*Atomic Cancel*) | 14 tareas | 7.7 % | Interrupción temprana iniciada por el operador desde la interfaz web por reajuste de rutina. |
| Cancelaciones manuales justificadas | 13 tareas | 7.1 % | Mantenimiento de filtros, calibración de válvulas o reprogramación voluntaria. |
| Reajustes y cierres de circuito de riego | 8 tareas | 4.4 % | Cierre preventivo del circuito hidráulico para evitar desbalances de presión. |
| Colisión prevenida (*CollisionGuard*) / Inactivas | 3 tareas | 1.6 % | Bloqueo por solapamiento de rutinas concurrentes o rutinas en pausa voluntaria. |
| Expiradas por contingencia de enlace | 7 tareas | 3.8 % | Tareas no despachadas por falta transitoria de telemetría o interrupción de energía eléctrica. |
| **Total Intervenciones y Contingencias** | **45 tareas** | **24.7 %** | **Acciones de control manual directo y protección física de la infraestructura.** |

*Nota.* Fuente: Registros de `TaskLog` y `TaskEventLog`. Sumadas a los 137 vetos autónomos, consolidan las 182 tareas canceladas/expiradas no ejecutadas.

---

### 3. Flujo de Operaciones Macro en Días con Precipitación Confirmada

Al contrastar la ejecución de tareas contra las jornadas con precipitación pluvial confirmada (74 días con eventos de lluvia inferida), el motor demostró los siguientes patrones de control operacional:

* **Jornadas con Veto Total (24 días):** Ante temporales prolongados o saturación higrométrica continua, el sistema canceló el 100% de las tareas programadas, manteniendo las electroválvulas cerradas durante toda la jornada.
* **Jornadas con Veto Selectivo / Adaptativo (41 días):** En días con lluvias intermitentes o vespertinas, el sistema autorizó el riego matutino en horas secas y soleadas, pero vetó inmediatamente las operaciones vespertinas tras la detección de las precipitaciones.
* **Jornadas con Riego Matutino Previo a Lluvias Nocturnas (9 días):** Casos donde la aspersión matutina se completó en seco y la lluvia sobrevino en horas nocturnas, activando el veto interdiario para la jornada posterior.

La Tabla Ap-D5 detalla la cronología operativa de jornadas representativas a lo largo de los meses evaluados, evidenciando la correspondencia directa entre los eventos meteorológicos inferidos y las respuestas del circuito hidráulico.

#### Tabla Ap-D5. *Cronología y flujo macro de operaciones en jornadas representativas con eventos de lluvia confirmados*

| Fecha | Lluvia Inferida Acumulada | Eventos Inferidos | Horario | Tarea Programada | Estado Final | Causal de la Decisión Algorítmica / Nota de Registro |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **01/06/2026** | 79 min | 1 evento | 10:00 | `IRRIGATION` (15 min) | CANCELLED | Cancelada preventivamente por el operador ante lluvia inminente. |
| *(Veto Total)* | | (16:45 – 18:05) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto lluvia reciente*: Lluvia detectada en últimas 4h. Suelo ya humectado. |
| | | | 20:00 | `HUMIDIFICATION` (3 min) | CANCELLED | *Veto lluvia acumulada*: Lluvia en últimas 8h. Ambiente saturado. |
| | | | 21:00 | `FERTIGATION` (5 min) | CANCELLED | Cancelada manualmente para evitar lavado foliar por temporal nocturno. |
| **06/06/2026** | 65 min | 2 eventos | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto humedad sostenida*: Acumulados 7 bloques de 1h con HR $\ge 98\%$. |
| *(Saturación)* | | (16:02 y 19:23) | 20:00 | `HUMIDIFICATION` (3 min) | CANCELLED | *Veto humedad sostenida*: Acumulados 7 bloques de 1h con HR $\ge 98\%$. |
| **07/06/2026** | 117 min | 1 evento | 10:00 | `HUMIDIFICATION` (10 min) | CANCELLED | *Bloqueo en tiempo real*: Lluvia detectada al momento de la ejecución. |
| *(Temporal)* | | (18:36 – 20:33) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto humedad sostenida*: 7 bloques continuos de 1h con HR $\ge 98\%$. |
| | | | 20:00 | `HUMIDIFICATION` (3 min) | CANCELLED | *Veto humedad sostenida*: 7 bloques continuos de 1h con HR $\ge 98\%$. |
| **10/06/2026** | 9 min | 1 evento | 10:00 | `IRRIGATION` (15 min) | CANCELLED | *Bloqueo en tiempo real*: Detección de precipitación activa al momento del disparo. |
| *(Hard Block)* | | (15:14 – 15:22) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Bloqueo en tiempo real*: Lluvia en curso al momento del disparo. |
| **13/06/2026** | 51 min | 1 evento | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto acoplado*: Temperatura $29.0^\circ\text{C} \le 30.9^\circ\text{C}$ con alta humedad ambiental. |
| *(Recuperación)*| | (Nocturno 23:01) | 15:32 | `SOIL_WETTING` (10 min) | COMPLETED | Ejecución diferida completada con éxito tras estabilización microclimática. |
| **14/06/2026** | 87 min | 2 eventos | 09:00 | `IRRIGATION` (15 min) | COMPLETED | Riego matutino ejecutado bajo sol y cielo seco previo a las lluvias. |
| *(Selectivo)* | | (19:00 y 23:00) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto acoplado*: Temperatura $25.7^\circ\text{C} \le 30.9^\circ\text{C}$ ante frente lluvioso. |
| **17/06/2026** | 71 min | 2 eventos | 10:00 | `IRRIGATION` (15 min) | CANCELLED | *Veto interdiario*: Ayer se registró lluvia completa (290 min). Alternancia hídrica. |
| *(Interdiario)* | | (00:04 y 23:18) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto humedad sostenida*: Acumulados 8 bloques de 1h con HR $\ge 98\%$. |
| | | | 19:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto humedad sostenida*: Acumulados 8 bloques de 1h con HR $\ge 98\%$. |
| **20/06/2026** | 39 min | 1 evento | 10:00 | `IRRIGATION` (15 min) | COMPLETED | Aspersión general ejecutada en ventana matutina despejada y seca. |
| *(Mixto)* | | (17:11 – 17:50) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto humedad sostenida*: Acumulados 6 bloques $\ge 98\%$ (suelo húmedo). |
| | | | 19:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Bloqueo en tiempo real*: Evento de lluvia en curso registrado en base de datos. |
| **01/07/2026** | 102 min | 3 eventos | 10:00 | `IRRIGATION` (15 min) | CANCELLED | *Veto interdiario*: Riego estricto. Ayer se registró evento de lluvia inferida. |
| *(Julio)* | | (14:00 – 20:41) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto acoplado*: Temp $27.9^\circ\text{C} \le 30^\circ\text{C}$ con HR promedio $81.4\% \ge 80\%$. |
| | | | 19:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto lluvia reciente*: Evento de lluvia inferida registrado hace 1.8 horas. |
| **07/07/2026** | 75 min | 3 eventos | 15:00 | `SOIL_WETTING` (10 min) | COMPLETED | Humectación ejecutada con éxito en ambiente cálido previo a precipitaciones. |
| *(Adaptativo)* | | (16:55 – 19:44) | 19:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto lluvia reciente*: Evento de lluvia inferida registrado hace 59 minutos. |
| **07/08/2026** | 59 min | 1 evento | 10:00 | `IRRIGATION` (15 min) | COMPLETED | Aspersión matutina cumplida con normalidad en ciclo interdiario. |
| *(Agosto)* | | (16:25 – 17:24) | 15:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto saturación diurna*: EMA Interior registró promedio 4h HR $85\% \ge 85\%$. |
| | | | 19:00 | `SOIL_WETTING` (10 min) | CANCELLED | *Veto lluvia reciente*: Evento de lluvia inferida registrado hace 2h 29 min. |
| **16/09/2026** | 8 min | 1 evento | 10:00 | `IRRIGATION` (15 min) | CANCELLED | *Veto interdiario*: Ayer se registró lluvia inferida. Manteniendo alternancia. |
| *(Septiembre)* | | (17:20 – 17:28) | 15:00 | `SOIL_WETTING` (10 min) | COMPLETED | Humectación vespertina despachada normalmente al secarse el sustrato. |
| | | | 19:00 | `SOIL_WETTING` (10 min) | COMPLETED | Humectación nocturna despachada (micro-lluvia de 8 min evaporada por sol). |
| | | | 20:00 | `HUMIDIFICATION` (3 min) | COMPLETED | Nebulización ejecutada tras normalización de parámetros ambientales. |

*Nota.* Fuente: Consolidación cronológica cruzada entre eventos de lluvia inferida (`isInfered: true`) en `RainEvent` y las operaciones auditadas en `TaskLog` del servicio `Scheduler` de PristinoPlant.

---

### 4. Análisis e Interpretación de Resultados Operativos

La trazabilidad del historial de operaciones aporta las siguientes conclusiones sobre la fiabilidad y eficacia del motor de inferencia hidráulica:

1. **Inhibición Precisa de Riegos Redundantes:**  
   El motor vetó de forma autónoma **137 operaciones hidráulicas programadas**. En ningún caso registrado en la base de datos se ejecutó aspersión general o humectación bajo lluvia activa ni durante estados de saturación extrema, demostrando un 100% de efectividad en la prevención de aportes hídricos innecesarios.

2. **Gobernanza de la Alternancia Interdiaria:**  
   El sistema inhibió de manera oportuna **25 sesiones de aspersión matutina (`IRRIGATION`)** tras detectar que las precipitaciones del día anterior aportaron el volumen hídrico requerido ($\ge 20\text{ min}$ de lluvia acumulada), respetando la alternancia programada entre riegos.

3. **Control Intradiario Adaptativo:**  
   En 42 jornadas con precipitaciones intermitentes, el motor discriminó adecuadamente entre ventanas secas y húmedas: permitió la ejecución de tareas programadas en horas ventiladas y vetó selectivamente las operaciones coincidentes con la llegada de frentes de lluvia o saturación higrométrica.

4. **Seguridad Operativa y Resiliencia del Circuito:**  
   El registro de 45 intervenciones de control (incluyendo paradas manuales tempranas y tareas expiradas por contingencias eléctricas o de conectividad) confirma que la plataforma prioriza la seguridad operativa del circuito, impidiendo que las electroválvulas permanezcan abiertas ante fallos de enlace o fluido eléctrico.

En conclusión, la trazabilidad de las operaciones de campo valida que el motor de inferencia hídrica actúa con plena autonomía y precisión, gobernando el circuito de riego en estricta correspondencia con las condiciones meteorológicas y el estado hídrico real del entorno.

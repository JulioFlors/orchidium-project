# Guía Técnica: Motor de Inferencia de Lluvia y Arquitectura Atmosférica

Este documento detalla el diseño arquitectónico, el funcionamiento matemático de la **Máquina de Estados Adaptativa con Escalonamiento Solar**, y la corrida en frío visual que explica cómo PristinoPlant infiere lluvias diurnas.

---

## 🏛️ Arquitectura de Nombres: `rain-manager` vs. `inference-engine`

En el diseño del software del Scheduler, la separación de responsabilidades determina el nombre de los componentes:

### 1. `rain-manager.ts` (Sujeto + Rol)
* **Gramática**: `[Dominio (Rain)] + [Responsabilidad (Manager)]`
* **Propósito**: Es el **Controlador del Ciclo de Vida** del dominio de lluvia. Gestiona el estado de persistencia (abre y cierra eventos físicos/virtuales en Postgres), administra los buffers deslizantes de telemetría y coordina los timeouts de red. Se le llama *Manager* porque tiene la tutela del ciclo de vida del estado.

### 2. `inference-engine.ts` (Acción + Componente)
* **Gramática**: `[Función (Inference)] + [Componente (Engine)]`
* **Propósito**: Es un **Motor Matemático/Lógico Puro**. No guarda estados ni escribe en la base de datos; simplemente toma matrices de datos climáticos y evalúa reglas de control. Se le nombra así porque es un *Motor de Inferencia* generalizado que no solo evalúa lluvias, sino también vetos climáticos de riego, DLI, VPD y clasificación del tipo de día.

---

## 🌧️ Lógica de Estados Solar Adaptativa (Inicio Diurno)

Para la inferencia de lluvia durante la franja diurna (`[8:00 AM - 4:00 PM)` hora de Caracas), el sistema evalúa la iluminancia previa (`baseLux`) y la iluminancia actual (`currentMinLux`) mediante tres estados de sensibilidad para mitigar el calor residual del sensor exterior:

```typescript
let luxCondition = false
let tempDropThreshold = -3.0 // Umbral rígido por defecto (con sol fuerte)
let humRiseThreshold = 12.0  // Umbral rígido por defecto (con sol fuerte)

if (baseLux <= 15000) {
  // ESTADO A: Cielo Encapotado Previo (No requiere caída solar adicional)
  luxCondition = true
  tempDropThreshold = -1.2 // Sensibilidad alta habilitada
  humRiseThreshold = 4.0   // Sensibilidad alta habilitada
} else if (baseLux <= 26000) {
  // ESTADO B: Nublado Medio (Exige caída de luz de al menos 40%)
  luxCondition = currentMinLux <= baseLux * 0.6

  // Si la luz desciende efectivamente de los 15k lx, habilitamos sensibilidad alta
  if (currentMinLux <= 15000) {
    tempDropThreshold = -1.2
    humRiseThreshold = 4.0
  }
} else {
  // ESTADO C: Sol Radiante (Exige caída de luz drástica de al menos 60%)
  luxCondition = currentMinLux <= baseLux * 0.4

  // Si la luz cae de golpe por debajo de los 15k lx (Tormenta densa), conmutamos a sensibilidad alta
  if (currentMinLux <= 15000) {
    tempDropThreshold = -1.2
    humRiseThreshold = 4.0
  }
}
```

---

## 🏃 Corrida en Frío Visual (Simulación Paso a Paso)

### CASO 1: Cielo Encapotado Previo (Estado A)
*El día ya viene muy gris y estable antes de la lluvia.*

* **Variables**: `baseLux` = `12k lx`, `currentMinLux` = `11k lx`, `dTemp` = `-1.5°C`, `dHum` = `+6.0% HR`.
1. **Flujo de Decisión**:
   * `baseLux <= 15000` (12k <= 15k) ➜ **TRUE** ✅.
   * *Estado A (Encapotado)*: `luxCondition = true`, `tempDropThreshold = -1.2`, `humRiseThreshold = 4.0`.
2. **Evaluación de Choque**:
   * ¿`dTemp <= -1.2`? (-1.5 <= -1.2) ➜ **TRUE** ✅.
   * ¿`dHum >= 4.0`? (6.0 >= 4.0) ➜ **TRUE** ✅.
   * **Resultado**: **`LLUVIA INICIADA`** (Inferencia Térmica por Nubosidad Persistente).

---

### CASO 2: Tormenta de Tarde desde Sol Radiante (Estado C ➜ C2)
*El cielo está a pleno sol con 56k lx y entra un frente oscuro y denso de lluvia.*

* **Variables**: `baseLux` = `56k lx`, `currentMinLux` = `12k lx` (caída del **78.5%**), `dTemp` = `-1.8°C`, `dHum` = `+8.0% HR`.
1. **Flujo de Decisión**:
   * `baseLux > 26000` (56k > 26k) ➜ **TRUE (Estado C)**.
   * `currentMinLux <= baseLux * 0.4` (12k <= 22.4k) ➜ **TRUE** ✅ (Luz cayó más del 60%).
   * `currentMinLux <= 15000` (12k <= 15k) ➜ **TRUE** ✅ (Conmuta dinámicamente a **Sensibilidad Alta**).
   * *Nuevos Umbrales*: `tempDropThreshold = -1.2`, `humRiseThreshold = 4.0`.
2. **Evaluación de Choque**:
   * ¿`dTemp <= -1.2`? (-1.8 <= -1.2) ➜ **TRUE** ✅.
   * ¿`dHum >= 4.0`? (8.0 >= 4.0) ➜ **TRUE** ✅.
   * **Resultado**: **`LLUVIA INICIADA`** (Inferencia Térmica por Nubosidad Persistente).

---

### CASO 3: Nube Clara de Mediodía (Estado C ➜ C1)
*Hay sol radiante (56k lx) y pasa una nube blanca normal, bajando la luz a 22k lx sin lluvia.*

* **Variables**: `baseLux` = `56k lx`, `currentMinLux` = `22k lx` (caída del **60.7%**), `dTemp` = `-0.5°C`, `dHum` = `+1.0% HR`.
1. **Flujo de Decisión**:
   * `baseLux > 26000` ➜ **TRUE (Estado C)**.
   * `currentMinLux <= baseLux * 0.4` (22k <= 22.4k) ➜ **TRUE** (Luz cayó justo el 60%).
   * `currentMinLux <= 15000` (22k <= 15k) ➜ **FALSE** ❌ (Mantiene **umbrales rígidos de seguridad**).
   * *Umbrales Activos*: `tempDropThreshold = -3.0`, `humRiseThreshold = 12.0`.
2. **Evaluación de Choque**:
   * ¿`dTemp <= -3.0`? (-0.5 <= -3.0) ➜ **FALSE** ❌.
    * **Resultado**: **`EVENTO RECHAZADO`** (Evita falso positivo por sombreado de nube).

---

## 🌙 Lógica de Inferencia Nocturna: Bloques Deslizantes Adaptativos

Para la franja nocturna (`[5:00 PM - 8:00 AM)` hora de Caracas), el sistema prescinde de la iluminancia (ya que es naturalmente $0\text{ lx}$) y evalúa la dinámica térmica e hídrica comparando dos ventanas de tiempo de **30 minutos**:

### 1. Las Dos Ventanas Deslizantes
* **Bloque de Calma Previa (Lotes 1, 2, 3)**:
  * $\text{varTempPre} = \text{Max}(1,2,3) - \text{Min}(1,2,3)$
  * $\text{varHumPre} = \text{Max}(1,2,3) - \text{Min}(1,2,3)$
* **Bloque de Evaluación Actual (Lotes 0, 1, 2)**:
  * $\text{varTempCur} = \text{Max}(0,1,2) - \text{Min}(0,1,2)$
  * $\text{varHumCur} = \text{Max}(0,1,2) - \text{Min}(0,1,2)$

### 2. Disparo por Ruptura de Calma
La calma nocturna se rompe si la variación del bloque actual supera el umbral elástico determinado por la calma previa:
```typescript
const tempFloor = minHumPre >= 98.0 ? 0.50 : 0.35
const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8)
const humRiseThreshold = Math.max(1.5, varHumPre * 1.6)

const isTempDropAbrupt = varTempCur >= tempDropThreshold
const isHumRiseAbrupt = varHumCur >= humRiseThreshold
```
* **Inyección Nocturna de Lux**: Para evitar que la ausencia de datos de iluminancia de noche (ya que el sensor BH1750 no reporta con oscuridad) congele o salte la evaluación del loop, el motor inyecta automáticamente un valor por defecto de **$0\text{ lx}$** al lote.

---

## ⚖️ Análisis de Estrategias Descartadas para la Noche

Durante la calibración del motor virtual de noche, se evaluaron y descartaron múltiples enfoques por fallas de robustez meteorológica:

### ❌ Estrategia 1: Híbrido de Choque vs. Variabilidad de 30 minutos (Original en HEAD)
* **Diseño**: Comparaba la caída individual en el lote actual de **10 minutos** (`batch0`) contra la variabilidad acumulada de **30 minutos** de calma previa multiplicada por $1.8$, con un bloqueo estático si la variación previa superaba los $0.6^\circ\text{C}$ (`varTempPre <= 0.6`).
* **Motivo del descarte**: Mezclaba escalas de tiempo. El enfriamiento natural y constante del atardecer acumulaba una variabilidad de $1.1^\circ\text{C}$ en 30 minutos, inflando el umbral de un solo lote a $1.98^\circ\text{C}$ (lo que insensibilizaba la regla e ignoraba lluvias reales). Además, el bloqueo de $0.6^\circ\text{C}$ abortaba la evaluación ante cualquier atardecer normal.

### ❌ Estrategia 2: Ruido por Lote Individual de 10 minutos (`refVarTemp`)
* **Diseño**: Tomaba la variación interna individual de cada lote por separado en la calma, seleccionaba la máxima para estimar el ruido natural local de 10 minutos, y comparaba la caída de `batch0` contra ese ruido multiplicado.
* **Motivo del descarte**: Aunque eliminaba el falso positivo del atardecer al no acumular tendencias a 30 minutos, resultó ser **insensible ante lloviznas progresivas**. Al fragmentar la calma en ventanas de 10 minutos, los cambios lentos pero consistentes de temperatura y humedad se disipaban en el ruido local y no lograban disparar la inferencia.

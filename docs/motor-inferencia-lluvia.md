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

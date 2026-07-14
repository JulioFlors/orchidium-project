# Guía Técnica: Motor de Inferencia de Lluvia y Arquitectura Atmosférica

Este documento detalla el diseño arquitectónico, el funcionamiento matemático de la **Máquina de Estados Adaptativa con Escalonamiento Solar y Protección por Gradiente**, y describe de forma exacta las reglas lógicas que PristinoPlant utiliza para inferir lluvia.

---

## 🏛️ Arquitectura de Nombres: `rain-manager` vs. `inference-engine`

En el diseño del software del Scheduler, la separación de responsabilidades determina el nombre de los componentes:

### 1. `rain-manager.ts` (Sujeto + Rol)
* **Gramática**: `[Dominio (Rain)] + [Responsabilidad (Manager)]`
* **Propósito**: Es el **Controlador del Ciclo de Vida** del dominio de lluvia. Gestiona el estado de persistencia (abre y cierra eventos físicos/virtuales en Postgres), administra los buffers deslizantes de telemetría y coordina los timeouts de red. Se le llama *Manager* porque tiene la tutela del ciclo de vida del estado.

### 2. `inference-engine.ts` (Acción + Componente)
* **Gramática**: `[Función (Inference)] + [Componente (Engine)]`
* **Propósito**: Es un **Motor Matemático/Lógico Puro**. No guarda estados ni escribe en la base de datos; simplemente toma matrices de datos climáticos y evalúa reglas de control generales.

---

## 🌧️ Inferencia Diurna (Máquina de Estados Solar Adaptativa)
* **Horario de Evaluación**: `[7:00 AM - 6:00 PM VET]` (Hora local de Caracas).
* **Lógica del Disparo**: Exige el cumplimiento conjunto (`AND`) de tres condiciones: iluminancia actual congruente con la previa (`luxCondition`), caída de temperatura (`tempCondition`) y aumento de humedad o saturación (`humCondition`).

El motor compara las métricas del bloque actual (`batch0`) con las condiciones previas de hace **20, 30 o 40 minutos** (Paso 1, 2 y 3 respectivamente). En cada paso, se clasifica el cielo según la iluminancia previa (`baseLux`):

### 1. Rama A: Cielo Nublado (`baseLux <= 15,000` lx)
* **Condición Solar**: Se asume nublado previo; no se requiere caída adicional de iluminancia.
* **Evaluación de Choque (AND)**:
  * **Paso 1 (20 min)**: Caída de Temp $\le -1.5$ °C **Y** (Alza de Hum $\ge +10.0\%$ HR o pre-saturación).
  * **Paso 2 (30 min)**: Caída de Temp $\le -2.5$ °C **Y** (Alza de Hum $\ge +12.0\%$ HR o pre-saturación).
  * **Paso 3 (40 min)**: Caída de Temp $\le -3.5$ °C **Y** (Alza de Hum $\ge +14.0\%$ HR o pre-saturación).
  * *Pre-saturación*: Humedad previa alta y aumento hacia $\ge 98.0\%$ HR.

### 2. Rama C: Cielo Intermedio (`15,000 < baseLux <= 26,000` lx)
* **Condición Solar**: Exige caída de iluminancia de al menos el 40% (`currentMinLux <= baseLux * 0.6`).
* **Evaluación de Choque (AND)**:
  * Solo si la luz cae por debajo de $15,000$ lx (cielo oscurecido), se habilitan los umbrales sensibles:
    * **Paso 1 (20 min)**: Caída de Temp $\le -1.5$ °C **Y** (Alza de Hum $\ge +8.0\%$ HR o pre-saturación).
    * **Paso 2 (30 min)**: Caída de Temp $\le -2.5$ °C **Y** (Alza de Hum $\ge +10.0\%$ HR o pre-saturación).
    * **Paso 3 (40 min)**: Caída de Temp $\le -3.5$ °C **Y** (Alza de Hum $\ge +12.0\%$ HR o pre-saturación).
  * Si la luz no desciende de $15,000$ lx, se aplican los umbrales rígidos de seguridad por defecto (caídas de temperatura de $-3.0$ °C a $-4.0$ °C).

### 3. Rama B: Cielo Soleado (`baseLux > 26,000` lx)
* **Condición Solar**: Exige caída de iluminancia drástica de al menos el 60% (`currentMinLux <= baseLux * 0.4`).
* **Evaluación de Choque (AND)**:
  * Solo si la luz cae por debajo de $15,000$ lx (oscurecimiento por tormenta densa):
    * **Paso 1 (20 min)**: Caída de Temp $\le -2.0$ °C **Y** (Alza de Hum $\ge +8.0\%$ HR o pre-saturación).
    * **Paso 2 (30 min)**: Caída de Temp $\le -2.5$ °C **Y** (Alza de Hum $\ge +10.0\%$ HR o pre-saturación).
    * **Paso 3 (40 min)**: Caída de Temp $\le -4.0$ °C **Y** (Alza de Hum $\ge +12.0\%$ HR o pre-saturación).

---

## 🛡️ Protección por Gradiente (Inferencia Diurna)
Cuando se cumplen las condiciones de choque diurnas (caída térmica, hídrica y solar del Paso 1, 2 o 3), el sistema evalúa si el alza de humedad acumulada supera el **Umbral Robusto** original ($+12\%$ en Paso 1, $+14\%$ en Paso 2, o $+16\%$ en Paso 3 para nublado).
* **Supera Umbral Robusto**: Abre el evento directamente.
* **Zona Sensible (Humedad menor al umbral robusto)**: Se activa la **Protección por Gradiente**. Exige que en los últimos 10 minutos (bloque minuto a minuto de `batch0`) se haya registrado al menos una velocidad de cambio brusco:
  1. **Humedad rápida (1 min)**: Incremento de humedad $\ge 1.8\%$ HR de un minuto al siguiente.
  2. **Humedad rápida (2 min)**: Incremento de humedad acumulado $\ge 2.5\%$ HR en 2 minutos.
  3. **Temperatura rápida (1 min)**: Caída de temperatura $\le -0.5$ °C de un minuto al siguiente.
* Si no se registra esta velocidad rápida de cambio, la apertura se veta por gradiente lento (falso positivo por nubosidad/humedad progresiva).

---

## 🌙 Inferencia Nocturna (Ruptura Dinámica de Calma)
* **Horario de Evaluación**: `[6:00 PM - 7:00 AM VET]` (Hora local de Caracas).
* **Lógica del Disparo**: Prescinde de la iluminancia (evaluada como $0$ lx) y compara la variabilidad atmosférica de dos ventanas deslizantes de **30 minutos** (Calma Previa: lotes 1, 2, 3 vs. Lote Actual: lotes 0, 1, 2).

Para abrir el evento se requiere cumplir conjuntamente (`AND`):
1. **Caída Térmica Abrupta**: Variación actual de temperatura $\ge$ Umbral Térmico (`Math.max(tempFloor, varTempPre * 1.6)`) **Y** la tendencia de temperatura es a la baja (`dT < -0.1`°C).
   * *tempFloor*: $0.8$ °C si la calma previa estaba saturada ($\ge 98\%$ HR), o $0.7$ °C de lo contrario.
2. **Respuesta Hídrica Coherente**:
   * Variación actual de humedad $\ge$ Umbral de Humedad (`Math.max(3.0, varHumPre * 1.4)`) **Y** la tendencia de humedad es al alza.
   * **Excepción por Saturación**: Si el aire ya está pre-saturado ($\ge 98\%$ HR actual o $\ge 95\%$ en el lote previo), se ignora el requisito de alza de humedad y la lluvia se infiere únicamente con la caída de temperatura abrupta.

---

## ♻️ Criterios de Cese de Lluvia Inferida
El término de un evento de lluvia se evalúa si la duración del evento es $\ge 15$ minutos, bajo dos mecanismos principales:

### 1. Cese por Estancamiento Dinámico
Estabilidad climática sostenida durante 10 minutos (variación interna de temperatura $\le$ umbral térmico y humedad $\le$ umbral de humedad).
* **Umbral térmico**: `Math.max(0.4, 1.2 * desviación calma previa)`.
* **Umbral de humedad**: `Math.max(1.0, 1.2 * desviación calma previa)`. Si el aire está al $100\%$ HR (saturado), el requisito de humedad se asume cumplido y solo se evalúa la temperatura.
* **Guardia Térmica Unificada**: Evita falsos ceses analizando los lotes deslizantes de 10 minutos hacia atrás. Si se detecta una caída neta de temperatura $> 0.4$ °C en los últimos 30 minutos (humedad normal) o últimos 50 minutos (al 100% HR), el cierre se bloquea.

### 2. Cese por Variación Térmica Diurna
Recuperación térmica acelerada y drástica de $\ge 0.6$ °C respecto a la temperatura mínima registrada durante la lluvia.

### 3. Recuperaciones Diurnas (Fallback)
* **Recuperación Adaptativa**: La temperatura recupera al menos el 35% de lo caído y la humedad disminuye un 15% del ascenso.
* **Recuperación Solar**: La iluminancia rebota por encima del umbral elástico calculado a partir del oscurecimiento de la tormenta.

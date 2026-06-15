# Especificación de Diseño de Software (SDD) - Fase 1: Motor de Eventos de Lluvia e Inferencia Climática

Este documento define la arquitectura, el modelado de datos y las reglas del motor de inferencia para la apertura y cierre de eventos de lluvia (físicos e inferidos) en PristinoPlant.

---

## 1. Objetivos y Nomenclatura Profesional

Para garantizar una gestión hídrica precisa en el orquideario y un modelado representativo, se definen y separan dos tipos de eventos meteorológicos:

* **Evento de Lluvia (Físico)**: Evento de precipitación real registrado de manera reactiva por el sensor físico de gotas de la estación meteorológica (`Weather_Station`).
* **Evento de Lluvia Inferido**: Evento de precipitación detectado mediante la termodinámica del microclima exterior (`zone = 'EXTERIOR'`), analizando los cambios abruptos cruzados de humedad relativa, temperatura e iluminancia. Esto compensa fallos o falta de calibración en el sensor físico.

---

## 2. Modelado de Datos (Base de Datos)

En PostgreSQL, a través de Prisma (`schema.prisma`), se unificará el almacenamiento en el modelo `RainEvent` agregando campos que diferencien el origen y guarden las condiciones de contorno (baselines) para auditoría:

```prisma
model RainEvent {
  id             String    @id @default(uuid())
  startedAt      DateTime
  endedAt        DateTime?
  durationSeconds Int?
  isInfered      Boolean   @default(false) // false = Físico (Sensor), true = Inferido (Telemetría)
  
  // Baselines de contorno previos al inicio del evento (para auditoría y gráficos de cruce)
  baselineTemp   Float?
  baselineHum    Float?
  baselineLux    Float?
  
  // Registro de diagnóstico
  triggerReason  String?   // Motivo de apertura (ej: "PHYSICAL_SENSOR", "THERMAL_DROP_DAY", "THERMAL_DROP_NIGHT")
  closeReason    String?   // Motivo de cierre (ej: "DRY_SENSOR", "SOLAR_RECOVERY", "STAGNANT_TIMEOUT", "TIMEOUT_2H")
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

---

## 3. Lógica de Apertura de Eventos

El Scheduler procesará las lecturas del nodo `EXTERIOR` cada vez que se reciba un lote MQTT de telemetría.

### 3.1 Evento de Lluvia (Físico)

Se abre de forma inmediata si se cumple la condición:

* Lectura del sensor de gotas físico `rainIntensity > 0`.
* **TriggerReason**: `"PHYSICAL_SENSOR"`.
* **Baselines**: Se registran los valores actuales en el momento del disparo.

### 3.2 Evento de Lluvia Inferido (Termodinámico)

Se abre si no hay un evento activo y se detectan los siguientes deltas acumulados en un buffer deslizante de **30 minutos**:

#### A. Ventana Diurna (Día Botánico: 8:00 AM - 4:00 PM)

* **Humedad**: Incremento de humedad relativa $\Delta\text{HR} \ge 12.0\%$ en 30m.
* **Temperatura**: Caída térmica $\Delta\text{Temp} \le -3.0^\circ\text{C}$ en 30m.
* **Iluminancia**: Caída de luxes por debajo del $40\%$ de la iluminación previa (solo si `baselineLux` era $\ge 10,000\text{ lux}$).
* **TriggerReason**: `"THERMAL_DROP_DAY"`.

#### B. Ventana Nocturna (Tarde/Noche: 4:00 PM - 8:00 AM)

* **Humedad**: Incremento de humedad relativa $\Delta\text{HR} \ge 10.0\%$ en 30m.
* **Temperatura**: Caída térmica $\Delta\text{Temp} \le -2.0^\circ\text{C}$ en 30m.
* **TriggerReason**: `"THERMAL_DROP_NIGHT"`.

#### Cálculo de Baselines Pre-Lluvia

Para capturar la atmósfera real antes de que se opaque el cielo, los baselines se extraen de las lecturas estables del buffer deslizante de los 45 minutos previos:

* `baselineLux` = $\max(\text{Lux})$ en los últimos 45m (iluminación solar máxima).
* `baselineTemp` = $\max(\text{Temp})$ en los últimos 45m (temperatura máxima previa).
* `baselineHum` = $\min(\text{Hum})$ en los últimos 45m (humedad mínima seca previa).

---

## 4. Lógica de Cierre y Recuperación

### 4.1 Evento de Lluvia (Físico)

* **Condición**: El sensor de gotas físico marca `rainIntensity === 0`.
* **Histéresis**: Se aplica un retraso de cortesía de **10 minutos** sin detección de gotas antes de consolidar el cierre en la base de datos, previniendo cierres y aperturas consecutivas por lluvia intermitente.
* **CloseReason**: `"DRY_SENSOR"`.

### 4.2 Evento de Lluvia Inferido

El cierre se evalúa bajo las siguientes condiciones dinámicas y de seguridad:

#### A. Recuperación Solar (Día Botánico: 8:00 AM - 4:00 PM)

Se considera que la nubosidad de tormenta se disipó y el sol volvió a evaporar la humedad acumulada si $L_{now} \ge L_{recovery}$. El umbral se calcula de forma elástica con un factor de dispersión nubosa de $0.65$:
$$\alpha = 1.0 - 0.65 \cdot \left(\frac{L_{pre} - L_{min}}{L_{pre}}\right)$$
$$L_{recovery} = L_{min} + \alpha \cdot (L_{pre} - L_{min})$$

* **CloseReason**: `"SOLAR_RECOVERY"`.

#### B. Recuperación Térmica e Hídrica (Día Botánico)

La atmósfera recuperó sus temperaturas previas y la humedad empezó a descender:

* Temperatura: $T_{now} \ge \text{baselineTemp} - 1.0^\circ\text{C}$.
* Humedad: $H_{now} \le \text{baselineHum} + 5.0\%$.
* **CloseReason**: `"CLIMATE_RECOVERY"`.

#### C. Atascamiento de Variables (Día y Noche)

De noche, el rocío y la falta de radiación solar impiden que la humedad relativa baje del $99\%-100\%$. Por ende, si no hay lluvia activa, las variables se estabilizan ("atascan"). Se declara atascamiento si en los últimos 60 minutos:

* Variación de Humedad: $\text{HR}_{\max} - \text{HR}_{\min} \le 1.0\%$.
* Variación de Temperatura: $\text{T}_{\max} - \text{T}_{\min} \le 0.4^\circ\text{C}$.
* **CloseReason**: `"STAGNANT_TIMEOUT"`.

#### D. Timeout Absoluto (Día y Noche)

Ningún evento de lluvia inferido podrá permanecer abierto por más de **120 minutos (2 horas)** consecutivas.

* **CloseReason**: `"TIMEOUT_2H"`.

---

## 5. Histéresis de Reapertura y Prevención de Flapping

Para evitar falsos re-disparos a causa de la humedad residual y variaciones de viento inmediatamente después del cierre de un evento:

* Se establece un bloqueo temporal (Cooldown) de **15 minutos** tras el cierre de cualquier evento inferido. Durante esta ventana, el Scheduler ignorará cualquier delta que intente reabrir un evento de lluvia inferido.

---

## 6. Arquitectura del Frontend y Tarjeta Dedicada

Para visualizar el comportamiento del motor de inferencia:

* **EnvironmentCard Dedicada**: Se añade en el Panel de Monitoreo una tarjeta para **"Lluvia"** (Eventos Físicos) y otra tarjeta idéntica para **"Lluvia Inferida"** (Eventos Inferidos).
* **Listado e Historial**: Al hacer clic en la tarjeta de Lluvia Inferida, se despliega una lista de eventos inferidos recientes en Postgres.
* **RainCrossoverChart**: Al hacer clic en un evento inferido de la lista, el frontend descarga la telemetría histórica de InfluxDB correspondiente al rango `[startedAt - 15m, endedAt + 15m]` y genera un gráfico cruzado de variables (Lux, Hum, Temp) con ejes Y duales y una franja vertical (`ReferenceArea`) que sombrea el lapso exacto donde operó la lluvia inferida.

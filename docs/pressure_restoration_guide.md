# Guía de Restauración: Sensor de Presión Hidráulica

Este documento contiene toda la lógica, configuraciones y fragmentos de código eliminados el 06-04-2026 debido al fallo del hardware (Walfront 150PSI). Si se instala un nuevo sensor, siga estos pasos para restaurar la funcionalidada en todo el stack.

## 1. Hardware y Pinout (ESP32)

* **Sensor**: Transductor de Presión 150PSI (0.5V - 4.5V).
* **Alimentación**: 5V DC (Rojo).
* **GND**: Tierra común (Negro).
* **Señal (Pin 34)**: Entrada analógica (Verde).

> [!CAUTION]
> El sensor entrega hasta 4.5V. **ES OBLIGATORIO** usar un divisor de tensión (esquema 10kΩ/22kΩ) para no dañar el pin 34 del ESP32 (límite 3.3V).

---

## 2. Firmware (MicroPython)

### Inicialización en `setup_sensors()`

```python
    try:
        adc_pressure = ADC(Pin(34))
        adc_pressure.atten(ADC.ATTN_11DB) # Rango 0-3.3V
        
        # Oversampling de Arranque
        p_sum = 0
        for _ in range(10):
            p_sum += adc_pressure.read()
            sleep_ms(10)
        p_avg = p_sum // 10

        pressure_sensor_analog = adc_pressure
        if DEBUG: print(f"💧 Transductor Presión: Modo Calibración (Lectura Raw inicial: {p_avg})")
    except Exception as e:
        pressure_sensor_analog = None
```

### Trabajador de Monitoreo (`circuit_pressure_worker`)
Este worker analiza la presión según la fase (Reposito, Entrada Principal, Bomba).
[Ver implementación completa en Git History o backups de v0.9.6]

### Auditoría bajo demanda
```python
async def audit_pressure_task():
    def sample():
        if pressure_sensor_analog:
            return sum([pressure_sensor_analog.read() for _ in range(5)]) // 5
        return None
    await _audit_worker("pressure", sample, interval=60)
```

---

## 3. Backend (Servicios)

### Ingest (InfluxDB)
En `services/ingest/src/index.ts`, restaurar el campo en la medición `environment_metrics`:
```typescript
if (metrics.pressure !== undefined) point.setFloatField('pressure', Number(metrics.pressure))
```

Y la función de salud del filtro:
```typescript
async function processFilterHealthPacket(source: string, zone: ZoneType, context: string, payload: string) {
  const data = JSON.parse(payload)
  const point = Point.measurement('filter_health')
    .setFloatField('health_percent', Number(data.health))
    .setFloatField('pressure_reading', Number(data.pressure))
  await writeToInflux(point)
}
```

### Scheduler (Inteligencia Hidráulica)
Restaurar la lógica que analiza `parsed.history` para detectar "Marcha en Seco" en `services/scheduler/src/index.ts`.

---

## 4. Frontend (Next.js)

### Dashboard (`monitoring/page.tsx`)
Restaurar la `<EnvironmentCard>` con `selectedMetric === 'pressure'`.

### Diagnostic Panel
Restaurar el botón de auditoría en `DiagnosticPanel.tsx` y la lógica de `pressure_hw` en el estado de los componentes.

---

## 5. Tópicos MQTT Relacionados

* `PristinoPlant/Weather_Station/Exterior/filter/status`: Salud del filtro (JSON).
* `PristinoPlant/Weather_Station/Exterior/readings`: Histórico de presión en batch.
* `audit_pressure_on / audit_pressure_off`: Comandos de auditoría.

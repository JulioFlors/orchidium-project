# Integración Técnica: Sensor de Lluvia (Analog)

Este documento detalla la implementación, calibración y lógica de detección de eventos de lluvia en el proyecto PristinoPlant.

## 1. Especificaciones de Instalación (Hardware)

### Interfaz Analógica

- **Sensor**: Placa conductora de lluvia (YI-80 o similar).
- **ADC**: Conectado al pin de entrada analógica del ESP32.
- **Voltaje**: 5V preferido para mayor rango dinámico en el divisor de tensión.

### Calibración Sugerida

| Estado | Valor ADC (0-4095) | % Humedad en Placa |
| :--- | :--- | :--- |
| **Seco (Humedad Nula)** | > 3000 | 0% |
| **Humedad Teórica (Inicio)** | 2300 | 25% |
| **Lluvia Ligera** | 1900 - 2200 | 50% |
| **Tormenta / Saturado** | < 1700 | 100% |

## 2. Máquina de Estados (FSM)

El firmware utiliza una máquina de estados finitos para evitar falsos positivos por rocío o evaporación rápida.

### Estados

1. **Dry (Vigía)**: El sistema despierta cada 10 minutos para monitorizar la placa.
2. **Raining (Ráfaga)**: Al detectar valores bajo `RAIN_START_VALUE`, entra en modo "Ráfaga" (muestreo cada 1 minuto) para calcular duración e intensidad acumulada.

### Parámetros en Firmware (v0.8.5)

- `RAIN_START_VALUE`: 2300 (Entrada en modo lluvia).
- `RAIN_STOP_VALUE`: 2800 (Salida - Secado de placa).
- `RAW_INTENSITY_MIN`: 1700 (Referencia para 100% de intensidad).

## 3. Integración con el Sistema

- **MQTT**: Publica un evento JSON al finalizar la lluvia: `{"duration_seconds": X, "average_intensity_percent": Y}`.
- **Ingest Service**: Registra los eventos en la tabla `rain_events` de InfluxDB.
- **Dashboard**: Muestra la duración total de lluvia en las últimas 24h e intensidad media.

> [!TIP]
> Si la placa del sensor se ensucia con polvo u hollín, el valor basal puede bajar significativamente. Se recomienda limpiar la placa con alcohol isopropílico mensualmente para mantener la precisión.

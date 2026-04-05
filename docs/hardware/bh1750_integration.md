# Integración Técnica: Sensor de Iluminancia BH1750

Este documento detalla la implementación, diagnóstico y lecciones aprendidas sobre el uso del sensor digital de luz BH1750 en el proyecto PristinoPlant, enfocándose en los retos de comunicación a larga distancia (10 metros).

## 1. Especificaciones de Instalación (Hardware)

### Conector y Cableado (CAT6 - 10 metros)

Originalmente, el sensor se probó con jumpers cortos (<20cm). Al pasar a 10 metros de cable CAT6, surgieron problemas críticos de integridad de señal que requirieron un rediseño de la lógica de bus.

#### El problema de los Pares Trenzados (Crosstalk)

- **Falla Raíz**: Se instalaron `SDA` y `SCL` en el mismo par trenzado del cable CAT6.
- **Efecto Físico**: El trenzado de los cables está diseñado para cancelar ruidos externos (diafonía), pero al poner dos señales de datos rápidas una contra la otra (Reloj y Datos I2C), el pulso de reloj (`SCL`) indujo ruido electromagnético constante en la línea de datos (`SDA`).
- **Solución Aplicada**: Separar `SCL` de `SDA` en pares trenzados distintos. Una señal de datos se acompaño con el hilo de `GND` y la otra señal de datos con el hilo de `VCC` para actuar como blindaje.

#### Alimentación y Niveles Lógicos

- El sensor BH1750 es compatible con **3.3V** y **5V**.
- **Observación Critica (24-26 de Marzo del 2026)**: Durante las pruebas con el cable con `Crosstalk`, el sensor solo respondía a **5V**. Esto se debía a que el voltaje más alto aumentaba la relación señal-ruido (SNR), permitiendo que el ESP32 "escuchara" la señal a pesar de la interferencia. Tras corregir el cableado, el sensor opera correctamente a **3.3V**, lo cual es ideal para evitar estrés térmico y asegurar compatibilidad nativa con el ESP32.

## 2. Implementación de Software (Firmware v0.8.4)

### Cascada de Robustez (Failsafe)

El firmware implementa un arranque inteligente en tres niveles de "marchas" para garantizar la conexión ante degradación del cable o ruido ambiental:

1. **Eficiencia (Hardware I2C 100kHz)**: Intenta el periférico nativo del ESP32 para máximo ahorro de CPU.
2. **Robustez (SoftI2C 50kHz)**: Fallback por software con tiempos de bit-banging más controlados.
3. **Blindaje (SoftI2C 10kHz)**: Configuración ultra-lenta para situaciones de alta capacitancia o interferencia severa.

### Funciones y Lógica de Control

#### `setup_sensors()`

Es el motor de diagnóstico en el arranque. Realiza un barrido de la cascada y un `ping` (escritura vacía) a la dirección `0x23`. Si recibe un ACK, instancia el objeto global `illuminance_sensor` y detiene la búsqueda para agilizar el boot.

#### `illuminance_monitor_task()` (Async)

Corrutina encargada de la telemetría periódica:

- **Modo de Lectura**: Utiliza `CONT_HIRES_1` (Alta resolución, 1 lx de precisión).
- **Consumo**: Realiza lecturas cada 10 minutos en reposo, o ráfagas cada vez que se solicita un snapshot MQTT.
- **Almacenamiento**: Los datos se guardan en un `RingBuffer` (8-10 muestras) para permitir el envío de promedios o ráfagas históricas al microservicio de Ingesta.

## 3. Consideraciones de Producción vs Pruebas (Lecciones Aprendidas)

| Característica | Pruebas (Laboratorio) | Producción (Campo) |
| :--- | :--- | :--- |
| **Longitud Cable** | 0.2 m (Jumpers) | 10.0 m (CAT6) |
| **Bus I2C** | Hardware (default) | Software (SoftI2C) |
| **Frecuencia** | 400 kHz (Fast) | 10-50 kHz (Robust) |
| **Interferencia** | Nula | Crosstalk / Capacitancia |
| **Estabilización** | Instantánea | Requiere `sleep_ms(250)` tras boot |

> [!CAUTION]
> Si el sensor reporta `0 lux` o el diagnóstico falla, la causa principal suele ser mecánica. Un cable CAT6 expuesto a la intemperie en el orquideario puede sufrir de sulfatación en las puntas o fracturas por tensión. Iniciar siempre la revisión por las borneras del panel de control y de la instalación exterior.

## 4. Notas de Programación: Scope Global

Para evitar errores de tipo `NameError` en corrutinas asíncronas, la clase `BH1750` se declara como `None` a nivel global y se importa dinámicamente (`Lazy Import`) dentro de `setup_sensors` usando la palabra clave `global`. Esto asegura que las constantes de la clase (como `CONT_HIRES_1`) sean visibles en todo el firmware.

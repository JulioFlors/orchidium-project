# Especificaciones Técnicas: Actuator Controller Firmware v0.7.1

Este documento detalla la arquitectura y funcionalidades del firmware desarrollado para los módulos de relé (ESP32) encargados de la actuación de válvulas, bomba y la estación meteorológica exterior.

## Arquitectura de Software

El firmware utiliza **MicroPython** con un enfoque en ejecución asíncrona (`uasyncio`) para manejar múltiples temporizadores de riego y comunicación MQTT simultánea.

### Componentes Core

1. **`boot.py`**:
    - Conexión WiFi síncrona con timeout de 60s.
    - Inyección de DNS (Cloudflare 1.1.1.1) para mejorar la resolución de dominios en entornos rurales.
    - Sistema de actualización **OTA (Over-The-Air)** integrado antes de la ejecución del loop principal.
2. **`main.py`**:
    - Orquestrador principal de tareas.
    - Implementa el protocolo de comunicación y la lógica de negocio de los circuitos de riego.
3. **`lib/ota/`**:
    - Implementación personalizada de descarga HTTPS usando sockets crudos para minimizar el uso de RAM.

## Innovaciones en Conectividad y Robustez

### 1. Low-Speed SoftI2C (10kHz)

Para el sensor de iluminancia **BH1750**, se ha implementado un bus `SoftI2C` operando a una frecuencia reducida de **10kHz**. Esto permite compensar la capacitancia y el ruido eléctrico generados por cables largos (estación exterior), garantizando lecturas estables donde el hardware I2C estándar fallaría.

### 2. Gestión de Estado NVS (Recuperación Inteligente)

El sistema utiliza un **NVSManager** con caché en RAM para proteger la memoria Flash.

-   **Flujo**: Las tareas activas se guardan en `recovery.json`.
-   **Safe Recover**: Tras un reinicio accidental o pérdida de energía, el sistema verifica la hora vía NTP y reanuda las tareas pendientes solo si se encuentran dentro de una ventana de 20 minutos.

### 3. Sistema de Auditoría Bajo Demanda (Granular) (v0.7.7)
Para optimizar al máximo el uso de la memoria RAM activa y ciclos de CPU, el sistema de auditoría opera ahora granularmente por sensor:
-   **`AUDIT_MODE`**: Diccionario con flags independientes (`rain`, `lux`, `pressure`, `health`), por defecto en `False`.
-   **Activación (`audit_[sensor]_on`)**: Activa la recolección de historial para un sensor específico y limpia su buffer previo.
-   **Desactivación (`audit_[sensor]_off`)**: Detiene la recolección, vacía el buffer del sensor y fuerza un `gc.collect()` para liberar el heap inmediatamente.

## Protocolo MQTT

### Tópicos Principales

| Tópico | Función |
| :--- | :--- |
| `PristinoPlant/Actuator_Controller/status` | LWT (online/offline) |
| `PristinoPlant/Actuator_Controller/irrigation/cmd` | Comandos de riego (JSON) |
| `PristinoPlant/Actuator_Controller/audit/#` | Dumps de RingBuffers |
| `PristinoPlant/Actuator_Controller/event/rain` | Eventos de inicio/fin de lluvia |
| `PristinoPlant/Actuator_Controller/cmd/log` | Feedback de ejecución de comandos |

### Comandos de Auditoría (Tópico `.../cmd`)
-   `audit_[sensor]_on`: Inicia sesión de monitoreo histórico para un sensor específico (ej: `audit_lux_on`, `audit_pressure_on`, `audit_rain_on`, `audit_health_on`).
-   `audit_[sensor]_off`: Finaliza la sesión del sensor y libera RAM.
-   `audit_all`: Realiza un volcado completo de todos los buffers y estado NVS.
-   `audit_[sensor]`: Solicita el volcado inmediato de un buffer específico.
-   `scan_i2c` / `scan_adc`: Diagnóstico directo de hardware.

## Hardware mapping

- **Nebulizadores**: Pin 26
- **Fertirriego**: Pin 25
- **Aspersores**: Pin 33
- **Suelo**: Pin 32
- **Sensores**: SCL(22), SDA(21), ADC_Rain(35), ADC_Pressure(34)

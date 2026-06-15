# Plan de Implementación - weather-station-sync-consolidation

Este documento describe el plan técnico detallado para consolidar la lógica duplicada de la ventana de sincronización en la estación meteorológica.

## Proposed Changes

### Estación Meteorológica (`main.py`)

#### [MODIFY] [main.py](file:///c:/Dev/pristinoplant/firmware/weather_station/main.py)
- Crear la función auxiliar asíncrona `wait_for_sync_window(timeout_ms, wdt=None)`.
- Reemplazar el bucle de sincronización de 60s en `transmit_and_sync` con una llamada a `await wait_for_sync_window(60000)`.
- Reemplazar el bucle de sincronización de 30s en `main_transmission` con una llamada a `await wait_for_sync_window(30000, wdt)`.
- Crear el array `METRIC_BATCHES` y refactorizar `flush_telemetry_batches_async` y `flush_telemetry_batches` para procesar los búferes iterativamente (Caso A).
- Crear la función auxiliar `handle_mqtt_backoff` y refactorizar la lógica de reintento/pérdida de sesión en `mqtt_connector_task` para llamarla (Caso B).

## Plan de Verificación

### Pruebas de Sintaxis y Linting
- Dado que es MicroPython, verificaremos la sintaxis básica compilando a bytecode o mediante un validador estático si está disponible en el entorno.

### Verificación Manual
- Solicitar al usuario subir el firmware modificado a la estación meteorológica física y comprobar que realice la sincronización en los intervalos de 60s (en modo continuo) y 30s (en modo deep sleep) de forma correcta, alimentando el watchdog y logueando adecuadamente los timeouts.

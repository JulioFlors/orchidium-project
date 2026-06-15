- [x] Crear la función auxiliar asíncrona `wait_for_sync_window(timeout_ms, wdt=None)` en `main.py`.

- [x] Modificar `transmit_and_sync` en `main.py` para utilizar `wait_for_sync_window(60000)`.

- [x] Modificar `main_transmission` en `main.py` para utilizar `wait_for_sync_window(30000, wdt)`.

- [x] Consolidar el vaciado de lotes climáticos iterativamente con `METRIC_BATCHES` (Caso A).

- [x] Centralizar e implementar el backoff adaptativo de MQTT en `handle_mqtt_backoff` (Caso B).

- [x] Validar sintaxis y ejecutar pnpm lint en la carpeta app si corresponde, o verificar el código de Python.

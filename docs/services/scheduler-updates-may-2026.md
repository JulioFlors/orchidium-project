# Reporte de Actualizaciones: Scheduler (Mayo 2026)

Este documento detalla la evolución técnica del servicio `Scheduler` durante la fase de robustecimiento de mayo de 2026.

## 1. Gestión de Conectividad y Resiliencia

Se ha implementado una capa de detección semántica de estados para mejorar la estabilidad del sistema ante fallos de red.

### Detección de REBOOT vs ONLINE

- **Problema**: Los reinicios físicos del ESP32 a veces se confundían con micro-cortes de red, dejando tareas de riego en estados inconsistentes.
- **Solución**: El sistema ahora diferencia entre un reinicio frío (`REBOOT`) y una reconexión de red (`ONLINE`).
- **Acción Automática**: Ante un estado `REBOOT`, el Scheduler cancela inmediatamente todas las tareas activas asociadas a ese nodo para prevenir que los relés queden encendidos accidentalmente tras el reinicio.

### Categorización de Fallos OFFLINE

Se han definido tres orígenes posibles para el estado desconectado:

- `[BROKER]`: El servidor MQTT no está disponible.
- `[NODE]`: El nodo perdió la conexión (LWT detectado).
- `[SCHEDULER]`: El servicio perdió visibilidad o detectó inactividad prolongada.

### Watchdog de Conectividad

- Se añadió un mecanismo de Watchdog con un timeout de **90 segundos**.
- Si no se recibe ninguna señal (heartbeat o telemetría) en este periodo, el sistema marca al nodo como `OFFLINE` de forma proactiva, sin esperar al mensaje LWT del broker.

---

## 2. Motor de Ejecución: Command Sequencer

El antiguo sistema de reintentos ha evolucionado hacia una arquitectura de secuenciación más robusta.

### Del RetryManager al Sequencer

- Se refactorizó el motor para utilizar un `CommandSequencer` con colas de prioridad.
- **Ventanas de Oportunidad**: Los comandos de riego tienen una validez temporal de **20 minutos + duración de la tarea**. Esto evita que se ejecuten órdenes obsoletas si el nodo reconecta horas después de la programación original.
- **Retry Proactivo**: Al detectar una reconexión (`retryAllPending`), el secuenciador despacha inmediatamente todos los comandos en cola, priorizando la sincronización de estado (Eco Mode, Lux Sampling).

### Gestión de Confirmaciones (ACK)

- La sincronización de logs de éxito en base de datos y consola está ahora supeditada **estrictamente** a la recepción del mensaje `ACK` desde el firmware.
- Se eliminaron los logs de reintento "ruidosos", reportando únicamente el éxito con el conteo final de intentos realizados.

---

## 3. Motor de Inferencia y Clima

Mejoras en la lógica de decisión para el sistema WeatherGuard.

### Factores de Fallback (Malla Sombra)

- Para mitigar fallos en los sensores de temperatura/humedad interiores, se implementaron factores de corrección estructurales:
  - **Temperatura**: -2°C respecto al sensor exterior (efecto térmico de la malla).
  - **Humedad**: +8% HR respecto al exterior.
- Estos valores actúan como salvaguarda para mantener la lógica de riego funcional incluso con hardware degradado.

### Localización y Precisión

- **Idioma**: Todos los estados climáticos (`MUY_SOLEADO`, `SOLEADO`, `TEMPLADO`, `NUBLADO`, `LLUVIOSO`) han sido traducidos al español para mejorar la legibilidad de los reportes.
- **Nubosidad**: Se corrigió el cálculo de minutos de nublado consecutivo, iniciando el acumulador desde el tiempo actual para capturar el intervalo vivo con mayor precisión.

---

## 4. Estandarización de Telemetría

- **Nomenclatura**: Eliminación total de alias técnicos (`t`, `h`, `l`, `r`) en favor de identificadores estandarizados en todo el pipeline.
- **Backtracking**: Implementación de lógica para corregir ráfagas de datos con timestamps desincronizados, asegurando que la reconstrucción histórica en InfluxDB sea coherente.
- **Sincronización NTP**: Restauración de sincronización ligera en el arranque de los nodos para minimizar el drift temporal antes del primer reporte.

---

## 5. Optimización de RAM y Resiliencia Delegada (v0.14.0)

Se ha completado la transición hacia una arquitectura de "Dumb Node" para maximizar la estabilidad de los nodos actuadores.

### Extracción del NVS Legacy

- **Problema**: El sistema de persistencia local en Flash (`NVSManager`) consumía ~15KB de RAM críticos, provocando inestabilidad en las conexiones SSL de larga duración.
- **Solución**: Eliminación total del NVS en el firmware. Toda la responsabilidad de resiliencia operativa ahora reside en el Scheduler.
- **Resultado**: Liberación significativa de memoria RAM, permitiendo un manejo más robusto de los sockets y una limpieza atómica de zombies SSL.

### Centralización de Eventos de Lluvia (`RainEvent`)

- **Nueva Lógica**: El Scheduler ahora intercepta los estados `Raining` y `Dry` para gestionar el ciclo de vida de los eventos de lluvia en PostgreSQL.
- **Cálculo de Duración**: La duración de la lluvia ya no se calcula en el nodo. El Scheduler abre un registro `RainEvent` al detectar el primer mensaje de lluvia y lo cierra al recibir el estado seco o por timeout de inactividad (10 min).
- **Resiliencia ante Reinicios**: El modelo `RainEvent` en Postgres permite que, si el Scheduler o el nodo se reinician durante una tormenta, el evento pueda ser recuperado o cerrado semánticamente (motivos: `Dry`, `ORPHAN_TIMEOUT`, `REBOOT`).

### Recuperación Elástica de Riego

- El Scheduler asume el rol de "fuente de verdad" para las tareas de riego interrumpidas.
- Al detectar un `REBOOT` de un nodo, el Scheduler identifica automáticamente las tareas que quedaron a mitad de ejecución, calcula el tiempo remanente y las re-agenda dentro de la ventana de oportunidad dinámica.

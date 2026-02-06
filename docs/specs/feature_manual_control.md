# Análisis Funcional: Control Manual de Riego

Este documento sintetiza la implementación actual del módulo de **Control Manual** frente a los requerimientos operativos y de seguridad del Orquideario, identificando coberturas, limitaciones y pasos futuros.

## 1. Cobertura de Requerimientos Funcionales

| Requerimiento | Estado | Implementación Actual |
| :--- | :---: | :--- |
| **Acciones Definidas** | ✅ Completo | Mapeo exacto de 4 zonas: **Regar**, **Nebulizar**, **Humedecer Suelo**, **Fertirriego**. |
| **Control de Actuadores** | ✅ Completo | Orquestación correcta de hardware (Fuente + Válvula Específica + Bomba) vía MQTT. Las cards representan **Líneas de Riego**, no zonas físicas. |
| **Protección de Bomba** | ✅ Completo | **Exclusión Mutua por Software**: El sistema bloquea visual y funcionalmente la activación de zonas simultáneas para garantizar presión. |
| **Failsafe (Seguridad)** | ✅ Completo | **Timeout Automático**: El sistema se apaga forzosamente tras **10 minutos** (definido en UI y Firmware) para prevenir inundaciones si el usuario olvida apagarlo. |
| **Control de Usuario** | ✅ Completo | Capacidad de **Detener (Stop)** manualmente cualquier acción antes del timeout. |
| **Feedback Visual** | ⚠️ Parcial | Indicadores LED y estado. **Pendiente:** Animación de llenado de agua en la card mientras espera confirmación de bomba. |
| **Orquestación** | ✅ Completo | Traducción de intenciones a comandos: Abrir Válvula Main -> Abrir Válvula Zona -> Encender Bomba. |

## 2. Limitaciones y Riesgos Aceptados

### A. Bypass de Condiciones Climáticas

* **Situación:** El control manual actual **ignora** deliberadamente los sensores de lluvia y viento. Es un "override" directo.
* **Riesgo:** Regar durante lluvia o nebulizar con viento fuerte.
* **Mitigación Actual:** Advertencia visual explicita en la UI: *"Nota: El control manual ignora sensores de lluvia/viento."*

### B. Consideraciones de Comunicación MQTT

* **Flooding:** Se identificó que el envío masivo de estados (7 relés simultáneos) saturaba la conexión MQTT, causando desconexiones (`[MQTT-1]`). Se implementó un delay de `50ms` en el firmware para evitar esto.
* **Payload Optimizado:** Para el comando OFF, se debe enviar solo `{ actuator: id, state: "OFF" }`, omitiendo `duration` y `start_delay` para reducir overhead y evitar comportamientos erróneos.
* **Session Persistence:** HiveMQ Cloud (Free) no soporta persistencia de sesión. Se debe usar `clean_session=True`, lo que implica re-suscribirse en cada conexión.
* **Latencia:** Se debe gestionar la latencia de red en la UI (feedback optimista o loaders).

### C. Dependencia de Conectividad

* **Situación:** La exclusión mutua reside en la lógica del Frontend (React).
* **Riesgo:** Si dos usuarios usan la app simultáneamente en dispositivos diferentes, podrían teóricamente activar dos zonas a la vez (Race Condition).
* **Mitigación:** El firmware tiene protecciones básicas, pero idealmente la exclusión mutua estricta debe migrarse al Firmware en el futuro.

### D. Estrategia de Suscripciones Frontend

* **Situación Actual:** El frontend se suscribe individualmente a cada tópico de válvula (`.../sprinkler`, `.../fogger`, etc.).
* **Optimizaciones Posibles:**
    1. **Wildcard:** Suscribirse a `.../irrigation/state/valve/#` para recibir todos los estados de válvulas.
    2. **Tópico de Bomba:** Suscribirse a `.../irrigation/state/pump` para la confirmación física.
    3. **Tópico de Estado ("Online"):** `.../status` solo publica `online` como heartbeat.
* **Recomendación:** Usar Wildcard + Pump + Status.

### E. Lógica de Feedback UI Avanzada

* **Animación de Carga:** El usuario requiere una animación de **"llenado de agua"** en la card (del color correspondiente) que progrese hasta que la **Bomba** confirme `ON`.
* **Estado Activo:** El botón UI solo se muestra "Activo" cuando `Válvula ON` AND `Bomba ON`.

### F. Gestión de Orfandad (Offline Fallback / Estado Zombie)

* **Situación (Bug):** Cuando una card es activada y el dispositivo IoT (ESP32) se desconecta o pierde internet, la card en el frontend queda visualmente "activada" (Zombie) indefinidamente.
* **Riesgo:** Inconsistencia entre la UI y la realidad (la bomba podría estar apagada o encendida, pero la UI no lo refleja). Si el internet falla, la UI pierde capacidad de control.
* **Requerimiento:**
    1. **Limpieza de Estado:** El frontend debe detectar la desconexión del dispositivo (heartbeat perdido) y gestionar el estado visual de las cards.
    2. **Temporizador de Respaldo:** La animación de activación debe tener su propio temporizador local. Si el dispositivo no envía señal de apagado al terminar el tiempo, la UI debe asumir el apagado o permitir al usuario forzarlo.
    3. **Reconexión:** Al reconectarse, sincronizar el estado real o permitir apagado manual.

## 3. Hoja de Ruta (Roadmap) Refinada

Para alcanzar la excelencia operativa, se proponen las siguientes mejoras:

### A. Smart Safety Engine (Motor de Inferencia Climática)

Este será el cerebro de seguridad preventiva del sistema:

* **Fuentes de Datos:**
    1. Sensores Internos (Humedad, Temperatura, Luminosidad).
    2. Sensor de Lluvia Externo (Detección binaria).
    3. **Histórico de Datos:** Base de datos para inferir "Horas Acumuladas de Lluvia/Humedad".
* **Acciones:**
  * **Bloqueo Preventivo:** Cancelar tareas automáticas si las condiciones son adversas.
  * **Alerta de Usuario:** Notificación visual (tipo "Tacómetro" Verde/Amarillo/Rojo) indicando si es seguro regar manualmente.
  * **Confirmación Manual:** Si el usuario insiste en riego manual bajo alerta roja, solicitar confirmación explícita.
* **Configuración:** Se requiere definir dónde residirán los umbrales de este motor (¿Base de datos? ¿Archivo de configuración?).

### B. Gestión de Horarios (Scheduling)

    * Separar estrictamente el **Control Manual** (Acción Inmediata) de la **Programación** (Tareas Futuras).
    * Crear una vista dedicada para "Rutinas de Riego" donde sí se apliquen reglas climáticas estrictas por defecto.

## Conclusión

El módulo actual **cumple con los requerimientos críticos de operatividad y seguridad mecánica (bomba)**. La limitación sobre condiciones climáticas es conocida y está gestionada mediante advertencias al usuario, lo cual es aceptable para una fase de control manual directo.

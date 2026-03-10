# PristinoPlant Task State Machine

Este documento define la máquina de estados (`TaskStatus`) utilizada en el ecosistema PristinoPlant para la orquestación de tareas de riego, fertirriego y fumigación entre el **Backend (Scheduler)** y el **Nodo Actuador (Hardware IoT)**.

La fuente de la verdad para el estado de una tarea radica en la sincronización precisa mediante la telemetría MQTT reportada por los dispositivos físicos.

## Estados Disponibles (`TaskStatus`)

| Estado | Significado Contextual | Responsabilidad / Gatillo (Trigger) |
| :-- | :-- | :-- |
| `PENDING` | Tarea programada a futuro. | **Backend/Usuario**: Toda tarea nace en estado `PENDING` al ser agendada en la bitácora (`TaskLog`), ya sea de forma manual diferida o generada por los cronjobs recurrentes de las rutinas. |
| `WAITING_CONFIRMATION` | Tarea retenida esperando intervención humana. | **Backend**: De uso exclusivo (por ahora) para **Agroquímicos (Fertilización/Fumigación)**. El Scheduler pone la tarea en este estado 12h, 6h, 2h y 1h antes de ejecutarse si requiere que un humano autorice la acción físicamente (ej. confirmar que los tanques de químico tienen mezcla). |
| `CONFIRMED` | Recepción asegurada por el Hardware (`ACK`). | **Nodo Actuador**: Exclusivo para auditoría de red. Cuando el Scheduler despacha el comando por MQTT, la tarea permanece "enviada". Solo cuando el Nodo Actuador eco-pública (echoes) el JSON exacto recibido bajo el tópico `.../cmd/received`, el Backend asienta la tarea como `CONFIRMED`. Esto certifica que el hardware tiene la orden en memoria. |
| `IN_PROGRESS` | Actuación física en curso. | **Nodo Actuador**: El circuito eléctrico está energizado. Se dispara cuando el Nodo reporta MQTT telemetría de válvulas igual a `ON`. Se recomienda que la tarea quede atada de forma unívoca para evitar colisiones. |
| `COMPLETED` | Ejecución finalizada con éxito de forma limpia. | **Nodo Actuador**: El hardware certifica que el temporizador interno del circuito o bomba finalizó su tiempo sin cortes de energía, reportando `OFF` en el tópico físico. |
| `FAILED` | Fallo físico, lógico o de red insalvable. | **Microcontrolador / Backend**: Puede dispararse si: (1) El nodo entra offline durante la ejecución. (2) Falla un relevador. (3) El Garbage Collector del backend detecta tareas atascadas que nunca pasaron de CONFIRMED o se quedaron en IN_PROGRESS huérfanas luego de las ventanas de recuperación. |
| `CANCELLED` | Aborto provocado previo al inicio. | **Backend / Usuario / Clima**: Se dispara si el usuario descarta una tarea esperando por él, o si la lógica meteorológica (exceso acumulado de lluvia) anula la necesidad del riego antes de mandarse al hardware. |
| `SKIPPED` | Omisión intencional planificada. | *(Uso futuro)*: Para manejar saltos en cronogramas cuando la inteligencia ambiental decide posponer una rutina sin marcarla estrictamente como "cancelada" (ej. humedad del sustrato aún muy alta en orquídeas que requieren ciclo de sequía). |

## Ciclo de Vida Principal (Riego Estándar)

1. Creación: `PENDING` (Agendado a las 8:00 AM)
2. El Scheduler despacha Payload MQTT a las 8:00 AM.
3. El Nodo recibe el Payload y lo reenvía a `.../cmd/received`.
   - Result: El backend marca `CONFIRMED`.
4. El Nodo energiza relés e informa `estado: ON`
   - Result: El backend marca `IN_PROGRESS`.
5. Pasa el tiempo (ej. 15 min). El Nodo apaga la bomba e informa `estado: OFF`.
   - Result: El backend marca `COMPLETED`.

## Ciclo de Vida Controlado (Agroquímicos)

1. Creación: `PENDING`.
2. A las -12hs: El Scheduler cambia a `WAITING_CONFIRMATION`. Notifica al usuario.
3. El usuario desde la app interactúa y confirma ("Tanque Listo").
   - Result: La tarea vuelve a la cola prioritaria o `PENDING` (Lista para ejecución a tiempo).
4. Proceden pasos 2 al 5 del ciclo estándar.

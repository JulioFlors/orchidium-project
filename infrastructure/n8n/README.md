# Documentación de Workflows n8n - PristinoPlant Bot & Alertas

Este documento resume la arquitectura, problemas detectados, causas raíz y soluciones aplicadas en los workflows de n8n que integran Telegram con PristinoPlant.

---

## 1. Workflow de Comandos PristinoBot (`WLNpw9BIrUrmCMuK`)

### Funcionalidad
Maneja las interacciones del cultivador con Telegram a través de comandos interactivos (`/status`, `/dosing`, `/help`).

---

### Problemas Detectados y Soluciones

#### Problema A: El menú de `/help` se enviaba en paralelo al seleccionar opciones en `/dosing`
* **Síntoma**: Al hacer clic en un botón de rango de tiempo (ej. "Esta Semana"), el bot editaba el mensaje correctamente pero enviaba de forma adicional el menú principal `/help`.
* **Causa Raíz**: El nodo Switch (`Enrutador de Comandos`) conservaba conexiones heredadas en sus salidas 1 y 2 apuntando simultáneamente hacia nodos obsoletos y hacia `Responder Telegram (Help)`.
* **Solución**: Se purgaron quirúrgicamente las conexiones paralelas y nodos obsoletos (`Consultar BD (Dosing)`, `Responder Telegram (Dosing)`). Se configuró `"fallbackOutput": "none"` en el Switch para garantizar que solo la ruta explícita 4 responda a `/help`.

#### Problema B: Faltaban tareas pendientes proyectadas en Telegram
* **Síntoma**: La vista web mostraba 5 tareas (3 completadas y 2 pendientes proyectadas), pero Telegram solo mostraba 3 completadas.
* **Causa Raíz**: La consulta SQL solo buscaba en la tabla `ManualDosingLog`. En PristinoPlant, las tareas pendientes de rutinas manuales activas residen en `AutomationSchedule` (`executionType = 'MANUAL'`).
* **Solución**: Se implementó una consulta SQL con `WITH ... UNION ALL` que une `ManualDosingLog` (logs reales) con `AutomationSchedule` (rutinas manuales proyectadas), devolviendo el espectro completo de tareas.

#### Problema C: La línea en blanco inicial no se renderizaba en Telegram
* **Síntoma**: La API de Telegram trunca de forma nativa los saltos de línea iniciales (`\n`) en mensajes Markdown.
* **Causa Raíz**: Recorte automático (*trimming*) de espacios en blanco en la API de Telegram Bot.
* **Solución**: Se inyectó un carácter espacial de ancho cero (`\u200B`) previo al primer salto de línea: `\u200B\n*Tareas de Dosificación*`.

#### Problema D: Mapeo de Zonas en Español y Formato Estético
* **Solución**: Se incorporó un diccionario de constantes en JavaScript dentro del nodo de formateo alineado con [`app/src/config/mappings.ts`](file:///c:/Dev/pristinoplant/app/src/config/mappings.ts):
  - `ZONA_A` ➔ `Orquideario`
  - `ZONA_B` ➔ `Jardín`
  - `ZONA_C` ➔ `Terraza`
  - `ZONA_D` ➔ `Ventanas`
  - `EXTERIOR` ➔ `Exterior`
  - Mapeo de estados: `PENDING` ➔ `Pendiente`, `COMPLETED` ➔ `Completada`, `CANCELLED` ➔ `Cancelada`.

---

## 2. Workflow de Notificaciones de Agroquímicos (`dosing_notifications.json`)

### Funcionalidad
1. **Confirmación Push de Hardware (12h Antes)**: Escucha la tabla `Notification` en Postgres para notificaciones de tipo `AGROCHEMICAL_CONFIRM`. Envía al grupo de Telegram una tarjeta interactiva con botones:
   - `[ ✅ Confirmar Tanque ]` ➔ Actualiza `TaskLog` a `AUTHORIZED` para autorizar la apertura del circuito al llegar la hora.
   - `[ ⏱️ Posponer 24h / 48h ]` ➔ Reagenda `scheduledAt` en `TaskLog`.
   - `[ ❌ Cancelar ]` ➔ Transiciona a `CANCELLED`.
2. **Comando Interactivo `/complete` o `/completar`**: Permite al cultivador listar tareas manuales pendientes (`PENDING`) de días pasados y del día de hoy, ofreciendo botones interactivos `[ ✅ Marcar como Completada ]` por cada tarea listada.


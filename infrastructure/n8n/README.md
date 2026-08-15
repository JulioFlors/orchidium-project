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
* **Causa Raíz**: La consulta SQL solo buscaba en la tabla de logs. En PristinoPlant, las tareas pendientes de rutinas de dosificación activas residen en `DosingSchedule`.
* **Solución**: Se implementó una consulta SQL con `WITH ... UNION ALL` que une `DosingLog` (logs reales) con `DosingSchedule` (rutinas de dosificación proyectadas), devolviendo el espectro completo de tareas.

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

## 3. Workflow de Alertas Correlacionadas de Nodos (`41CiAhh3PtZig32w` / `alertas_nodos.json`)

### Funcionalidad
Supervisa continuamente el estado de conectividad del **Nodo EMA** (Estación Meteorológica) y del **Nodo Actuador** en PostgreSQL (`DeviceLog`).

---

### Tolerancia a Micro-Fallos y Lógica de Estabilización

#### Problema Detectado: Falsas Alertas por Desconexiones Transitorias
* **Síntoma**: Si el Nodo EMA experimentaba una micro-caída de red WiFi/MQTT de 50 segundos, pasaba brevemente a `OFFLINE`, luego a `REBOOT` (reinicio) y finalmente a `SLEEP` (sueño forzado). El workflow anterior leía el `OFFLINE` de inmediato y enviaba una falsa alarma de "Batería Agotada".
* **Causa Raíz**: Falta de una ventana de tolerancia temporal que permitiera al firmware del hardware y al `@/services/scheduler` estabilizar el estado real del nodo.

#### Solución Implementada: Ventana de Confirmación de 10 Minutos
* **Regla de 10 Minutos**: El workflow **no dispara alertas inmediatas** al leer un cambio a `OFFLINE`. En su lugar, calcula el tiempo transcurrido en `OFFLINE` (`ema_status_seconds`).
* **Ventana de Notificación Única**: Únicamente cuando el Nodo EMA ha permanecido en `OFFLINE` de forma **continua e ininterrumpida por $\ge 10$ minutos** (`600s <= ema_status_seconds < 660s`), el workflow procede a evaluar y alertar.
* **Recuperación Silenciosa**: Si dentro de esa ventana de 10 minutos el nodo se reinicia (`REBOOT`), se reconecta (`ONLINE`) o pasa a suspensión segura (`SLEEP`), la alerta se cancela automáticamente con cero ruido para el usuario.

---

### Casos de Notificación y Formato

1. **Caso A: Sin Conexión WiFi (Apagón General / Corte Eléctrico > 1h)**
   - Condición: Nodo EMA `OFFLINE` continuo por $\ge 10$ min **Y** Nodo Actuador `OFFLINE` por $\ge 5$ min.
   - Mensaje:
     ```text

     *Sin Conexión WiFi*

     *Nodo EMA:* OFFLINE
     *Nodo Actuador:* OFFLINE
     ```

2. **Caso B: Batería Agotada (Agotamiento de Celdas EMA)**
   - Condición: Nodo EMA `OFFLINE` continuo por $\ge 10$ min **Y** Nodo Actuador `ONLINE`/`SLEEP` (red eléctrica activa).
   - Mensaje:
     ```text

     *Bateria Agotada*

     *Nodo EMA:* OFFLINE
     ```

3. **Caso C: Restablecimiento Operativo**
   - Condición: Nodo EMA pasa de un `OFFLINE` previo confirmado a `ONLINE` o `SLEEP`.
   - Mensaje:
     ```text

     *Nodo EMA* Operativo.
     ```



# Especificación: queue-ui-refactor

Esta especificación detalla los cambios requeridos en la interfaz de usuario de la cola de ejecución (`QueueView` y `QueueTaskCard`), incluyendo restricciones operacionales y la alineación visual del modal de cancelación y los estados de tareas con el historial.

## 1. Requerimientos

### 1.1 Restricción de Posposición en ActionMenu
- Las opciones de **"Posponer 24h"** y **"Posponer 48h"** en [ActionMenu.tsx](file:///c:/Dev/pristinoplant/app/src/components/ui/action-menu/ActionMenu.tsx) dentro de [QueueTaskCard.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/components/QueueTaskCard.tsx) deben restringirse de manera estricta.
- Estas opciones **únicamente** deben estar disponibles para tareas que pertenezcan a los circuitos de **Fertirriego** (`FERTIGATION`) y **Control Fitosanitario** (`FUMIGATION`), ya que ambos utilizan el mismo circuito físico.

### 1.2 Unificación de Badges y Consistencia de Estados
- [QueueTaskCard.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/components/QueueTaskCard.tsx) no debe mostrar múltiples badges. Se debe unificar a un **solo badge** como en [HistoryTaskCard.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/history/ui/components/HistoryTaskCard.tsx).
- El badge de estado `agendada` ya no es necesario (estando en la cola de ejecución se infiere).
- El estado `PENDING` (anteriormente mostrado como `En espera` o `Agendada` dependiendo de si la fecha era pasada) debe ser consistente con el historial en [HistoryView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/history/ui/HistoryView.tsx): se mostrará como **"Pendiente"** y en **azul** (clase de estilo correspondiente a `PENDING` de `TaskStatusStyles`).
- El subtítulo de la card debe tener un label dinámico estructurado de la siguiente forma según su origen (`source` / `isRoutine`):
  - **Rutina**: `Rutina #[ID] [Nombre de la rutina]` (ej. `Rutina #3b2c1d Aspersión de la mañana`)
  - **Diferido**: `Diferido #[ID] [Notas/Justificación]` (ej. `Diferido #a8c1f0 Posponer por clima`)
  - **Inferencia**: `Inferencia #[ID] [Notas/Regla en la que se basó]` (ej. `Inferencia #d4e2a1 [ DAILY RULES ] Riego diferido de emergencia por límite de 3 días secos.`)
- Si el ID comienza por `routine-` (tarea proyectada no guardada en base de datos), se muestra sin el `#id`.

### 1.3 Rediseño Estético del Modal de Cancelación
- La estructura del modal de cancelación en [QueueView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/QueueView.tsx) debe rehacerse imitando la estructura de `DeferredTaskModal.tsx`.
- **Título del modal**: Debe ser el nombre del circuito de la tarea (ej. `Humectación del Suelo` o `Riego por Aspersión` + ` #id` si posee ID).
- **Fila secundaria**: Se debe agregar una fila para mostrar la fecha y hora agendada en la que se debía ejecutar la tarea.
- **Campos**: Eliminar los campos innecesarios y mantener únicamente el campo de texto para el motivo de cancelación, renombrando su título/label a **"Motivo de cancelación"**.
- **Acciones**: Botones con proporciones mejoradas y colores semánticos (botón de confirmación destructivo y botón de cancelar/volver ghost).

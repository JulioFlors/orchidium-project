# Plan de Implementación - queue-ui-refactor

Este documento describe el plan técnico detallado para modificar la interfaz de la cola de ejecución de tareas según las especificaciones del archivo `spec.md`.

## Proposed Changes

### Componente de Cola de Tareas (`QueueTaskCard.tsx`)

#### [MODIFY] [QueueTaskCard.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/components/QueueTaskCard.tsx)
- Restringir la adición de los items `Posponer 24h` y `Posponer 48h` a la variable `menuItems` evaluando la condición `task.purpose === 'FERTIGATION' || task.purpose === 'FUMIGATION'`.
- Remover el componente `<SourceBadge />`.
- Unificar la renderización de la cabecera de la card para que use únicamente el `<TaskStatusBadge />`.
- Formatear el subtítulo dinámico según la estructura definida:
  - Definir la fuente (Rutina, Diferido, Inferencia) basándose en `task.source` o `task.isRoutine`.
  - Construir el string del ID si no empieza con `routine-` (formato `#[id.slice(0, 8)]`).
  - Mostrar la información secundaria apropiada (nombre de la rutina, notas/justificación o nota de inferencia).

### Badge de Estado de Tareas (`TaskStatusBadge.tsx`)

#### [MODIFY] [TaskStatusBadge.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/components/TaskStatusBadge.tsx)
- Cambiar la configuración de `PENDING` para mapearla consistentemente a:
  - `label: 'Pendiente'`
  - `className: 'border-none bg-blue-500/10 text-blue-600 dark:text-blue-400'` (azul, idéntico al estilo e iconografía del historial).

### Vista de Cola y Modal de Cancelación (`QueueView.tsx`)

#### [MODIFY] [QueueView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(operations)/queue/ui/QueueView.tsx)
- Modificar el objeto de estado `cancelTarget` para incluir toda la información necesaria (id, label, scheduledAt, source).
- Rediseñar el componente `<Modal>` de cancelación para imitar la estructura y proporciones de `DeferredTaskModal.tsx`.
- Mostrar en el título el circuito y, de tener ID y no ser proyectada (`routine-`), añadir ` #id.substring(0,8)`.
- Crear una fila secundaria con un icono de calendario y hora que visualice la fecha y hora de ejecución planificada.
- Ajustar el label del `textarea` a "Motivo de cancelación" y mantener las clases de borde, foco y tipografía del sistema de diseño.

## Plan de Verificación

### Pruebas Manuales
- Verificar que las tarjetas de la cola de ejecución ahora tengan un solo badge azul de "Pendiente" y muestren el label de origen en el subtítulo.
- Verificar que las opciones de posponer 24h y 48h en el menú de acciones aparezcan para tareas de Fertirriego y Control Fitosanitario.
- Confirmar que al abrir el modal de cancelación para cualquier tarea de la cola, la interfaz tenga proporciones idénticas a las del modal de agendar, con el título correcto, la fecha de ejecución planificada en una fila secundaria y el label "Motivo de cancelación".

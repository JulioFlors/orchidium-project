# Feature Specification: Veto de Inferencia en Tareas Postergadas

## Contexto y Motivación

Actualmente, cuando una rutina programada (por ejemplo, "Riego Interdiario") intenta ejecutarse mediante el cron en `runTask`, pero el Nodo Actuador no está listo o está offline, el sistema posterga la tarea creando una entrada en la tabla `TaskLog` con el estado `PENDING`. 

El problema es que esta postergación ocurre **antes** de evaluar el Motor de Inferencia (`InferenceEngine.evaluate`). Cuando el Nodo Actuador vuelve a estar en línea, el despachador de tareas pendientes en `task-manager.ts` (`pollPostponedTasks`) reactiva la tarea pendiente y la ejecuta llamando a `processTaskLog(task)`. Esta función despacha directamente la tarea a través de MQTT a menos que esté lloviendo en ese instante preciso, saltándose por completo la evaluación del Motor de Inferencia y evadiendo todos los vetos climáticos (como el de lluvia del día anterior).

## Requerimientos

1. **Evaluación de Inferencia en Tareas Reactivadas**:
   - Al reactivar una tarea postergada con origen automático (`ROUTINE` o `INFERENCE`) en `processTaskLog`, se debe evaluar si las condiciones actuales o históricas ameritan la cancelación por veto climático.
   - Si la evaluación del Motor de Inferencia determina que la tarea debe cancelarse (`shouldCancel === true`), la tarea reactivada debe marcarse como `CANCELLED` con la razón del veto.

2. **Preservar Origen Manual**:
   - Las tareas que tienen origen manual (`MANUAL`) no deben ser sujetas a vetos automáticos del Motor de Inferencia al ser procesadas o reactivadas, respetando la decisión del usuario.

## Criterios de Aceptación

- Las tareas reactivadas que se originaron de rutinas automáticas deben pasar por la validación de inferencia climática antes de ser despachadas.
- Si hay un veto climático (por ejemplo, lluvia ayer), la tarea reactivada debe cancelarse con el estado `CANCELLED` y registrar la razón correspondiente en Postgres.
- Las tareas manuales no se ven afectadas por este veto y se despachan al estar en línea el nodo.

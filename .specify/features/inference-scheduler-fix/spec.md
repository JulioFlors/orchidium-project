# Feature Specification: Reestructuración de Reglas Diarias, Gestión de Zonas y Corrección de Desfases del Scheduler

## Contexto y Motivación

Actualmente el Scheduler de Pristinoplant posee reglas de automatización inteligente basadas en una máquina de estados diaria (`evaluateDailyRules`). Sin embargo, se han identificado varios comportamientos incorrectos y fallos en la lógica de control:

1. **Límite de Emergencia Ineficaz**: El sistema programa un riego diferido si no ha detectado riegos en 3 días. No obstante, no asocia adecuadamente que la presencia de lluvias (registrada en `RainEvent`) u omisiones voluntarias con motivo climático justifican la ausencia de riego artificial, generando quejas y programaciones redundantes.
2. **Momento de Evaluación Inadecuado**: Las reglas diarias de la máquina de estados se evalúan a las 8:00 PM o 12:10 AM, lo cual genera desfases con la realidad climática del día siguiente. Toda evaluación climática y de necesidad de riego diferido debe realizarse de forma inmediata antes de la ventana operativa de riego programado matutino (ej. a las 5:30 AM o 6:00 AM) para usar los datos meteorológicos más frescos.
3. **Desfase Horario**: Se ha detectado un desfase de 4 horas en la programación de tareas diferidas (`createDeferredIrrigation`), agendando riegos a las 2:00 AM UTC en lugar de las 6:00 AM hora local (debido a la mala conversión de fechas UTC en servidores con hora de sistema desfasada).
4. **Colisión de Zonas Inactivas**: Las tareas programadas diferidas por inferencia asignan la aspersión a múltiples zonas que no están activas ni poseen sistemas físicos de riego instalados (`[ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D]`). El sistema debe restringir los riegos automáticos diferidos únicamente a las zonas válidas y activas (`ZONA_A`, alias Orquideario).

---

## Requerimientos

### 1. Eliminación / Reemplazo del "Límite de Emergencia" Tradicional
- **Redefinición**: Eliminar el límite arbitrario de 3 días consecutivos secos sin contemplar causas climáticas.
- **Evidencia de Lluvia**: Si existe un `RainEvent` registrado o una tarea cancelada por Veto Climático en los últimos 3 días, la condición de emergencia no debe dispararse.
- **Restricción a Zonas Activas**: Cualquier tarea diferida de emergencia o reprogramada por alternancia debe agendarse únicamente para `ZoneType.ZONA_A` (Orquideario).

### 2. Sincronización Temporal de la Evaluación
- **Momento del Cron**: Mover la evaluación de `evaluateDailyRules` de las 8:00 PM a las **05:45 AM America/Caracas**.
- **Justificación**: Esto garantiza que las decisiones de riego diferido para las 6:00 AM se tomen con las métricas de lluvia e hidratación foliar recolectadas durante la madrugada del mismo día.
- **Alineación de Hora Local**: Corregir `createDeferredIrrigation` para que asigne la fecha del slot usando explícitamente el desfase UTC de Caracas (`America/Caracas` o -4h) para evitar que las 6:00 AM locales se graben como las 2:00 AM local en base de datos.

### 3. Alternancia y Estados del Scheduler
- Si un riego fue cancelado por lluvia o veto climático, no se debe forzar una reprogramación diferida para el día siguiente inmediato si las condiciones ambientales persisten húmedas o si hay lluvia pronosticada.

---

## Criterios de Aceptación
- Las tareas creadas con origen `TaskSource.INFERENCE` solo deben tener asignada la zona `ZONA_A`.
- La hora de ejecución programada en base de datos para la tarea de las 6:00 AM local de Caracas debe grabarse en UTC como `10:00:00Z` (para el huso UTC-4), previniendo que se dispare en horas nocturnas (2:00 AM local).
- No se deben generar tareas diferidas si hubo lluvias con duración sustancial en las últimas 24-48 horas.

# Resumen de Cambios: Corrección de Formato de Logs y Bugs del Scheduler

Se han completado y validado todas las tareas del sprint para solucionar los problemas identificados en el Scheduler: la división incorrecta de logs por conteo ANSI, el crash de arranque en la hidratación de Prisma y la categorización incorrecta del log de suspensión del EMA.

## Cambios Realizados

1. **Logger (`services/scheduler/src/lib/logger.ts`)**:
   - Se implementó la función auxiliar `cleanAnsi(str)` para limpiar expresiones de color de escape ANSI en la consola.
   - Se modificó `formatLog` para utilizar `cleanAnsi` al calcular el tamaño de las palabras y la línea actual acumulada, previniendo que los colores alteren la medición.
   - Se fijó `maxMsgLen = 80` para el contenido del mensaje (sin incluir cabeceras), permitiendo que mensajes cortos (menores a 80 caracteres visuales) se impriman completos en una sola línea.

2. **Inicialización y Filtros (`services/scheduler/src/index.ts`)**:
   - Se corrigió el error crítico de validación de Prisma reemplazando la columna obsoleta `isVirtual` por `isInfered: isVirtual` en la consulta `prisma.rainEvent.findFirst` dentro de `openRainEvent`.
   - Se cambió el tipo de log de `Logger.rain` a `Logger.info` al registrar la suspensión proactiva del EMA.

## Verificación

- **Compilación**: Se ejecutó `pnpm scheduler:build` de manera exitosa.
- **Linter**: Se ejecutó `pnpm lint:fix` resolviendo todas las advertencias estéticas y garantizando la sanidad estructural del código.

# Lista de Tareas: Corrección de Formato de Logs y Bugs del Scheduler

- [x] Corregir la fragmentación de logs en `logger.ts` aplicando limpieza ANSI y límite de 80 caracteres de contenido real.
- [x] Corregir el argumento `isVirtual` por `isInfered` en `prisma.rainEvent.findFirst` en `index.ts`.
- [x] Cambiar el log de EMA marcado proactivamente en SLEEP a tipo INFO en `index.ts`.
- [x] Compilar y verificar el Scheduler (`pnpm scheduler:build`).
- [x] Ejecutar el linter y validar formato (`pnpm lint:fix`).

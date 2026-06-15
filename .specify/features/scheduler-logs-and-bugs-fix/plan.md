# Plan de Implementación: Corrección de Formato de Logs y Bugs del Scheduler

Este documento propone la solución técnica detallada para corregir los bugs identificados en el Logger y en el Scheduler.

## 1. Cambios Propuestos

### Componente: Scheduler (`services/scheduler`)

#### [MODIFY] [logger.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/lib/logger.ts)
- Implementar la función `cleanAnsi` para remover de forma segura los códigos de escape de color ANSI de la terminal:
  ```typescript
  function cleanAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '')
  }
  ```
- Ajustar `maxMsgLen = 80` de forma fija para que el contenido del mensaje pueda medir hasta 80 caracteres de texto real (sin incluir la cabecera del log).
- Modificar el ciclo de fragmentación en `formatLog` para que la medición del largo de palabras y líneas se realice sobre el string limpio retornado por `cleanAnsi`:
  ```typescript
  if (cleanAnsi(word).length > maxMsgLen) {
    // ...
    while (cleanAnsi(remaining).length > maxMsgLen) {
      // ...
    }
  } else if (cleanAnsi(currentLine ? currentLine + ' ' + word : word).length > maxMsgLen) {
    // ...
  }
  ```

#### [MODIFY] [index.ts](file:///c:/Dev/pristinoplant/services/scheduler/src/index.ts)
- Modificar la consulta `findFirst` en `openRainEvent` para usar `isInfered: isVirtual` en lugar de `isVirtual` directamente:
  ```typescript
  const existing = await prisma.rainEvent.findFirst({
    where: { zone: 'EXTERIOR', endedAt: null, isInfered: isVirtual },
    orderBy: { startedAt: 'desc' },
  })
  ```
- Cambiar la invocación de `Logger.rain` a `Logger.info` al suspender proactivamente el EMA:
  ```typescript
  Logger.info('EMA marcado proactivamente en SLEEP al enviar comando')
  ```

## 2. Plan de Verificación

### Pruebas Automatizadas
- Compilar el Scheduler para garantizar la sanidad sintáctica:
  ```bash
  pnpm scheduler:build
  ```
- Ejecutar el linter para asegurar que cumpla con el formato:
  ```bash
  pnpm lint
  ```

### Pruebas Manuales
- Verificar que el script de prueba del scheduler compile y arranque sin crasheos de Prisma.

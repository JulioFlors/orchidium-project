# Especificación de Feature: Corrección de Formato de Logs y Bugs del Scheduler

Este documento define la especificación para solucionar los bugs identificados en el Scheduler, incluyendo la división incorrecta de logs por formato, el error de sintaxis en Prisma (`isVirtual`), y la categorización incorrecta de los logs de suspensión del EMA.

## 1. Problemas Identificados

### Bug A: División Incorrecta de Logs (Largo de Línea)
La lógica actual del Logger en `services/scheduler/src/lib/logger.ts` fragmenta el mensaje si la longitud total de la línea (incluyendo la cabecera) supera los 80 caracteres. Esto deja aproximadamente 39 caracteres para el contenido del mensaje.
Además:
- El algoritmo incluye los códigos de escape ANSI de colores de la terminal al medir la longitud del mensaje, provocando que mensajes cortos coloreados se corten de forma errática.
- Se requiere que el límite de 80 caracteres se aplique únicamente al **contenido real** del mensaje (sin contar los códigos ANSI de color ni la cabecera del log).

### Bug B: Error de Sintaxis de Prisma (`isVirtual` en findFirst)
Durante el arranque, al intentar hidratar el estado de lluvia desde Postgres, el Scheduler arroja un error crítico:
```
Unknown argument `isVirtual`. Available options are marked with ?.
```
Esto ocurre en `services/scheduler/src/index.ts` al invocar `prisma.rainEvent.findFirst` utilizando la propiedad `isVirtual` como filtro, cuando en el modelo real el campo de la base de datos se renombró a `isInfered`.

### Bug C: Log del EMA en Sleep semánticamente incorrecto
Cuando el EMA es suspendido proactivamente al enviarse el comando `sleep`, el logger escribe el log bajo el tag `🌧️ [ RAIN ]`:
```
[ 15/06/2026, 03:27 am ] 🌧️ [ RAIN ] EMA marcado proactivamente en SLEEP al enviar comando
```
Dado que es una operación de control y administración del dispositivo (estado del nodo), debe ser catalogada como `📡 [ INFO ]` en lugar de `🌧️ [ RAIN ]`.

## 2. Comportamiento Esperado

### Formateador de Logs (`logger.ts`):
- Los logs no deben dividirse a menos que el contenido limpio de su mensaje (sin contar colores ANSI ni la cabecera) supere los 80 caracteres.
- Se debe implementar una limpieza de códigos de escape ANSI antes de evaluar la longitud de palabras y líneas para evitar falsos cortes.

### Hidratación del Estado de Lluvia (`index.ts`):
- El filtro de consulta de Prisma debe utilizar `isInfered: isVirtual` en lugar de `isVirtual` directamente para coincidir con el esquema.

### Registro del EMA en Sleep (`index.ts`):
- El log del EMA marcado proactivamente en sleep debe registrarse con `Logger.info` (`📡 [ INFO ]`).

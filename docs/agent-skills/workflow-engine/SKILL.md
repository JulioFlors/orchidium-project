---
name: consultando-protocolo
description: Protocolo maestro de desarrollo. Define convenciones git, manejo de archivos y stack tecnológico. Úsese para alinear el comportamiento del agente.
---

# Protocolo de Desarrollo Pristinoplant

Este documento define las directrices, convenciones y flujos de trabajo ESTRICTOS para el desarrollo del proyecto "Pristinoplant".

## Cuándo Usar esta Habilidad

- **Inicio de Sesión**: Al comenzar a trabajar para cargar el contexto y reglas.
- **Antes de Commits**: Para validar el formato de mensajes y el flujo de `commit.txt`.
- **Dudas de Proceso**: Cuando no estés seguro de qué rama usar o cómo sincronizar.
- **Configuración**: Para consultar comandos específicos (`pnpm`, `prisma`, `docker`).

## Prerrequisitos

- Acceso al repositorio y herramientas de línea de comandos (git, pnpm).

## Flujo de Trabajo

### Paso 1: Principios Nucleares

1. **Idioma**: Todo en **Español**.
2. **Usuario**: Perfil de aprendizaje. Explicaciones claras.
3. **Archivos de Chat**: Usar `.txt` para archivos efímeros (context.txt, commit.txt).

### Paso 2: Flujo de Trabajo de Commits (Estricto)

1. **Verificar `commit.txt`**:
   - Usar `Get-Content commit.txt` (PowerShell) o `cat` para leerlo si está ignorado.
2. **Acción**:
   - *Existe*: Leer y **ANEXAR**.
   - *No existe*: Crear.
3. **Aprobación**: Esperar confirmación del usuario.
4. **Ejecución**:
   - Leer contenido final.
   - `git commit -m "..."`.
   - Eliminar `commit.txt`.

### Paso 3: Estándares de Mensaje

Formato: `[Emoji] [tipo] ([área]): [Título Conciso]`

| Tipo | Emoji | Descripción |
| :--- | :--- | :--- |
| **feat** | ✨ | Nueva funcionalidad |
| **fix** | 🔥 | Corrección de errores |
| **bug** | 🐞 | Error conocido |
| **refactor** | ♻️ | Cambio de código (no funcional) |
| **docs** | 📚 | Documentación |
| **style** | 💅 | Formato |
| **test** | 🧪 | Pruebas |
| **perf** | ⚡️ | Rendimiento |
| **chore** | ⚙️ | Mantenimiento/Config |
| **build** | 📦 | Build/Deps |
| **ci** | 🚀 | CI |
| **revert** | ⏪ | Revertir |

### Paso 4: Sincronización de Ramas

1. Trabajo en rama **`Dev`**.
2. Commit en `Dev`.
3. Push `Dev`.
4. Checkout `main` -> Pull `main` -> Merge `Dev` -> Push `main`.
5. Checkout `Dev`.

## Comandos Específicos

- **Linting**: `pnpm lint` (en carpeta `app`).
- **Reset DB**: `prisma migrate reset --force` (tras setear consent env var).

## Recursos

- `context.txt`: Contexto general del proyecto.
- `package.json`: Scripts oficiales.

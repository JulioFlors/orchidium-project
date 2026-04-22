---
name: pristinoplant-skills
description: Protocolo maestro de desarrollo. Define convenciones git, manejo de archivos y stack tecnológico. Úsese para alinear el comportamiento del agente.
---

# Protocolo de Desarrollo Pristinoplant

> [!IMPORTANT]
> **ESTÁNDARES DE MARKDOWN (PASO 8)**: Es mandatorio cumplir con el espaciado de encabezados y listas. El sistema de linting ahora está unificado bajo ESLint; asegúrate de ejecutar `pnpm lint:fix` antes de cualquier entrega importante.

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

1. **Idioma**: Todo en **Español**. Esto incluye el bloque de pensamiento (`thought`), el razonamiento interno y cualquier comunicación con el usuario.
2. **Usuario**: Perfil de aprendizaje. Explicaciones claras.
3. **Archivos de Chat**: Usar `.txt` para archivos efímeros (context.txt, commit.txt).
4. **Artefactos**: Todos los documentos generados (`walkthrough.md`, `implementation_plan.md`, `task.md`, etc.) y el **razonamiento** (pensamientos internos) deben estar en **Español**.

### Paso 2: Flujo de Trabajo de Commits (Estricto)

1. **Verificar `commit.txt`**:
   - Usar `Get-Content commit.txt` (PowerShell) o `cat` para leerlo.
   - Si el archivo **NO existe**, no hay commits pendientes o el usuario ya lo ejecutó.
2. **Acción**:
   - El Agente **NUNCA** ejecuta `git commit` directamente.
   - El Agente se limita a generar/anexar el contenido en `commit.txt`.
3. **Aprobación**: El usuario revisa el contenido de `commit.txt` y ejecuta el commit manualmente.
4. **Finalización**: Una vez que el usuario ejecuta el commit, el archivo `commit.txt` debe desaparecer o ser limpiado para la siguiente tarea.

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

### Paso 5: Estándares de Código

1. **Importaciones (`@/`)**:
   - Para **todas las carpetas directas dentro de `src`** (ej. `components`, `interfaces`, `store`, `lib`, etc.), importar **SIEMPRE** desde el primer nivel (archivo barril `index.ts`).
   - ❌ *Incorrecto:* `import { Button } from '@/components/ui/Button'`
   - ✅ *Correcto:* `import { Button } from '@/components'`
   - Esto asegura encapsulamiento y facilita refactorizaciones.

## Comandos Específicos

- **Linting**: `pnpm lint` (en carpeta `app`).
- **Reset DB**: `prisma migrate reset --force` (tras setear consent env var).

## Recursos

- `context.txt`: Contexto general del proyecto.
- `package.json`: Scripts oficiales.

### Paso 6: Reglas de TypeScript

1. **PROHIBIDO USAR `any`**:
   - Bajo ninguna circunstancia usar `as any` o el tipo `any`.
   - Si un tipo es complejo, definir una `interface` o `type` adecuado.
   - Si una librería no exporta tipos, crear un archivo de definición `d.ts` o usar `unknown` con Type Guards.
   - **Excepción**: Solo si es absolutamente imposible de tipar (casos extremos de librerías legacy sin tipos), documentar exhaustivamente por qué. Pero en el 99.9% de los casos, `any` es un error.

### Paso 7: Estándares de Diseño UI

1. **Contenedor Principal**:
    - Para todas las páginas principales (`admin`, `dashboard`, `account`), usar SIEMPRE el contenedor estándar para evitar desbordes y mantener consistencia:
    - `className="mx-auto mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8"`
    - Esto asegura márgenes consistentes y un ancho máximo legible en desktop.

2. **Estilo Visual**:
    - Usar `EnvironmentCard` para métricas.
3. **Reglas de Componentes UI**:
    - **Botones**: Todo `<button>` DEBE tener explícitamente `type="button"` (salvo que sea submit).
    - **Estilos Condicionales**: Usar SIEMPRE `clsx` para clases condicionales. Nunca usar ternarios directos en `className` sin envolver.
    - **Componentización y Sistema de Diseño**: Todo elemento UI relevante y recurrente (inputs, selects, toggles, cards) DEBE ser abstraído en un componente dentro de `src/components/ui`. Está PROHIBIDO el uso de etiquetas HTML puras con clases repetitivas. Esto garantiza la consolidación de nuestra galería de componentes y facilita refactorizaciones globales.
    - **Variables CSS**: Usar las clases de utilidad de Tailwind definidas en el tema (ej. `bg-surface`, `text-primary`, `border-input-outline`) en lugar de valores arbitrarios (`bg-[var(--color-surface)]`) o colores hardcoded (`bg-zinc-900`). Esto asegura limpieza y consistencia.

4. **Colores Semánticos (Sensores)**:
    - Mantener consistencia con el sistema: Temp (Orange), Hum (Blue), Lux (Yellow), Rain (Cyan).
    - Usar estos colores en combinación con `bg-surface` y `text-primary`.

5. **Formato de Tiempo (Time Formatting)**:
    - TODA hora mostrada en el frontend (Dashboards, Timelines, Gráficos, Heartbeats) DEBE usar el formato de **12 horas** con el sufijo en **minúsculas** exactas: `a. m.` o `p. m.`.
    - ❌ *Incorrecto:* `PM`, `AM`, `P. M.`, `A. M.`.
    - ✅ *Correcto:* `10:15 a. m.`, `05:30 p. m.`.
    - Usar la función utilitaria centralizada `formatTime12h(date)` o asegurar que el constructor `Intl.DateTimeFormat` esté configurado para este requerimiento específico.

### Paso 8: Estándares de Documentación (Markdown)

Para mantener la limpieza y compatibilidad con linters (MD041, MD022, MD032, MD007, MD009):

1. **Estructura H1**: Todo archivo DEBE comenzar con un único encabezado de nivel 1 (`# Título`).
2. **Espaciado de Encabezados**: Dejar SIEMPRE una línea en blanco antes y después de cada encabezado (`#`, `##`, `###`).
3. **Espaciado de Listas**: Las listas (`-`, `1.`, `[ ]`) deben estar rodeadas por líneas en blanco.
4. **Indentación de Listas**: Usar SIEMPRE **2 espacios** para sub-elementos. Nunca 4.
5. **Sin Espacios al Final**: Prohibido dejar espacios en blanco al final de las líneas (Trailing spaces).

### Paso 9: Gestión de Base de Datos (Protocolo Local-to-Prod)

Para garantizar la seguridad total de la base de datos de producción y evitar reseteos accidentales en el VPS, se establece un modelo de **Gestión Local-to-Prod**:

1. **Gestión Administrativa (SOLO LOCAL)**:
    - Toda operación "destructiva" o de población de datos debe realizarse desde tu PC local, apuntando a la `DATABASE_URL` del VPS.
    - **`pnpm db:migrate`**: Para cambios estructurales (Genera SQL y actualiza el esquema en Prod).
    - **`pnpm db:reset`**: Para limpiar la base de datos de producción (SIEMPRE desde local).
    - **`pnpm db:seed`**: Para poblar la base de datos (SIEMPRE desde local).

2. **Despliegue en VPS (Runtime Only)**:
    - El VPS es exclusivamente para **ejecutar** los servicios. No debe realizar tareas administrativas de gestión de datos.
    - **`pnpm db:deploy`**: Se ejecuta automáticamente mediante `deploy.sh`. Es un paso seguro que solo "formaliza" las migraciones ya aplicadas desde local.
    - **PROHIBIDO**: No intentes ejecutar comandos de reset o seed dentro de los contenedores del VPS.

3. **Flujo de Trabajo Seguro**:
    - **Diseño**: Modificar `schema.prisma`.
    - **Aplicación**: Ejecutar `pnpm db:migrate --name descriptive_name` en local.
    - **Población**: Si es necesario, ejecutar `pnpm db:seed` en local para rellenar datos.
    - **Distribución**: Commit del esquema y las migraciones SQL a `main`.
    - **Despliegue**: Ejecutar `./deploy.sh` en el VPS para actualizar el código y el Prisma Client.

### Paso 10: Mantenimiento Proactivo de Bitácoras (Trazabilidad)

> [!IMPORTANT]
> **ESCRIBA AUTÓNOMO (MANDATORIO)**: El Agente DEBE documentar su progreso en `todos.md` y `ROADMAP.md` al finalizar cada tarea o sesión de trabajo, sin necesidad de recordatorios.

1. **`ROADMAP.md`**: Actualizar la visión general (Macro) cuando se completen fases de sprints, hitos de la arquitectura o dominios completos de la aplicación.
2. **`todos.md`**: Actualizar la lista de micro-tareas e issues técnicos a medida que se descubran, se pospongan o culminen durante el ciclo de vida de un request.
3. **`commit.txt`**: Alimentar progresivamente este archivo con los changelogs usando el formato de Conventional Commits.
4. **Cierre de Sesión**: Antes de despedirse, el agente debe verificar que todas las actividades realizadas en la sesión estén reflejadas en las bitácoras correspondientes.

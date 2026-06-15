# Constitución de Pristinoplant

Este documento define las directrices, convenciones, flujos de trabajo y estándares arquitectónicos inmutables para el desarrollo del proyecto "Pristinoplant". Es la regla máxima del sistema y debe ser respetada por todo agente de IA.

---

## 🏛️ Principios Nucleares

### I. Idioma y Explicaciones
- **Idioma**: Todo en **Español**. Esto incluye el bloque de pensamiento (`thought`), el razonamiento interno, las explicaciones, los comentarios en código, bitácoras y cualquier comunicación.
- **Usuario**: Perfil de aprendizaje. Explicaciones claras, paso a paso y fundamentadas.

### II. Persistencia Estricta de Planificación (Regla de Oro)
- **Ubicación de Artefactos**: Queda **estrictamente prohibido** el uso de carpetas de caché local del asistente de IA en la máquina del usuario (como subcarpetas de AppData, `.gemini/antigravity/brain/`) para persistir o generar planes de implementación, checklists de tareas o bitácoras.
- **Trazabilidad por Git**: Todos los planes (`plan.md`), requerimientos (`spec.md`) y checklists de tareas (`tasks.md`) de características específicas se crearán bajo la ruta del proyecto en `.specify/features/<nombre-de-caracteristica>/`.
- Las bitácoras globales de progreso (`roadmap.md` y `backlog.md`) se mantendrán en la raíz de `.specify/` y se actualizarán autónomamente al final de cada sesión.

### III. Flujo de Trabajo de Commits (Estricto)
- El Agente **tiene estrictamente prohibido** ejecutar `git commit`, `git push` o cualquier comando de alteración del repositorio de forma directa.
- El Agente escribirá el mensaje de commit formateado bajo Conventional Commits en el archivo efímero `commit.txt` en la raíz del proyecto.
- **Codificación Crítica**: El archivo `commit.txt` DEBE guardarse en **UTF-8 sin BOM**. Está prohibido usar redirecciones `>` de PowerShell (que crean archivos UTF-16). El usuario revisa y ejecuta el commit manualmente.

---

## 💻 Estándares de Código y Base de Datos

### IV. Reglas de TypeScript
- **Prohibición de `any`**: Bajo ninguna circunstancia se permite usar `as any` o el tipo `any`. Se deben definir interfaces, tipos adecuados o utilizar `unknown` con Type Guards.

### V. Importaciones y Arquitectura
- **Barril de Importación (`@/`)**: Para las carpetas directas dentro de `src` (ej. `components`, `interfaces`, `store`, `lib`), se importará siempre desde el archivo barril `index.ts` del primer nivel (ej: `import { Button } from '@/components'`).

### VI. Gestión de Base de Datos (Prisma)
- **Prohibido `db push`**: No se permite sincronizar directamente el esquema sin migraciones en producción. Toda modificación a `schema.prisma` debe generar un archivo `.sql` en `prisma/migrations/` en UTF-8 sin BOM (usando el parámetro `-o` de Prisma, nunca la redirección `>` de PowerShell).
- **Gestión Local-to-Prod**: Los comandos destructivos (`db:reset`, `db:seed`, `migrate diff`) se ejecutan exclusivamente desde el entorno local apuntando a la base de datos. El VPS de producción ejecuta únicamente `db:deploy`.

---

## ⚙️ Estándares del Sistema y UI

### VII. Logs de Consola
- **Tags de 4 Caracteres**: Todos los tags del scheduler y backend en corchetes deben tener máximo 4 caracteres para una alineación vertical perfecta en la consola (ej. `[CRON]`, `[INFR]`, `[TLMT]`).

### VIII. Zona Horaria y Epochs (ESP32/VPS)
- **Zona Horaria**: Todo cálculo hídrico o lectura de sensores debe normalizarse considerando el huso horario de Caracas (`America/Caracas`, UTC-4) para evitar desfases de 4 horas en el VPS (UTC).
- **Manejo de Epochs**: Las lecturas de MicroPython del ESP32 (basadas en el año 2000) deben sumarse con `946684800` segundos para normalizarse al epoch Unix (1970). Si la fecha corregida es inválida o difiere por más de 24h del servidor, se usará un fallback a la hora actual.

### IX. Estilo de Diseño UI
- **Contenedores**: En las vistas principales, usar siempre `className="mx-auto mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8"`.
- **Formato de Hora**: Toda hora en la UI debe mostrarse en formato de 12 horas con am/pm en minúsculas (ej: `10:15 am`, `05:30 pm`).

---

**Versión**: 1.0.0 | **Ratificado**: 2026-06-11 | **Última Modificación**: 2026-06-11

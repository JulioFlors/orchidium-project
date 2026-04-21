---
name: markdown-standards
description: Reglas estrictas de construcción de archivos Markdown para Pristinoplant. Asegura compatibilidad con linters MD022 y MD032.
---

# Estándares de Markdown - Pristinoplant

Este documento es la **Fuente de Verdad** para el formato de toda la documentación del proyecto. El cumplimiento de estas reglas garantiza que el auto-formateado al guardar funcione correctamente y evita ruido en los commits.

## 🚀 Resumen Ejecutivo (Lo más importante)

| Regla | Descripción | Solución Automática |
| :--- | :--- | :--- |
| **MD022** | Línea en blanco arriba/abajo de encabezados | ✅ Sí (Ctrl+S) |
| **MD032** | Línea en blanco arriba/abajo de listas | ✅ Sí (Ctrl+S) |
| **MD041** | El archivo DEBE empezar con un H1 | ❌ Manual |
| **MD007** | Indentación de 2 espacios (no 4) | ✅ Sí (Ctrl+S) |
| **MD010** | PROHIBIDAS las tabulaciones (Tabs) | ✅ Sí (Ctrl+S) |

## ⚠️ Reglas Obligatorias para Artefactos del Agente

Para asegurar el cumplimiento de **MD041**, todo artefacto generado automáticamente (ej. `task.md`, `implementation_plan.md`, `walkthrough.md`) **DEBE** comenzar con un encabezado H1 descriptivo.

❌ **Incorrecto:**

```markdown
- [ ] Tarea 1
- [ ] Tarea 2
```

✅ **Correcto:**

```markdown
# [Nombre de la Tarea/Plan]

- [ ] Tarea 1
- [ ] Tarea 2
```

## 📖 Guías Detalladas por Categoría

Para ejemplos de "Correcto vs Incorrecto", consulta los siguientes módulos:

1. **[Encabezados (Headings)](file:///c:/Dev/pristinoplant/.agents/skills/markdown-standards/rules/headings.md)**: Jerarquía, espaciado y estructura (MD001, MD022, MD025, MD041).
2. **[Listas y Bullet Points](file:///c:/Dev/pristinoplant/.agents/skills/markdown-standards/rules/lists.md)**: Indentación, espaciado y consistencia de viñetas (MD004, MD007, MD032).
3. **[Contenido y Estilo](file:///c:/Dev/pristinoplant/.agents/skills/markdown-standards/rules/content.md)**: Líneas en blanco, longitud de línea y sintaxis de enlaces (MD010, MD011, MD012).

## 🛠️ Cómo mantener el formato

El repositiorio está configurado para **arreglarse solo**. Si ves errores:

1. Asegúrate de que el archivo `.vscode/settings.json` tiene activo `editor.formatOnSave` para Markdown.
2. Presiona **Guardar (Ctrl+S)**. La extensión `DavidAnson.vscode-markdownlint` ejecutará las correcciones automáticas.
3. Si un error persiste, es porque requiere **decisión humana** (ej. cambiar un H3 por un H2).

---
> [!TIP]
> Si eres una IA (como yo), lee siempre primero el módulo de **[Encabezados](file:///c:/Dev/pristinoplant/.agents/skills/markdown-standards/rules/headings.md)** antes de generar un nuevo `implementation_plan.md` o `walkthrough.md`.

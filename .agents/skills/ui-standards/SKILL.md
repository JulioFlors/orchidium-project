---
name: ui-standards
description: Biblia y estándar de diseño de Pristinoplant. Jerarquía de capas (z-index), reglas para menús/dropdowns, modales accesibles y persistencia de formularios con Zustand.
---

# Estándares de Diseño y UI - Pristinoplant

Este documento define la **fuente de verdad arquitectónica** para la creación y mantenimiento de interfaces de usuario en el proyecto Pristinoplant. Toda IA y desarrollador debe consultar y respetar estas reglas antes de implementar o alterar componentes visuales.

## 1. Jerarquía Global de Capas (`z-index`)

El proyecto utiliza una escala estricta de apilamiento para evitar que elementos de la página compitan con el marco de navegación o modales:

| Capa / Componente | Clase Z-Index | Propósito |
| :--- | :--- | :--- |
| **Toast** | `z-9999` | Alertas globales flotantes en esquina inferior. |
| **Modal / Dialog** | `z-10` en `Backdrop` (`z-15` o `z-60`) | Diálogos emergentes con trampa de foco. |
| **Sidebar / Drawer** | `z-30` (panel) / `z-20` (overlay) | Menú lateral deslizable. |
| **Header (Submenú Abierto)** | `z-20` | Desplegable principal del Navbar (`NavbarDropdown`). |
| **Backdrop del Header** | `z-15` | Oscurecimiento y desenfoque del cuerpo de página. |
| **Header (Reposo)** | `z-10` | Barra de navegación superior fija. |
| **Subtitle Sticky** | `z-9` | Título de sección fijo al hacer scroll bajo el header. |
| **Dropdowns / ActionMenu** | `z-5` | Menús contextuales y selectores en tarjetas/listas. |
| **Tarjeta Activa / Enfocada** | `focus-within:z-5` | Eleva la tarjeta activa sobre las hermanas adyacentes. |
| **Contenido Base / Tarjetas** | `z-0` (`z-auto`) | Elementos normales del flujo de la página. |

## 2. Reglas para Menús Flotantes y Dropdowns

### A. Aislamiento Local vs Portales
- **Menús de Tarjetas / Listas (`ActionMenu`, `DeviceStatus`)**: Deben renderizarse **localmente** con `position: absolute` y `z-5`. **PROHIBIDO** usar portales a `document.body`, ya que los portales escapan del contexto y se superponen indebidamente al Header (`z-10`) y al Backdrop (`z-15`).
- **Selectores de Formulario (`SelectDropdown`)**: Renderizan su menú con `absolute` dentro de su contenedor relativo. Cuando `isOpen === true`, el contenedor adquiere `isOpen && 'z-50'` para flotar sobre inputs adyacentes del formulario.

### B. Rendimiento y Text Antialiasing en Chromium
- Todo menú desplegable animado con Framer Motion debe incluir:
  ```tsx
  className="transform-gpu antialiased [backface-visibility:hidden] ..."
  ```
- Las tarjetas contenedoras deben usar transiciones atómicas como `transition-colors duration-200` y **NUNCA** `transition-all`.
- **PROHIBIDO** usar `hover:z-2` en tarjetas hermanas: usar siempre `focus-within:z-5` para que el cursor no eleve la tarjeta adyacente sobre el menú abierto.

## 3. Estándar de Modales y Formularios

### A. Estructura Canónica del Modal
- Uso obligatorio de [`Modal.tsx`](file:///c:/Dev/pristinoplant/app/src/components/ui/modal/Modal.tsx).
- Trampa de foco (`focus trapping`) integrada con `Tab` y `Shift+Tab`.
- Cierre automático con `Escape` y click en el `Backdrop`.
- Botones de acción estandarizados en el footer: *"Cancelar"* (variante `ghost`) y *"Guardar"* (variante `primary`).

### B. Persistencia de Borradores con Zustand
- Los formularios de creación/edición deben sincronizar su estado con `useFormDraftStore` con una clave descriptiva (ej. `'agrochemical-form-draft'`).
- El borrador se restaura al montar el modal y se limpia (`clearDraft`) **únicamente** tras guardar exitosamente.

### C. Validaciones con Zod y React Hook Form
- Validación estricta con esquemas Zod en español.
- **PROHIBIDO EL USO DE `any`**: Los tipos del formulario deben derivarse con `z.infer<typeof schema>`.
- Inputs numéricos enteros (ej. cantidad 1-99) deben sanitizarse en tiempo real con `replace(/[^0-9]/g, '')` y validarse contra valores no permitidos (`0`, `00`).

## 4. Estándar de Tarjetas Modulares (Arquitectura "Piezas de Lego")

Las tarjetas (`Card`) en Pristinoplant deben estructurarse de manera composable, divididas en bloques modulares predecibles e interoperables. Aunque cada tarjeta atiende a entidades y datos específicos (tareas de cola, historial, insumos, rutinas, dosificaciones), **todas comparten la misma anatomía estructural y patrones responsivos**.

### A. Anatomía Estructural Canónica

```text
┌────────────────────────────────────────────────────────┐
│ [StatusIcon]  Título de Entidad Completo               │ <-- Header (Cabecera)
│               Subtítulo / Contexto Inmediato           │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤ <-- Separador dashed (pt-3.5)
│ [Tag/Badge]  [Métrica mono]  [Zonas]    [ActionMenu ⋮] │ <-- Body (Metadatos & Acciones)
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤ <-- Separador dashed (pt-2.5, opcional)
│ Descripción en cursiva / Notas de la entidad...        │ <-- Footer (Descripción/Notas)
└────────────────────────────────────────────────────────┘
```

1. **Contenedor Base**:
   - Clases estándar:
     ```tsx
     className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-colors duration-200"
     ```
   - Uso obligatorio de `focus-within:z-5` para la elevación del `ActionMenu`.
   - **PROHIBIDO** usar `transition-all` en el contenedor de tarjetas.

2. **Cabecera (`Header` / Contexto Visual)**:
   - **`StatusCircleIcon`**: Identificador visual de estado o categoría con `variant="overlay"` (o `glow`/`canvas`).
     - **Regla Responsiva Estricta**: Debe incluir `className="tds-xs:flex hidden shrink-0"` para ocultarse limpiamente en pantallas ultra-móviles (`< tds-xs`) y ceder todo el ancho al texto.
   - **Título (`<h3>`)**:
     - Clases estándar: `className="text-primary text-[15px] leading-tight font-bold whitespace-normal break-words antialiased"`.
     - **Regla de Oro**: **PROHIBIDO** forzar `truncate` o `whitespace-nowrap` en títulos de entidades con nombres potencialmente largos (insumos, tareas o recetas). Debe envolverse fluidamente sin mostrar puntos suspensivos (`...`).
   - **Subtítulo**: Contexto directo o tipo específico (`className="text-secondary text-[11px] font-medium opacity-60"`).
   - **Regla de Descongestión**: No sobrecargar la cabecera con badges, tags o menús si el título puede ser extenso. La cabecera se reserva para el `StatusCircleIcon`, el `Título` y el `Subtítulo`.

3. **Cuerpo (`Body` / Metadatos Técnicos & Acciones)**:
   - Separador superior: `border-black-and-white/5 border-t border-dashed pt-3.5` (o `pt-4`).
   - Disposición en dos columnas fluidas (`flex items-center justify-between gap-4`):
     - **Lado Izquierdo (Metadatos & Tags)**: Flex container con wrapping `flex flex-row flex-wrap items-center gap-x-5 gap-y-2`.
       - **Reglas de Metadatos/Tags**:
         - Cada tag o metadato debe poseer un **icono a su izquierda** (con opacidad contextual, ej. `opacity-40` o `opacity-30`).
         - **PROHIBIDO** encerrar los metadatos en contenedores con bordes (`border`) o badges innecesarios. Deben renderizarse como elementos limpios integrados al flujo.
         - **PROHIBIDO** forzar `uppercase` en clasificaciones o descripciones textuales; usar capitalización natural.
         - Datos técnicos y numéricos (dosis, tiempos, duraciones) deben usar `font-mono text-[11px] font-bold tracking-tight`.
         - Clasificaciones o agrupaciones textuales usan `text-secondary text-[11px] font-medium opacity-70`.
     - **Lado Derecho (Acciones)**: `flex shrink-0 items-center gap-2` conteniendo el [`ActionMenu`](file:///c:/Dev/pristinoplant/app/src/components/ui/action-menu/ActionMenu.tsx) o botones de confirmación/cancelación si aplican.

4. **Pie (`Footer` / Descripción o Notas Opcionales)**:
   - Aplica cuando la entidad posee campo de notas, instrucciones o descripción.
   - Separador superior: `border-black-and-white/5 border-t border-dashed pt-2.5`.
   - Texto: `className="text-secondary text-[11px] leading-relaxed italic opacity-60"`.

### B. Variantes Compuestas y Mezclas (Entidades Múltiples en una Card)

Cuando una tarjeta representa una entidad compuesta (ej. mezcla de varios agroquímicos o pasos combinados):

1. **Subtítulo Combinado**:
   - Debe evaluar dinámicamente los propósitos o subtipos de cada componente.
   - Si los componentes tienen propósitos diferentes, se presentan combinados en orden con ` + ` (ej. `Insecticida + Acaricida`).
   - Si todos los componentes comparten el mismo propósito, se presenta una única vez (ej. `Desarrollo`).
2. **Desglose en el Cuerpo (`Body`)**:
   - La cabecera mantiene el título general de la mezcla (`Nombre A + Nombre B`).
   - El cuerpo renderiza la clasificación macro en la fila superior y un listado vertical de cada insumo individual con su índice `#1`, `#2`, nombre del componente y dosificación en `font-mono` con icono `GiChemicalDrop`.

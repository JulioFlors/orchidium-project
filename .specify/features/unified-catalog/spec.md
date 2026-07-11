# Feature Specification: Catálogo Unificado de Especies (unified-catalog)

**Feature Branch**: `Dev`
**Created**: 2026-07-11
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Consolidación del Catálogo de Taxonomía en `/catalog` (Priority: P1)
El administrador del orquideario entra a la ruta `/catalog` y visualiza un panel unificado para gestionar toda la taxonomía. En la cabecera se presentan 3 tarjetas interactivas (`EnvironmentCard`) que muestran las métricas cuantitativas y abren modales específicos de gestión:
1.  **Tipos de Plantas:** Abre un modal informativo del enum `PlantType`.
2.  **Géneros:** Abre el modal de creación y edición de Géneros.
3.  **Especies:** Abre el modal de creación rápida de Especies.

**Why this priority**: Centraliza la experiencia del administrador de catálogo en una sola vista coherente, eliminando la dispersión de rutas y agilizando el flujo de trabajo.

**Responsividad de las Tarjetas**: Las tarjetas se disponen en rejilla. En pantallas de tamaño medio (`md`), al colapsar las dos primeras en la primera fila, la tercera tarjeta (Especies) ocupará todo el ancho disponible en la segunda fila (es decir, `col-span-2`), garantizando un balance estético perfecto.

**Independent Test**:
1. Acceder a `/catalog`.
2. Verificar la presencia de las 3 tarjetas en la cabecera mostrando sus conteos respectivos de base de datos.
3. Redimensionar la pantalla a resoluciones medianas y validar que la tercera tarjeta se expanda al 100% de la fila.
4. Hacer clic en cada tarjeta y comprobar que se abre el modal correspondiente de creación/edición sin errores.

---

### User Story 2 - Visualización Estructurada con Menús de Acción Rápida y Reglas de Seguridad (Priority: P2)
El catálogo inferior se organiza dinámicamente según el Tipo de Planta y el Género, imitando la estructura de la tienda pública (`category/plants`). Al lado de cada título de Tipo de Planta y subtítulo de Género, aparece un botón de menú de acciones rápidas (`ActionMenu`), visible al hacer hover.
*   **Edición de Género:** Se limita únicamente a la modificación del nombre.
*   **Seguridad en Eliminación (No Cascada en Borrado):** 
    *   No se puede eliminar un Género que contenga Especies asociadas. El usuario debe eliminar primero de forma manual cada especie.
    *   No se puede eliminar una Especie si existen registros de Plantas físicas (`Plant`) activas o históricas vinculadas a ella. El administrador debe limpiar o reasignar las plantas primero.
    *   **Ediciones en Cascada:** Al editar el nombre de un género o especie, los cambios se propagan de forma transparente (cascada) a todos los registros hijos correspondientes en el inventario.

**Why this priority**: Evita la pérdida accidental de datos biológicos e históricos valiosos, asegurando que no se elimine la taxonomía que da soporte a las plantas reales en el invernadero.

**Independent Test**:
1. Navegar por `/catalog`.
2. Intentar eliminar un Género que tiene especies registradas. Validar que el sistema muestre un mensaje de error y deniegue la acción.
3. Intentar eliminar una Especie que tiene plantas asociadas en `/stock`. Validar que el sistema deniegue la acción.

---

### User Story 3 - Clon de Detalle de Producto para Edición de Especies (Priority: P2)
Para editar una especie, el administrador hace clic sobre la tarjeta de la especie en el catálogo. En lugar de un formulario plano en un modal, la aplicación le redirige a `/catalog/[id]`, una vista que es un **clon visual de la página de detalle del producto de la tienda pública** (`/product/[slug]`).
*   Los textos, imágenes, descripciones y selector de variantes se renderizan de manera idéntica a la tienda.
*   Cada sección cuenta con inputs editables o botones de edición contextuales para modificar la información en caliente.
*   Esto garantiza que el administrador pueda ver en tiempo real cómo se visualiza el producto en la tienda pública mientras realiza cambios.

**Why this priority**: Ofrece una experiencia WYSIWYG ("What You See Is What You Get") para la edición de especies, garantizando que el diseño y la información se validen antes de su publicación comercial.

**Independent Test**:
1. En `/catalog`, hacer clic sobre la tarjeta de la especie "Cattleya Mossiae".
2. Validar redirección a `/catalog/[id]` y corroborar que el diseño replique fielmente la UI del producto de la tienda.
3. Modificar la descripción o cambiar la foto, hacer clic en "Guardar" y verificar los cambios.

---

### User Story 4 - Análisis de Migración de PlantType (Dynamic Model Plan)
Aunque `PlantType` se mantiene actualmente como un enum estático para preservar el ruteo estático y la robustez del menú del navbar/sidebar en el frontend (ya que no se contempla agregar nuevos tipos de plantas próximamente), se documenta la factibilidad de su migración para futuras fases.

---

## Requirements

### Functional Requirements
*   **FR-001**: Nueva ruta unificada `/catalog` que consolida la gestión de catálogo de taxonomías.
*   **FR-002**: Reutilización de `EnvironmentCard` en `/catalog` con la regla de responsividad CSS:
    *   Rejilla base: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
    *   Tercera tarjeta: `md:col-span-2 lg:col-span-1`
*   **FR-003**: Integración del componente `ActionMenu` al lado de los títulos de `PlantType` y subtítulos de `Genus` en la rejilla inferior de `/catalog`.
*   **FR-004**: Ruta dinámica `/catalog/[id]` que actúa como interfaz de edición WYSIWYG de una Especie, clonando la interfaz pública de `ProductClientWrapper` pero habilitando inputs para descripción, taxonomía, estado de destacado e imágenes.
*   **FR-005**: Mantenimiento del enum `PlantType` estático para la fase actual para evitar la rotura de las rutas públicas `/category/plants/[slug]`.
*   **FR-006**: Bloqueo estricto a nivel de base de datos/Server Actions contra la eliminación en cascada de Géneros con especies, y Especies con plantas.

### Key Entities
*   **Genus**: `id`, `name`, `type` (Enum `PlantType`).
*   **Species**: `id`, `name`, `slug`, `description`, `isFeatured`.
*   **Plant**: `id`, `speciesId`.

## Success Criteria

### Measurable Outcomes
*   **SC-001**: Intentos de eliminar un género con especies resultan en un toast informativo con código de error controlado y cero eliminación.
*   **SC-002**: Intentos de eliminar una especie con instancias de plantas físicas en `/stock` resultan en un bloqueo preventivo con mensaje claro al usuario.
*   **SC-003**: Las modificaciones del nombre de un Género o Especie actualizan correctamente en cascada las referencias de los registros vinculados.

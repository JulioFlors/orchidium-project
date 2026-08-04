# Feature Specification: Gemelo Digital de Stock, Refactor de Rutas y Alineación de Vistas (stock-visual-migration)

**Feature Branch**: `Dev`
**Created**: 2026-07-20
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Renombrado de Rutas Públicas de `/product/[slug]` a `/plant/[slug]` (Priority: P1)
El cliente navegante ingresa a la tienda pública y hace clic en una planta desde `/category/plants`. La URL navegada ahora es `/plant/[slug]`.

---

### User Story 2 - Alineación de Diseño Visual en 2 Columnas de las Vistas de Detalle (Priority: P1)
*   **En `/catalog/[id]` (Taxonomía)**:
    *   **Columna Izquierda**: Gestor de fotos R2, donde el administrador sube/elimina imágenes y define su jerarquía de visualización.
    *   **Columna Derecha**: Edición de campos taxonómicos (género, nombre científico, descripción y color glow).
*   **En `/stock/[id]` (Inventario Operativo)**:
    *   **Columna Izquierda**: Panel de distribución de estados de plantas y zonas con alias amigables. Habilita filtros interactivos para el listado inferior.
    *   **Columna Derecha**: Gestión de variantes comerciales y precios. No permite modificar taxonomía.
    *   **Sección Inferior**: Vista del Gemelo Digital (Listado responsivo de tarjetas de plantas físicas, ingreso masivo/individual y gestión contextual).

---

### User Story 3 - Ingesta de Plantas Físicas Individual y en Lotes con Múltiples Tamaños (Priority: P1)
El administrador registra plantas físicas en `/stock/[id]`.
*   **Ingreso Individual y Masivo**:
    *   Si no se especifica fecha de siembra/repoteo, el sistema cataloga la fecha bajo el término exacto **"Sin Fecha"**.
    *   **Múltiples Variantes en un Lote**: Permite registrar múltiples tamaños de maceta en una sola operación del lote.
*   **Zonas con Alias Amigables**:
    *   Se administran las zonas físicas usando alias claros para el operario (`ZONA_A` = Orquideario, `ZONA_B` = Jardín).

---

### User Story 4 - Visualización del Gemelo Digital mediante Tarjetas Responsivas (Priority: P1)
Las instancias físicas de las plantas en la sección inferior de `/stock/[id]` se presentan mediante **tarjetas individuales estructuradas (`PlantInstanceCard`)**, no tablas.
*   Cada tarjeta es completamente responsiva y fluida para adaptarse a resoluciones móviles (`tds-xs`) hasta escritorio (`tds-xl`).
*   **Contenido de la Tarjeta (`PlantInstanceCard`)**:
    *   Identificador correlativo / Código único.
    *   Tamaño de maceta (badge).
    *   Zona física (con alias amigable).
    *   Fecha de siembra (o el término literal `"Sin Fecha"`).
    *   Evento de origen (Injerto, Repoteo, Corte).
    *   `ActionMenu` con controles para "Editar Planta", "Registrar Floración" y "Eliminar".
*   **Labels de Estado Exclusivos**: Las etiquetas del `StockLabel` se muestran solo en estados clave:
    *   `Madre`: Si el `status` es `MOTHER`.
    *   `Floración`: Si posee un evento de floración activo.
    *   Las plantas disponibles y en estado vegetativo no llevan etiquetas adicionales.

---

## Requirements

### Functional Requirements
*   **FR-001**: Renombrar la ruta comercial de `/product/[slug]` a `/plant/[slug]`.
*   **FR-002**: Rediseñar `/catalog/[id]` y `/stock/[id]` al formato unificado de 2 columnas.
*   **FR-003**: Implementar los alias de zonas y ocultar la clasificación por mesas.
*   **FR-004**: CRUD completo para cada planta física (`Plant`) administrable mediante tarjetas `PlantInstanceCard` responsivas.
*   **FR-005**: Incorporar el registro y visualización de eventos de floración (`FloweringEvent`) por planta individual en la sección inferior de `/stock/[id]`.
*   **FR-006**: Admitir el término **"Sin Fecha"** en la interfaz para plantaciones sin fecha registrada.

---

## Success Criteria

### Measurable Outcomes
*   **SC-001**: Creación y edición exitosa de una planta física actualizando su estado a `MOTHER` o registrando una floración activa desde su correspondiente tarjeta `PlantInstanceCard`.
*   **SC-002**: Las tarjetas de las plantas físicas se reorganizan fluidamente según el ancho de pantalla (desde `tds-xs` en columna única hasta rejilla multi-columna en `tds-xl`).
*   **SC-003**: Las plantas marcadas como `status: MOTHER` muestran un `StockLabel` indicativo con el texto exacto `Madre` y quedan excluidas de la venta comercial.

# Implementation Plan: Gemelo Digital de Stock, Refactor de Rutas y Alineación de Vistas (stock-visual-migration)

Este plan describe el diseño visual, componentes UI y flujos de usuario actualizados para `/stock/[id]`, `/catalog/[id]` y `/plant/[slug]`.

---

## 📐 Estructura de /stock/[id] y Flujo UX/UI de Gestión

La página `/stock/[id]` se organiza con el mismo diseño unificado de 2 columnas responsivas:

### 1. Columna Izquierda (Operativa / Distribución)
*   **Distribución de Estados:** Tarjeta con recuentos del estado biológico de la especie (ej: cuántas son comerciales `AVAILABLE`, cuántas son plantas `Madre` y cuántas están en `Floración`).
*   **Ubicación Física por Zonas:** Tarjeta que agrupa los ejemplares según su Zona utilizando alias lógicos para el orquideario:
    *   `ZONA_A` ➔ **Orquideario**
    *   `ZONA_B` ➔ **Jardín**
    *   `ZONA_C` ➔ **Zona C**
    *   `ZONA_D` ➔ **Zona D**
    *   `EXTERIOR` ➔ **Exterior**
*   **Filtros Interactivos:** Al hacer clic en una Zona o Estado en este panel izquierdo, el listado de tarjetas del Gemelo Digital de la sección inferior se filtra al instante.

### 2. Columna Derecha (Comercial)
*   **VariantsStockManager:** Configuración de precios, stock digital, y toggle de disponibilidad (Visible / Pausado) para cada tamaño de maceta. **No se permite modificar la descripción botánica ni la taxonomía aquí.**

### 3. Sección Inferior (Gemelo Digital mediante Tarjetas Responsivas)
Las plantas físicas se visualizan en una cuadrícula responsiva fluida de tarjetas (**`PlantInstanceCard`**) adaptada para `tds-xs`, `tds-sm`, `tds-lg` y `tds-xl`.

#### Estructura de `PlantInstanceCard`:
```
+-------------------------------------------------------------+
| #CAT-TRI-012                         [ Maceta Nro 10 ]  [X] |
+-------------------------------------------------------------+
|  Zona: Orquideario                                          |
|  Siembra: 20 Feb 2026 (Repoteo)                             |
+-------------------------------------------------------------+
|  [ Label: Madre ]                 [ Label: Floración ]     |
+-------------------------------------------------------------+
```

*   **Header**:
    *   Código correlativo / ID de la planta.
    *   Badge de tamaño (`PotSize`).
    *   Botón de menú de acción rápida (`ActionMenu`).
*   **Contenido**:
    *   Ubicación física (con alias de Zona e icono).
    *   Fecha de siembra (pottingDate) o etiqueta literal **"Sin Fecha"**, acompañada por el evento (Siembra, Repoteo, Injerto, Corte).
*   **Footer**:
    *   Etiqueta `Madre` (en violeta/dorado) si `status === 'MOTHER'`.
    *   Etiqueta `Floración` (en cian) si tiene un evento de floración activo.
    *   *(Las plantas disponibles y vegetativas no muestran etiquetas).*

*   **CRUD y Acciones Contextuales**:
    *   `ActionMenu` con opciones de: Editar Planta (abre `PlantFormModal`), Registrar Floración (abre `FloweringEventModal`) y Eliminar.

---

## Proposed Changes

### 📁 Base de Datos & Config

#### [MODIFY] [schema.prisma](file:///c:/Dev/pristinoplant/packages/database/prisma/schema.prisma)
*   Asegurar consistencia del modelo `Plant` y `FloweringEvent`.

### 💻 Frontend & Componentes

#### [MODIFY] [StockDetailView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/stock/ui/StockDetailView.tsx)
*   Implementar la visualización del listado de plantas físicas mediante la cuadrícula de tarjetas responsivas `PlantInstanceCard`.
*   Deshabilitar edición de campos taxonómicos en esta vista.

#### [NEW] [PlantInstanceCard.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/stock/ui/components/PlantInstanceCard.tsx)
*   Componente de tarjeta polivalente y responsiva para mostrar la instancia de planta física.

#### [NEW] [BatchPlantEntryModal.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/stock/ui/components/BatchPlantEntryModal.tsx)
*   Modal para añadir lotes de plantas físicas especificando múltiples tamaños.

#### [NEW] [PlantFormModal.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/stock/ui/components/PlantFormModal.tsx)
*   Modal para la creación y edición individual de una planta física (Gemelo Digital).

#### [NEW] [FloweringEventModal.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/stock/ui/components/FloweringEventModal.tsx)
*   Modal para iniciar y registrar un evento de floración en un ejemplar específico.

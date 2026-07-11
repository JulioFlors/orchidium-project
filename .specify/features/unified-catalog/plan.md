# Implementation Plan: Catálogo Unificado (unified-catalog)

Este plan describe el enfoque técnico para unificar la gestión del catálogo bajo la ruta `/catalog`, integrar menús de acción rápida en la jerarquía con seguridad de eliminación estricta, e implementar la edición WYSIWYG de especies.

---

## 🏗️ Análisis Técnico: PlantType Enum vs Modelo

Tras evaluar la migración del enum `PlantType` a un modelo de base de datos Postgres:
*   **Complejidad:** Modificar `PlantType` a modelo afecta a más de 30 archivos, incluyendo el ruteo de categorías de la tienda pública (`/category/plants/[slug]`), que utiliza un mapeo estático (`slugToPlantType`) e importaciones de enums de Prisma.
*   **Decisión:** **No es prioritario.** Mantendremos el enum `PlantType` estático para evitar la refactorización masiva de componentes comerciales que no cambian a menudo.
*   **Plan de Mitigación Futura:** Si en el futuro se requiere hacer dinámico, se detalla en [plan.md](file:///c:/Dev/pristinoplant/.specify/features/unified-catalog/plan.md) cómo migrar las tablas e ingestas correspondientes.

---

## 🔒 Reglas de Seguridad y Cascada de Datos

Para proteger la integridad histórica y operativa del invernadero:
1.  **Ediciones en Cascada:** Permitidas. Al cambiar el nombre de un `Genus` o `Species`, Prisma actualizará los registros correspondientes. La edición de un Género se limitará únicamente al campo `name`.
2.  **Bloqueo de Eliminación (Sin Cascada en Borrado):**
    *   **Géneros:** No se puede borrar si tiene `Species` vinculadas.
    *   **Especies:** No se puede borrar si tiene `Plant` (plantas físicas) vinculadas. Las plantas son el "gemelo digital" del inventario físico; borrarlas sin validación corrompería el histórico de floraciones, plagas y ventas.
    *   **Server Actions Guard:** Las acciones de eliminación implementarán comprobaciones de conteo (`prisma.count`) antes de proceder con el borrado en base de datos.

---

## Proposed Changes

### 1. Ruteo y Consolidación de Navegación

#### [NEW] [page.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/catalog/page.tsx)
*   Nueva página principal del Catálogo consolidando Tipos de Planta, Géneros y Especies.
*   Reemplaza las antiguas páginas de `/genus` y `/species`.

#### [NEW] [page.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/catalog/%5Bid%5D/page.tsx)
*   Ruta dinámica para la edición de especies mediante la interfaz WYSIWYG clonada.

---

### 2. Frontend & Componentes UI

#### [NEW] [CatalogProductEdit.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/catalog/ui/CatalogProductEdit.tsx)
*   Clon visual de la página de detalle de producto de la tienda pública (`/product/[slug]`), pero con campos de inputs integrados para la edición y actualización en tiempo real de la especie.

#### [MODIFY] [CatalogView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/catalog/ui/CatalogView.tsx)
*   Se unifica e implementa la cuadrícula de tarjetas de cabecera con responsividad `md:col-span-2`.
*   Se integran los componentes `ActionMenu` al lado de los subtítulos de género.
*   **Edición de Género:** El modal se simplificará para que el administrador solo pueda modificar el string del nombre (`name`), ocultando cambios de tipo ya que el género ya está establecido.
*   **Mensajes de Error:** La interfaz manejará los errores de eliminación de taxonomías con mensajes claros ("Elimine primero las plantas asociadas en stock").

---

### 3. Server Actions de Taxonomía

#### [MODIFY] [genus-actions.ts](file:///c:/Dev/pristinoplant/app/src/actions/inventory/genus-actions.ts)
*   Verificar en `deleteGenus` que el conteo de especies asociadas sea exactamente `0`.
*   Asegurar que la edición (`updateGenus`) solo modifique el campo `name`.

#### [MODIFY] [species-actions.ts](file:///c:/Dev/pristinoplant/app/src/actions/inventory/species-actions.ts)
*   Verificar en `deleteSpecies` que el conteo de plantas físicas (`Plant`) vinculadas sea exactamente `0`.
*   Retornar mensajes descriptivos de error controlados al frontend.

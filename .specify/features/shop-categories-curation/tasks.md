# Tasks: Sincronización y Curaduría de Categorías (shop-categories-curation)

**Input**: Documentos de diseño en `.specify/features/shop-categories-curation/`

**Prerequisites**: `spec.md` (completed), `plan.md` (completed)

---

## Phase 1: Data Contracts & Backend Actions

**Purpose**: Ampliar el contrato `ShopLayoutConfig` y optimizar la revalidación de caché.

- [x] T001 [MODIFY] [store-actions.ts](file:///c:/Dev/pristinoplant/app/src/actions/inventory/store-actions.ts): Ampliar la interfaz `ShopLayoutConfig` con `CategoryConfigItem` (`speciesId?`, `title?`, `subtitle?`, `imageUrl`).
- [x] T002 [MODIFY] [store-actions.ts](file:///c:/Dev/pristinoplant/app/src/actions/inventory/store-actions.ts): Actualizar `defaultConfig` en `getShopLayoutConfig` con los títulos y subtítulos por defecto de las 4 categorías.
- [x] T003 [MODIFY] [store-actions.ts](file:///c:/Dev/pristinoplant/app/src/actions/inventory/store-actions.ts): Agregar `revalidatePath('/', 'layout')` en `saveShopLayoutConfig`.

---

## Phase 2: Form Standardization & FilterSliceBar in Shop Manager

**Purpose**: Habilitar en `/shop-manager` componentes estandarizados (`SelectDropdown`, `FormField`, `Input`, `FilterSliceBar`), selección robusta de especie e inputs de título/subtítulo.

- [x] T004 [MODIFY] [ShopView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx): Refactorizar `SpeciesSelectorCascade` para utilizar `SelectDropdown` y `FormField` de `@/components` en lugar de etiquetas `<select>` nativas, con sincronización de estado reactiva.
- [x] T005 [MODIFY] [ShopView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx): Reemplazar inputs nativos en Hero Sliders y Megamenú por `Input` y `FormField` de `@/components`.
- [x] T006 [MODIFY] [ShopView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx): Actualizar la pestaña "Categorías" para manejar `cat.speciesId`, persistencia adecuada y renderizado robusto del `MediaPicker`.
- [x] T007 [MODIFY] [ShopView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx): Agregar inputs estandarizados (`FormField` + `Input`) para `Título en Landing` y `Subtítulo en Landing` en cada una de las 4 categorías.
- [x] T008 [MODIFY] [ShopView.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx): Implementar `FilterSliceBar` sin emojis para el selector de secciones (`Hero Sliders`, `Destacadas`, `Categorías`, `Navbar`).

---

## Phase 3: Landing Page Integration & Typography Scaling

**Purpose**: Conectar las secciones de categorías del landing page directamente a `layoutConfig.categories` y calibrar la escala tipográfica responsiva.

- [x] T009 [MODIFY] [page.tsx](file:///c:/Dev/pristinoplant/app/src/app/(shop)/page.tsx): Reemplazar el fallback erróneo que leía de `heroSlidesData` por los valores reales de `layoutConfig?.categories` (imagen, título, subtítulo).
- [x] T010 [MODIFY] [HeroSlideshow.tsx](file:///c:/Dev/pristinoplant/app/src/components/shop/HeroSlideshow.tsx): Calibrar escala responsiva de títulos, subtítulos y botón de acción para soportar `< tds-xs`, `tds-xs`, `tds-sm` y `tds-lg` sin roturas en pantallas pequeñas.
- [x] T011 [MODIFY] [TeslaSection.tsx](file:///c:/Dev/pristinoplant/app/src/components/shop/TeslaSection.tsx): Calibrar escala responsiva de títulos, subtítulos y botón de acción en las secciones de categorías de la landing.

---

## Phase 4: Sidebar Mobile Synchronization

**Purpose**: Inyectar `layoutConfig` en el Sidebar móvil para que sus fotos sean gemelas a las configuradas en `/shop-manager`.

- [x] T012 [MODIFY] [layout.tsx](file:///c:/Dev/pristinoplant/app/src/app/(shop)/layout.tsx): Pasar `layoutConfig={layoutConfig}` al componente `<Sidebar />`.
- [x] T013 [MODIFY] [Sidebar.tsx](file:///c:/Dev/pristinoplant/app/src/components/ui/sidebar/Sidebar.tsx): Aceptar prop `layoutConfig` y propagarla a `<ShopSidebar />`.
- [x] T014 [MODIFY] [ShopSidebar.tsx](file:///c:/Dev/pristinoplant/app/src/components/ui/sidebar/ShopSidebar.tsx): Aceptar `layoutConfig` y generar rutas dinámicas con las fotos de categorías actualizadas.

---

## Phase 5: Verification & Quality Assurance

**Purpose**: Validar que no existan errores de linting, tipos rotos ni regresiones.

- [x] T015 Ejecutar `pnpm lint` en `app` para asegurar cero errores de ESLint, cero `any` y respeto de barriles `@/`.
- [ ] T016 Probar en navegador la navegación con `FilterSliceBar` sin emojis, persistencia y reflejo en landing y sidebar móvil.
- [ ] T017 Actualizar `commit.txt` anexando la nueva propuesta de commit según el protocolo.

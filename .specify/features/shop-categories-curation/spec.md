# Feature Specification: Sincronización y Curaduría de Categorías (shop-categories-curation)

**Feature Branch**: `Dev`

**Created**: 2026-08-27

**Status**: Draft

**Input**: Solicitud del usuario para corregir la falta de reflejo de las fotos de Categorías en el landing page, sincronizar las fotos de categorías con el Sidebar móvil, conectar las fotos de especies al seleccionarlas, permitir la configuración de títulos y subtítulos personalizados en `/shop-manager`, estandarizar los selectores e inputs con `SelectDropdown`, `FormField` e `Input`, e implementar el componente `FilterSliceBar` sin emojis para el selector de secciones (`Hero Sliders`, `Destacadas`, `Categorías`, `Navbar`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Curaduría Completa de Categorías en Shop Manager (Priority: P1)

El administrador entra a `/shop-manager`, navega a la pestaña **Categorías**, y para cada una de las 4 categorías comerciales (`Orquídeas`, `Rosas del Desierto`, `Cactus`, `Suculentas`):
1. Encuentra selectores estilizados con el estándar UI del proyecto (`SelectDropdown` dentro de `FormField`), sin etiquetas HTML `<select>` nativas crudas.
2. Puede seleccionar una especie del tipo de planta correspondiente mediante la cascada reactiva (Tipo -> Género -> Especie).
3. Al seleccionar la especie, se cargan y conectan automáticamente sus fotografías en el `MediaPicker`.
4. El administrador puede seleccionar la fotografía representativa deseada.
5. Puede editar el **Título** y el **Subtítulo** en campos `Input` estandarizados que se presentarán en la sección de esa categoría en la landing page.
6. Al hacer clic en "Guardar Configuración", los datos se persisten en la base de datos dentro del registro `shop_layout`.

**Why this priority**: Es la interfaz central de curaduría que alimenta tanto el landing page como el sidebar móvil, garantizando cumplimiento de las directrices UI del proyecto.

**Independent Test**:
Entrar a `/shop-manager`, verificar que los selectores usen el componente `SelectDropdown` del sistema de diseño con animaciones y estilos consistentes. Modificar el título de "Orquídeas" a "Orquídeas Exóticas", seleccionar una especie de orquídea, elegir una foto en el MediaPicker, guardar y recargar la página para verificar la persistencia.

**Acceptance Scenarios**:

1. **Given** el administrador en la pestaña Categorías, **When** interactúa con los selectores de Tipo, Género y Especie, **Then** estos renderizan con `SelectDropdown` y `FormField` con la paleta de colores del tema.
2. **Given** el administrador en la pestaña Categorías, **When** selecciona una especie en la cascada, **Then** el `MediaPicker` muestra todas las fotos registradas de dicha especie y guarda su `speciesId`.
3. **Given** el administrador edita los campos de texto, **When** escribe un nuevo título y subtítulo en los componentes `Input`, **Then** se actualiza el estado local y se persiste al hacer clic en "Guardar Configuración".

---

### User Story 2 - Selector de Secciones con FilterSliceBar (Priority: P1)

El administrador en `/shop-manager` cuenta con una barra de navegación de secciones implementada con el componente `FilterSliceBar` de `@/components`:
1. Muestra las 4 secciones en el orden exacto: `Hero Sliders`, `Destacadas`, `Categorías`, `Navbar`.
2. Las etiquetas se presentan en texto plano sin emojis.
3. Al hacer clic en cada opción, se transiciona fluidamente entre las vistas de configuración.

**Why this priority**: Homogeniza la experiencia de navegación de `/shop-manager` con el resto de los módulos administrativos (Monitoreo, Laboratorio, Inventario).

**Independent Test**:
Visitar `/shop-manager`, comprobar la presencia de `FilterSliceBar`, alternar entre las 4 secciones comprobando que cada una renderiza su contenido correspondiente sin emojis en los títulos de pestañas.

**Acceptance Scenarios**:

1. **Given** el administrador en `/shop-manager`, **When** observa el selector superior, **Then** visualiza `FilterSliceBar` con las opciones `Hero Sliders`, `Destacadas`, `Categorías`, `Navbar` sin emojis.
2. **Given** un clic en cualquiera de las opciones, **When** cambia la selección, **Then** el contenido inferior se actualiza de inmediato.

---

### User Story 3 - Reflejo Fiel en Secciones de Categorías del Landing Page (Priority: P1)

El cliente visita la raíz de la tienda (`/`) y observa las secciones de categorías (`TeslaSection`). Cada sección:
1. Renderiza la imagen configurada para esa categoría en `shop_layout.categories[key].imageUrl`.
2. Muestra el título y subtítulo personalizados configurados por el administrador (o los fallbacks por defecto si no han sido modificados).
3. Mantiene el botón de acción principal ("Explorar catálogo") apuntando al catálogo de ese tipo de planta (`/category/plants/[slug]`).
4. Mantiene los Hero Sliders apuntando a `/plant/[slug]` de la especie destacada correspondiente.

**Why this priority**: Resuelve directamente el bug reportado donde la configuración de categorías no tenía ningún impacto en el landing page debido a que leía erróneamente de `heroSlidesData`.

**Independent Test**:
Configurar una imagen y título para "Cactus" en `/shop-manager`, guardar, visitar `/` y verificar que la sección correspondiente a Cactus muestre la imagen y título elegidos con su enlace a `/category/plants/cactus`.

**Acceptance Scenarios**:

1. **Given** una configuración guardada en `shop_layout`, **When** un usuario visita `/`, **Then** las secciones de categorías toman la imagen, título y subtítulo directamente de `layoutConfig.categories`.
2. **Given** un Hero Slider con especie asociada, **When** el usuario pulsa "Comprar ahora", **Then** es redirigido a `/plant/[slug]`.

---

### User Story 4 - Sincronización de Fotos en el Sidebar Móvil (Priority: P2)

El cliente en dispositivo móvil (o viewport reducido) abre el menú lateral (`Sidebar`), pulsa en la sección "Plantas" y visualiza las categorías de plantas (`Orquídeas`, `Rosas del Desierto`, `Cactus`, `Suculentas`).
1. Cada tarjeta de categoría en el sidebar muestra la fotografía configurada para esa categoría en `shop_layout.categories`.
2. Al pulsar sobre una categoría, navega al catálogo correspondiente (`/category/plants/[slug]`).
3. Esta sincronización se mantiene activa en cualquier ruta de la tienda (incluyendo `/`, `/plant/[slug]`, `/cart`, etc.).

**Why this priority**: Garantiza la coherencia visual "gemela" entre la landing page y el sidebar móvil solicitada expresamente.

**Independent Test**:
Cambiar la foto de la categoría "Suculentas" en `/shop-manager`, navegar desde el móvil a `/plant/alguna-especie`, abrir el sidebar, ir a "Plantas" y constatar que la tarjeta de "Suculentas" muestra la nueva imagen configurada.

**Acceptance Scenarios**:

1. **Given** la apertura del sidebar móvil en cualquier ruta de `(shop)`, **When** se navega al submenú "Plantas", **Then** las imágenes de las categorías coinciden con las configuradas en `/shop-manager`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extender `ShopLayoutConfig` en `store-actions.ts` para que cada categoría (`orchids`, `adenium_obesum`, `cactus`, `succulents`) acepte de forma opcional `speciesId?: string`, `title?: string` y `subtitle?: string`, manteniendo `imageUrl: string` y compatibilidad hacia atrás.
- **FR-002**: Refactorizar `SpeciesSelectorCascade` en `ShopView.tsx` para utilizar `SelectDropdown` y `FormField` de `@/components` en lugar de etiquetas `<select>` nativas, con sincronización de estado reactiva.
- **FR-003**: En `ShopView.tsx` (pestaña Categorías), persistir `speciesId` en el estado de cada categoría y utilizarlo para controlar la cascada y poblar el `MediaPicker`.
- **FR-004**: En `ShopView.tsx`, reemplazar los `<input className="input-base">` nativos en Hero Sliders, Categorías y Megamenú por `Input` y `FormField` de `@/components`.
- **FR-005**: En `ShopView.tsx` (pestaña Categorías), añadir inputs `Input` para `Título en Landing` y `Subtítulo en Landing` con placeholders legibles.
- **FR-006**: Reemplazar las pestañas nativas con botones de `ShopView.tsx` por el componente oficial `FilterSliceBar` de `@/components` con las opciones sin emojis: `Hero Sliders`, `Destacadas`, `Categorías`, `Navbar`.
- **FR-007**: En `app/(shop)/page.tsx`, desvincular `categoriesData` de `heroSlidesData` y conectar directamente las propiedades `image`, `title` y `subtitle` a `layoutConfig.categories` con sus respectivos valores por defecto.
- **FR-008**: Proveer `layoutConfig` al componente `Sidebar` en `app/(shop)/layout.tsx` y propagarlo a `ShopSidebar`.
- **FR-009**: En `ShopSidebar.tsx`, actualizar las categorías de la ruta `plants` utilizando las imágenes de `layoutConfig.categories`.
- **FR-010**: En `saveShopLayoutConfig`, invocar `revalidatePath('/', 'layout')` para forzar la actualización de la caché del layout completo (sidebar y header).

### Key Entities

- **ShopLayoutConfig**: Configuración estética centralizada almacenada en `SystemSetting` con clave `shop_layout`.
- **CategoryConfigItem**: Sub-objeto dentro de `ShopLayoutConfig.categories` compuesto por `speciesId`, `title`, `subtitle`, e `imageUrl`.
- **FilterSliceGroup / FilterSliceOption**: Estructuras de datos para la barra de navegación deslizable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `FilterSliceBar` renderizado en `/shop-manager` sin emojis con las opciones `Hero Sliders`, `Destacadas`, `Categorías`, `Navbar`.
- **SC-002**: Los selectores e inputs en `/shop-manager` cumplen al 100% con los estándares de diseño del proyecto (`SelectDropdown`, `FormField`, `Input`).
- **SC-003**: Los cambios realizados en `/shop-manager` (imágenes, títulos, subtítulos de categorías) se reflejan de inmediato en `/` tras guardar.
- **SC-004**: El Sidebar móvil muestra en tiempo real las mismas fotografías asignadas a cada categoría de plantas.
- **SC-005**: En `/shop-manager`, seleccionar una especie en cualquier categoría carga instantáneamente sus imágenes en el `MediaPicker` sin requerir recargar la página.
- **SC-006**: Cero regresiones en el flujo de Hero Sliders hacia `/plant/[slug]`.

# Architecture & Implementation Plan: Sincronización y Curaduría de Categorías (shop-categories-curation)

**Feature Branch**: `Dev`

**Created**: 2026-08-27

**Status**: Draft

**Prerequisites**: `spec.md` (completed)

## Architectural Design

### 1. Data Contract & Schema (`ShopLayoutConfig`)

En `app/src/actions/inventory/store-actions.ts`:
Interfaz `ShopLayoutConfig` con `CategoryConfigItem`:

```typescript
export interface CategoryConfigItem {
  speciesId?: string
  title?: string
  subtitle?: string
  imageUrl: string
}

export interface ShopLayoutConfig {
  heroSlides: {
    speciesId: string
    slug: string
    title: string
    imageUrl: string
  }[]
  categories: {
    orchids: CategoryConfigItem
    adenium_obesum: CategoryConfigItem
    cactus: CategoryConfigItem
    succulents: CategoryConfigItem
  }
  megamenu: {
    featuredItem: {
      speciesId: string
      slug: string
      title: string
      imageUrl: string
    }
  }
  featuredSpeciesIds: string[]
}
```

En `saveShopLayoutConfig()`, mantener:
`revalidatePath('/', 'layout')`
para asegurar que todas las páginas que montan `(shop)/layout.tsx` reciban los cambios del sidebar y header.

---

### 2. Barra de Navegación de Secciones con `FilterSliceBar` (`ShopView.tsx`)

En `app/src/app/(orchidarium)/(inventory)/shop-manager/ui/ShopView.tsx`:

1. **Definición de Secciones**:
   ```typescript
   type TabType = 'hero' | 'featured' | 'categories' | 'navbar'

   const SECTION_OPTIONS: FilterSliceOption[] = [
     { id: 'hero', label: 'Hero Sliders' },
     { id: 'featured', label: 'Destacadas' },
     { id: 'categories', label: 'Categorías' },
     { id: 'navbar', label: 'Navbar' },
   ]
   ```
   - Sin emojis en los textos de etiqueta.
   - En el orden solicitado por el usuario.

2. **Integración del Componente**:
   - Reemplazar el contenedor `<div className="border-input-outline flex gap-2 border-b pb-1">` por `<FilterSliceBar />`.
   - Propiedades:
     ```tsx
     <FilterSliceBar
       activeVariant="surface"
       ariaLabel="Secciones de configuración de tienda"
       className="w-full"
       groups={sectionGroups}
       rounded="md"
     />
     ```
   - Actualizar los condicionales de renderizado para mapear `'navbar'` a la sección del megamenú header.

---

### 3. Estandarización de Formularios (`ShopView.tsx`)

1. **`SpeciesSelectorCascade`**:
   - Implementado con `SelectDropdown` y `FormField` de `@/components`.
   - Mapeo a `SelectOption[]` (`{ label, value }`).
   - Sincronización reactiva sin cascading renders (render-time state adjustment).

2. **Inputs**:
   - Implementados con `Input` y `FormField` de `@/components`.

3. **Pestaña Categorías**:
   - `activeSpeciesId` persistido mediante `cat.speciesId`.
   - `MediaPicker` conectado con las imágenes de la especie.
   - Inputs `FormField` + `Input` para "Título en Landing" y "Subtítulo en Landing".

---

### 4. Consumo en Landing Page (`app/(shop)/page.tsx`)

En `app/src/app/(shop)/page.tsx`:
- `categoriesData` lee directamente de `layoutConfig?.categories` (`title`, `subtitle`, `imageUrl`).
- Hero Sliders redirigen a `/plant/${species.slug}`.

---

### 5. Propagación y Sincronización al Sidebar Móvil

1. **`app/src/app/(shop)/layout.tsx`**: Pasa `layoutConfig={layoutConfig}` al componente `<Sidebar />`.
2. **`app/src/components/ui/sidebar/Sidebar.tsx`**: Propaga `layoutConfig` a `<ShopSidebar />`.
3. **`app/src/components/ui/sidebar/ShopSidebar.tsx`**: Construye `dynamicShopRoutes` con `useMemo` inyectando las `imageUrl` actualizadas de `layoutConfig.categories`.

---

## Testing & Validation Strategy

1. **TypeScript & Linting**:
   - Ejecutar `pnpm lint` en `app` asegurando tipado estricto sin `any` y respeto de reglas ESLint.
2. **Prueba en Navegador**:
   - Navegar en `/shop-manager` haciendo clic en las 4 opciones de `FilterSliceBar`.
   - Verificar la ausencia de emojis en los tabs.
   - Constatar actualización en `/` (landing page) y en el menú móvil (Sidebar).

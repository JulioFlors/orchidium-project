# Implementation Plan: migrate-static-plant-images (Imágenes Estáticas a R2)

**Branch**: `Dev` | **Date**: 2026-06-22 | **Spec**: [.specify/features/migrate-static-plant-images/spec.md](file:///c:/Dev/pristinoplant/.specify/features/migrate-static-plant-images/spec.md)

## Summary
Reemplazar y mapear todas las referencias directas de la carpeta local `public/plants/` para que apunten a Cloudflare R2 utilizando el helper `getImageUrl`. Complementar el script `migrate-images-to-r2.ts` para que suba los recursos estáticos requeridos por el landing y el sidebar.

## Proposed Changes

### 1. Modificar Componentes del Frontend (Consumir R2)
- **`app/src/components/shop/TeslaSection.tsx`**:
  - Envolver la propiedad `image` del componente con `getImageUrl(image)`.
- **`app/src/components/shop/CategoriesSection.tsx`**:
  - Envolver la propiedad `category.image` con `getImageUrl(category.image)`.

### 2. Modificar Script de Migración (Subir Estáticos)
- **`services/seed/src/scripts/migrate-images-to-r2.ts`**:
  - Agregar un arreglo constante de las imágenes estáticas del landing page y el sidebar:
    ```typescript
    const STATIC_PLANT_IMAGES = [
      'orchids/orchids.webp',
      'adenium_obesum/marbella_0_2000.webp',
      'cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
      'cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
      'succulents/crassula-capitella-campfire_0_2000.webp',
      'succulents/pachyveria-scheideckeri_2_2000.webp'
    ]
    ```
  - Implementar un bucle secundario en el script para verificar existencia en el bucket R2 y subir estas imágenes estáticas a R2 bajo el prefijo `plants/`.

# Tasks: migrate-static-plant-images (Imágenes Estáticas a R2)

**Input**: Design documents from `.specify/features/migrate-static-plant-images/`

**Prerequisites**: plan.md (required), spec.md (required)

---

## Phase 1: setup & migration Script (Backend/Infrastructure)

- [ ] T001 [MODIFY] Agregar lógica de subida de imágenes estáticas fijas en `services/seed/src/scripts/migrate-images-to-r2.ts`
- [ ] T002 Ejecutar `pnpm db:migrate-images` localmente para subir las imágenes estáticas al bucket R2

---

## Phase 2: Frontend Integration

- [ ] T003 [MODIFY] Modificar `app/src/components/shop/TeslaSection.tsx` para usar `getImageUrl(image)`
- [ ] T004 [MODIFY] Modificar `app/src/components/shop/CategoriesSection.tsx` para usar `getImageUrl(category.image)`

---

## Phase 3: Verification & Polish

- [ ] T005 Correr `pnpm lint` en `app` para asegurar tipado correcto
- [ ] T006 Verificar en local mediante navegador que las imágenes se carguen de R2

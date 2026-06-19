# Tareas: Migración de Imágenes de Plantas a Cloudflare R2

- [x] Crear archivo `.vercelignore` en la raíz del monorepo
- [x] Agregar `NEXT_PUBLIC_R2_PUBLIC_URL` a `.env` y `.env.template`
- [x] Registrar `NEXT_PUBLIC_R2_PUBLIC_URL` en `turbo.json`
- [x] Crear el helper centralizado `getImageUrl` en `app/src/lib/image-utils.ts`
- [x] Exportar `getImageUrl` en `app/src/lib/index.ts`
- [x] Actualizar componentes del frontend de la tienda (`ProductImage`, `CartView`, `ProductGridItem`, `MobileSlideshow`, `Slideshow`)
- [x] Actualizar componentes del orquideario (`SpeciesInventoryCard`, `SpeciesDetailView`) para usar el helper de `@/lib`
- [x] Crear el script de migración masiva `migrate-images-to-r2.ts` en `services/seed/src/scripts/`
- [x] Agregar los scripts correspondientes en `package.json` de la raíz y de `services/seed`
- [x] Ejecutar migración y validar con el linter (`pnpm lint`)

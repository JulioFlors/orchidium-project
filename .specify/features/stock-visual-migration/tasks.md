# Tasks: Gemelo Digital de Stock, Refactor de Rutas y Alineación de Vistas (stock-visual-migration)

Checklist de tareas de micro-gerencia para implementar el refactor de rutas, alineación de vistas y el Gemelo Digital de stock.

## Fase 1: Refactor de Rutas Comerciales (`/product` ➔ `/plant`) 🚀
- [ ] **Renombrar Carpeta de Ruta**:
  - [ ] Mover/renombrar `app/src/app/(shop)/product/[slug]` a `app/src/app/(shop)/plant/[slug]`.
- [ ] **Actualizar Referencias y Links**:
  - [ ] `ProductGridItem.tsx`: Cambiar `href` hacia `/plant/[slug]`.
  - [ ] Buscador y menús de navegación: Actualizar enlaces hacia `/plant/[slug]`.

## Fase 2: Alineación Visual 2 Columnas de `/catalog/[id]` 🎨
- [ ] **Rediseñar Interfaz de Catálogo**:
  - [ ] Adaptar `SpeciesDetailView.tsx` en `/catalog/[id]` a la maquetación responsiva en 2 columnas (Fotos/Gestor R2 a la izquierda, formulario WYSIWYG de taxonomía a la derecha).

## Fase 3: Detalle Operativo y Gemelo Digital en `/stock/[id]` 🌸
- [ ] **Crear Ruta Dinámica `/stock/[id]`**:
  - [ ] Añadir `app/src/app/(orchidarium)/(inventory)/stock/[id]/page.tsx`.
- [ ] **Crear Vista `StockDetailView.tsx`**:
  - [ ] Implementar la columna izquierda operativa (Estados biológicos, conteos por Zonas con alias y filtros interactivos de lista).
  - [ ] Implementar la columna derecha comercial (precios y stock digital de variantes).
- [ ] **Implementar Gemelo Digital y CRUD mediante Tarjetas Responsivas**:
  - [ ] Crear el componente de tarjeta responsivo `PlantInstanceCard.tsx` para mostrar la información del ejemplar individual (con soporte para el valor literal `"Sin Fecha"`).
  - [ ] Crear el modal `PlantFormModal.tsx` para añadir/editar instancias físicas individuales.
  - [ ] Crear el modal `BatchPlantEntryModal.tsx` para ingestas masivas multivariante (múltiples tamaños).
  - [ ] Crear el modal `FloweringEventModal.tsx` para iniciar eventos de floración en plantas seleccionadas.
  - [ ] Integrar el distintivo `Madre` (usando `PlantStatus.MOTHER` de Prisma, eximiéndola de precio).

## Fase 4: Aseguramiento de Calidad 🧪
- [ ] Validar la navegación pública a `/plant/[slug]`.
- [ ] Probar la ingesta por lote registrando múltiples macetas de un solo clic.
- [ ] Verificar el CRUD de instancias individuales y el registro de floración en las tarjetas `PlantInstanceCard`.
- [ ] Ejecutar `pnpm build` para confirmar cero errores de compilación y tipado.

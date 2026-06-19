# Tasks: shop-landing-page (Rediseño Tesla)

**Input**: Design documents from `.specify/features/shop-landing-page/`

**Prerequisites**: plan.md (required), spec.md (required)

---

## Phase 1: Setup & Database (Shared Infrastructure)

**Purpose**: Actualizar la base de datos con el campo de destacados.

- [x] T001 [MODIFY] Agregar `isFeatured Boolean @default(false)` en `packages/database/prisma/schema.prisma`
- [x] T002 Ejecutar `pnpm db:migrate` local para generar y aplicar la migración de desarrollo
- [x] T003 [MODIFY] Actualizar el script de seeding si es necesario para marcar algunas plantas como destacadas

---

## Phase 2: Foundational (Actions & Backend)

**Purpose**: Crear las acciones del servidor para consultas Prisma y alternar destacados.

- [x] T004 [NEW] Crear `app/src/actions/species/get-landing-species.ts` para obtener especies en floración y destacadas (implementado en `species-actions.ts`)
- [x] T005 [NEW] Crear `app/src/actions/species/toggle-species-featured.ts` (Server Action para alternar `isFeatured`, implementado en `species-actions.ts`)
- [x] T006 [MODIFY] Registrar y exportar las nuevas acciones en el index de acciones de la app

---

## Phase 3: User Story 1 - Experiencia Snap Scroll y Header (Priority: P1) 🎯 MVP

**Goal**: Implementar el contenedor de snap scroll, el header transparente y el componente reutilizable `TeslaSection`.

- [x] T007 [NEW] Crear el componente `TeslaSection.tsx` en `app/src/components/shop/TeslaSection.tsx`
- [x] T008 [NEW] Crear el componente `TeslaValuesSection.tsx` en `app/src/components/shop/TeslaValuesSection.tsx`
- [x] T009 [MODIFY] Registrar nuevos componentes en `app/src/components/shop/index.ts`
- [x] T010 [MODIFY] Modificar `app/src/components/ui/header/Header.tsx` para suscribirse al scroll y hover condicional transparentes
- [x] T011 [MODIFY] Reestructurar `app/src/app/(shop)/page.tsx` para aplicar clases de snap scroll (`snap-y snap-mandatory`) y renderizar las secciones a pantalla completa.

---

## Phase 4: User Story 2 - Productos Destacados en Landing Page (Priority: P2)

**Goal**: Renderizar rejillas filtradas de "Floración Activa" y "Los más vendidos".

- [x] T012 [MODIFY] Integrar las rejillas en las secciones finales de `app/src/app/(shop)/page.tsx` consumiendo las acciones del servidor
- [x] T013 [MODIFY] Ajustar visualización del Footer al final de la última sección de snapping

---

## Phase 5: User Story 3 - Gestión de Destacados (Priority: P3)

**Goal**: Agregar toggle interactivo en el gestor de la tienda.

- [x] T014 [MODIFY] Modificar la vista de gestión `/shop-manager` (`app/src/app/(shop)/shop-manager/page.tsx` o subcomponentes) para incluir la columna "Destacado" con el switch interactivo conectado a `toggleSpeciesFeatured`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Garantizar la calidad técnica del código y el registro de bitácoras.

- [x] T015 Ejecutar `pnpm lint:fix` en la raíz del monorepo (verificado con lint de la app)
- [x] T016 Ejecutar `pnpm build` para comprobar que compile correctamente (compilación de la app exitosa)
- [x] T017 Actualizar `roadmap.md` y `backlog.md`
- [x] T018 Generar la propuesta de commit en `commit.txt`

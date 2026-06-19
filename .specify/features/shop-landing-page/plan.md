# Implementation Plan: shop-landing-page (Rediseño Tesla)

**Branch**: `Dev` | **Date**: 2026-06-18 | **Spec**: [.specify/features/shop-landing-page/spec.md](file:///c:/Dev/pristinoplant/.specify/features/shop-landing-page/spec.md)

**Input**: Feature specification from `.specify/features/shop-landing-page/spec.md`

## Summary

Rediseñar la landing page comercial (`/`) duplicando la estética de la tienda oficial de Tesla (secciones a pantalla completa con scroll snapping y header transparente dinámico), integrando además dos rejillas de productos filtradas comercialmente: "Floración Activa" (calculado a partir de los gemelos digitales de plantas) y "Los más vendidos" (mediante un toggle de destacado `isFeatured` en base de datos).

## Technical Context

- **Language/Version**: TypeScript, React 19, Next.js 16 (App Router)
- **Primary Dependencies**: `motion` (framer-motion v12), `lucide-react`, `next-themes`, `clsx`, `tailwind-merge`
- **Storage**: Prisma + PostgreSQL (campo `isFeatured` en `Species`, consulta de `FloweringEvent` activos)
- **Testing**: pnpm lint, manual verification
- **Target Platform**: VPS Ubuntu 24.04
- **Constraints**: 
  - Cumplir el protocolo Local-to-Prod de base de datos (`pnpm db:migrate` local -> `pnpm db:deploy` prod).
  - No usar el tipo `any`.
  - Usar importaciones barril `@/components`.

## Constitution Check

*GATE: Passed. Database schema changes follow the master developer protocol.*

## Project Structure

### Documentation (this feature)

```text
.specify/features/shop-landing-page/
├── spec.md              # Feature specification
├── plan.md              # Technical implementation plan
└── tasks.md             # Task checklist
```

### Source Code (repository root)

```text
packages/database/prisma/
└── schema.prisma                 # Agregar isFeatured en Species
app/src/
├── actions/
│   └── species/
│       ├── get-featured-species.ts   # Acción para obtener especies destacadas y en floración
│       └── toggle-species-featured.ts # Server Action para alternar isFeatured
├── app/
│   └── (shop)/
│       ├── page.tsx              # Integrar secciones a pantalla completa y snapping
│       └── shop-manager/
│           └── page.tsx          # Agregar toggle interactivo de destacado
├── components/
│   ├── shop/
│   │   ├── index.ts              # Archivo barril del módulo shop
│   │   ├── TeslaSection.tsx       # Componente de sección pantalla completa estilo Tesla
│   │   └── TeslaValuesSection.tsx # Componente de propuestas de valor estilo Tesla
│   ├── ui/
│   │   └── header/
│   │       └── Header.tsx        # Modificar para soporte transparente + hover
│   └── index.ts                  # Exportar módulo shop
```

## Database Migration Plan

1. **Modificar Esquema**:
   Agregar `isFeatured Boolean @default(false)` en `model Species` en `packages/database/prisma/schema.prisma`.
2. **Generar y Aplicar en Local**:
   Ejecutar `pnpm db:migrate` en local. Esto generará la migración SQL y la aplicará a la base de datos de desarrollo.
3. **Despliegue en Producción (VPS)**:
   Se aplicará la migración en producción usando `pnpm db:deploy` en local apuntando a la `DATABASE_URL` del VPS.

## Lógica de Consultas Prisma

### Floración Activa (Especies con plantas en floración real)
```typescript
const speciesInFlowering = await prisma.species.findMany({
  where: {
    plants: {
      some: {
        status: 'AVAILABLE',
        FloweringEvent: {
          some: {
            endDate: null,
          },
        },
      },
    },
  },
  include: {
    images: true,
    variants: true,
    genus: true,
  },
  take: 9,
})
```

### Especies Destacadas (Los más vendidos)
```typescript
const featuredSpecies = await prisma.species.findMany({
  where: {
    isFeatured: true,
  },
  include: {
    images: true,
    variants: true,
    genus: true,
  },
  orderBy: {
    name: 'asc',
  },
  take: 9,
})
```

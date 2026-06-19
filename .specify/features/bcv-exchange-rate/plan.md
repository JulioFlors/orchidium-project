# Implementation Plan: bcv-exchange-rate

**Branch**: `Dev` | **Date**: 2026-06-18 | **Spec**: [.specify/features/bcv-exchange-rate/spec.md](file:///c:/Dev/pristinoplant/.specify/features/bcv-exchange-rate/spec.md)

**Input**: Feature specification from `.specify/features/bcv-exchange-rate/spec.md`

## Summary

Implementar la sincronización diaria de la tasa de cambio USD/VES oficial del BCV en el scheduler, guardándola de forma histórica en la base de datos Postgres. En el frontend de la tienda, crear un store global de moneda, añadir un botón toggle en el Header/Sidebar y adaptar las vistas de precios para convertir y formatear dinámicamente entre USD y bolívares (VES).

## Technical Context

- **Language/Version**: TypeScript, Node.js, Next.js (App Router)
- **Primary Dependencies**: `croner`, `zustand`, `prisma`, Native fetch
- **Storage**: Prisma (PostgreSQL)
- **Testing**: Manual verification, scraping dry run
- **Target Platform**: VPS Ubuntu 24.04 (Docker + Node.js)
- **Performance Goals**: Renderizado rápido del toggle sin hydration mismatch, scraper tolerante a fallos con fallback.

## Constitution Check

*GATE: Passed.*

## Project Structure

### Documentation (this feature)

```text
.specify/features/bcv-exchange-rate/
├── spec.md              # Feature specification
├── plan.md              # Technical implementation plan
└── tasks.md             # Task checklist (Phase 3)
```

### Source Code

```text
packages/database/prisma/
└── schema.prisma         # Nuevo modelo ExchangeRate

services/scheduler/src/
└── index.ts              # Cron job de scraping de tasa y almacenamiento (reintento horario si falla)

app/src/
├── actions/
│   └── product/
│       └── get-exchange-rate.ts  # Server action para obtener tasa activa (date <= hoy desc)
├── store/
│   └── currency/
│       └── currency.store.ts     # Store de Zustand para persistencia
├── components/
│   └── ui/
│       └── currency-toggle/
│           └── CurrencyToggle.tsx # Botón toggle visual (debajo de ThemeToggle en sidebar)
└── ... (modificaciones de componentes de precio)
```

## Proposed Changes

1. **Base de Datos**: Modificar `schema.prisma` agregando `ExchangeRate`. Crear el directorio de migración y generar el script SQL usando exactamente:
   ```powershell
   pnpm --filter @package/database prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/migrations/20260618181200_add_exchange_rate/migration.sql
   ```
   Aplicar con `pnpm --filter @package/database db:deploy` (local y VPS). NUNCA usar redirección `>` de PowerShell.
2. **Scheduler**: Añadir rutina de scraping diario del BCV a las 8:30 PM Caracas. Si no encuentra la tasa de mañana, reintentar cada hora.


3. **Actions**: Agregar Server Action `getLatestExchangeRate` que consulta tasa activa (`date <= hoy`, desc, limit 1). Retornar null si no hay tasa válida o si es muy antigua, provocando fallback a USD.
4. **Zustand Store**: Crear `useCurrencyStore` persistente. Si no hay tasa en la base de datos, forzar moneda a USD.
5. **Componente Visual**: Crear `CurrencyToggle.tsx` e integrarlo en `ShopSidebar.tsx` y `OrchidariumSidebar.tsx` debajo de `ThemeToggle` siguiendo el mismo estilo.
6. **Vistas de Precios**: Adaptar `ProductGridItem.tsx`, `AddToCart.tsx`, y `CartView.tsx` para usar la moneda activa.

## Verification Plan

- **Automatic Tests**: Ejecución local de parser de tasa.
- **Manual Tests**: Activar toggle y validar conversión visual matemática de precios y persistencia en LocalStorage. Si la DB no tiene tasas, confirmar que el toggle no se muestre o mantenga USD.


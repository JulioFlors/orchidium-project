# Estándar de Desarrollo: Patrón de Páginas (Next.js App Router)

Este documento define la estructura obligatoria para las páginas del proyecto Pristinoplant para garantizar la inyección de metadatos y la separación de responsabilidades.

## Estructura de Directorios

Cada ruta en `app/` debe seguir este esquema:

```text
(nombre-de-la-ruta)/
├── page.tsx          # Server Component (Metadatos + Wrapper)
└── ui/               # Directorio de lógica de interfaz
    ├── index.ts      # Archivo barril (Barrel File) de la interfaz
    ├── View.tsx      # Componente principal ('use client')
    └── components/   # Sub-componentes exclusivos de esta ruta
        └── index.ts  # Archivo barril para componentes locales
```

## Responsabilidades

### 1. `page.tsx` (Server Component)

- **Metadatos**: Definir y exportar el objeto `metadata`.
- **Fetching de Datos (SSR)**: Realizar fetching de datos críticos que deben estar disponibles al cargar la página.
- **Layout**: Envolver la vista en contenedores de layout globales si es necesario.
- **IMPORTANTE**: No debe contener `'use client'`.

### 2. `ui/View.tsx` (Client Component)

- **Estado**: Manejar `useState`, `useEffect` y otros hooks de React.
- **Interactividad**: Manejar eventos de usuario.
- **Visualización**: Renderizar la interfaz de usuario específica de la ruta.

### 3. `ui/index.ts`

- Exportar los componentes necesarios para que `page.tsx` los consuma.

## Ejemplo de Implementación

### `page.tsx`

```tsx
import type { Metadata } from 'next'
import { MonitoringView } from './ui'

export const metadata: Metadata = {
  title: 'Monitoreo Ambiental',
  description: 'Visualización de datos de sensores en tiempo real.',
}

export default function Page() {
  return <MonitoringView />
}
```

### `ui/index.ts`

```ts
export * from './MonitoringView'
```

### `ui/MonitoringView.tsx`

```tsx
'use client'

export function MonitoringView() {
  // Lógica de hooks aquí...
  return <div>Contenido de la página</div>
}
```

## Reglas de Importación

- Los componentes de la carpeta `ui/` **no** deben ser importados por otras páginas. Si un componente es reutilizable, debe moverse a `@/components`.
- Importar siempre desde el archivo barril `index.ts` de la carpeta `ui/`.

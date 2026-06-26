import type { Metadata } from 'next'

import { headers } from 'next/headers'

import { auth } from '@/lib/server'
import { Footer, Sidebar, AdaptiveHeader } from '@/components'
import { Logger } from '@/lib'
import {
  getPlantsNavigation,
  getSearchSuggestions,
  getShopLayoutConfig,
  type ShopLayoutConfig,
  type SearchSuggestion,
  type PlantsNavData,
} from '@/actions'

export const metadata: Metadata = {
  title: {
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant | Shop',
  },
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Usamos Promise.all para cargar todos los datos en paralelo (incluyendo la sesión para hidratar el sidebar)
  // Tipamos el resultado con las interfaces reales para evitar errores de asignación en Header y Sidebar
  const [suggestions, plantsNavData, layoutConfigResult, session] = (await Promise.all([
    getSearchSuggestions(),
    getPlantsNavigation(),
    getShopLayoutConfig(),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]).catch((err) => {
    Logger.warn(
      '⚠️ Error al obtener los datos (shop)/layout (la base de datos podría estar caída):',
      err,
    )

    // Devolvemos valores por defecto consistentes (null para session)
    return [[], [], { ok: false, config: null }, null]
  })) as [
    SearchSuggestion[],
    PlantsNavData[],
    { ok: boolean; config: ShopLayoutConfig | null },
    Record<string, unknown> | null,
  ]

  const layoutConfig = layoutConfigResult?.config || null

  return (
    <div className="flex min-h-dvh flex-col">
      <AdaptiveHeader
        plantsNavData={plantsNavData || []}
        suggestions={suggestions || []}
        layoutConfig={layoutConfig}
      />

      <Sidebar session={session} suggestions={suggestions || []} />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">{children}</main>

      <Footer />
    </div>
  )
}

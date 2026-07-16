'use client'

import type { PlantsNavData, SearchSuggestion, ShopLayoutConfig } from '@/actions'

import { usePathname } from 'next/navigation'

import { Header } from './Header'
import { LandingHeader } from './LandingHeader'

interface Props {
  suggestions?: SearchSuggestion[]
  plantsNavData?: PlantsNavData[]
  layoutConfig?: ShopLayoutConfig | null
}

export function AdaptiveHeader({
  suggestions = [],
  plantsNavData = [],
  layoutConfig = null,
}: Props) {
  const pathname = usePathname()

  if (pathname === '/') {
    return (
      <LandingHeader
        layoutConfig={layoutConfig}
        plantsNavData={plantsNavData}
        suggestions={suggestions}
      />
    )
  }

  return (
    <Header layoutConfig={layoutConfig} plantsNavData={plantsNavData} suggestions={suggestions} />
  )
}

'use client'

import type { PlantsNavData, SearchSuggestion } from '@/actions'

import { usePathname } from 'next/navigation'

import { Header } from './Header'
import { LandingHeader } from './LandingHeader'

interface Props {
  suggestions?: SearchSuggestion[]
  plantsNavData?: PlantsNavData[]
}

export function AdaptiveHeader({ suggestions = [], plantsNavData = [] }: Props) {
  const pathname = usePathname()

  if (pathname === '/') {
    return <LandingHeader plantsNavData={plantsNavData} suggestions={suggestions} />
  }

  return <Header plantsNavData={plantsNavData} suggestions={suggestions} />
}

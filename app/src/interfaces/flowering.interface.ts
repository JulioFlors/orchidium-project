export interface FloweringEventItem {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
  notes?: string | null
  durationDays?: number
  isActive?: boolean
  daysElapsed?: number
}

export interface PlantFloweringStats {
  plantId: string
  lastYearFloweringCount: number
  avgFloweringDurationDays: number
  totalFloweringEvents: number
  monthlyFloweringDistribution: Record<number, number>
  events: FloweringEventItem[]
  isFlowering: boolean
}

export interface SpeciesFloweringAnalyticsData {
  speciesId: string
  speciesName: string
  speciesSlug: string
  avgFloweringDurationDays: number
  lastYearFloweringCount: number
  totalFloweringEvents: number
  monthlyFloweringDistribution: Record<number, number>
  championPlantId: string | null
  plantsStats: Record<string, PlantFloweringStats>
  events: FloweringEventItem[]
}

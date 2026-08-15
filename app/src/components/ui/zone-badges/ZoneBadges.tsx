import React from 'react'
import { MdLayers } from 'react-icons/md'

import { ZoneTypeLabels } from '@/config/mappings'

interface ZoneBadgesProps {
  zones: string[]
  className?: string
}

export function ZoneBadges({ zones, className }: ZoneBadgesProps) {
  if (!zones || zones.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className || ''}`}>
      {zones.map((z) => (
        <span
          key={z}
          className="bg-surface-hover/40 border-input-outline/40 text-primary flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight uppercase whitespace-nowrap shadow-2xs"
        >
          <MdLayers className="text-secondary h-3 w-3 shrink-0 opacity-50" />
          <span>{ZoneTypeLabels[z as keyof typeof ZoneTypeLabels] || z}</span>
        </span>
      ))}
    </div>
  )
}

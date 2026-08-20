import React from 'react'
import { MdLayers } from 'react-icons/md'
import { clsx } from 'clsx'

import { ZoneTypeLabels } from '@/config/mappings'

interface ZoneTagsProps {
  zones: string[]
  className?: string
}

export function ZoneTags({ zones, className }: ZoneTagsProps) {
  if (!zones || zones.length === 0) return null

  return (
    <div className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      {zones.map((z) => (
        <div key={z} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <MdLayers className="text-secondary h-4 w-4 opacity-40" />
          <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
            {ZoneTypeLabels[z as keyof typeof ZoneTypeLabels] || z}
          </span>
        </div>
      ))}
    </div>
  )
}

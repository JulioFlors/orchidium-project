'use client'

import React from 'react'

import { FilterSliceBar } from './FilterSliceBar'

export type TimeFilterPreset = 'all' | 'today' | 'week' | 'next-week' | 'month' | 'next-month'

export type StatusFilterPreset = 'all' | 'PENDING' | 'COMPLETED' | 'CANCELLED'

interface DosingFiltersBarProps {
  timePreset: TimeFilterPreset
  onTimePresetChange: (preset: TimeFilterPreset) => void
  statusPreset: StatusFilterPreset
  onStatusPresetChange: (preset: StatusFilterPreset) => void
  selectedDate?: string
  onSelectedDateChange?: (date?: string) => void
}

export function DosingFiltersBar({
  timePreset,
  onTimePresetChange,
  statusPreset,
  onStatusPresetChange,
  selectedDate,
  onSelectedDateChange,
}: DosingFiltersBarProps) {
  return (
    <div className="bg-surface border-input-outline flex w-full items-center rounded-lg border p-2 shadow-xs">
      <FilterSliceBar
        selectedDate={selectedDate}
        statusPreset={statusPreset}
        timePreset={timePreset}
        onSelectedDateChange={onSelectedDateChange}
        onStatusPresetChange={onStatusPresetChange}
        onTimePresetChange={onTimePresetChange}
      />
    </div>
  )
}

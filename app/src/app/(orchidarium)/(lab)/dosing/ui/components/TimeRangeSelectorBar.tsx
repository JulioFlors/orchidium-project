'use client'

import type { TimeFilterPreset } from './DosingFiltersBar'

import React, { useRef } from 'react'
import { IoCalendarOutline } from 'react-icons/io5'
import clsx from 'clsx'

interface TimeRangeSelectorBarProps {
  preset: TimeFilterPreset
  selectedDate?: string
  onPresetChange: (preset: TimeFilterPreset, customDate?: string) => void
}

export function TimeRangeSelectorBar({
  preset,
  selectedDate,
  onPresetChange,
}: TimeRangeSelectorBarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)

  const timeOptions: { id: TimeFilterPreset; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: '7D' },
    { id: 'month', label: '30D' },
    { id: 'all', label: 'Todos' },
  ]

  const handleCustomDateClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker()
      } catch {
        dateInputRef.current.click()
      }
    }
  }

  const formatCustomDateLabel = (ymd: string): string => {
    const parts = ymd.split('-')

    if (parts.length !== 3) return ymd
    const [year, month, day] = parts
    const shortYear = year.slice(-2)

    return `${day}/${month}/${shortYear}`
  }

  return (
    <div className="bg-hover-overlay flex w-full max-w-full flex-wrap items-center gap-1 rounded-md p-1 tds-sm:w-auto tds-sm:inline-flex">
      {timeOptions.map((opt) => {
        const isActive = preset === opt.id && !selectedDate

        return (
          <button
            key={opt.id}
            className={clsx(
              'focus-visible:outline-accessibility flex-1 cursor-pointer rounded-md px-3 py-1 text-center text-xs font-semibold transition-colors outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 tds-sm:flex-none',
              isActive ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary',
            )}
            type="button"
            onClick={() => onPresetChange(opt.id, undefined)}
          >
            {opt.label}
          </button>
        )
      })}

      {/* Selector de fecha personalizada estilo /monitoring */}
      <div className="relative flex-1 tds-sm:flex-none">
        <input
          ref={dateInputRef}
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          type="date"
          value={selectedDate || ''}
          onChange={(e) => {
            if (e.target.value) {
              onPresetChange('all', e.target.value)
            }
          }}
        />

        <button
          className={clsx(
            'focus-visible:outline-accessibility flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 tds-sm:w-auto',
            selectedDate
              ? 'bg-surface text-primary shadow-xs'
              : 'text-secondary hover:text-primary',
          )}
          type="button"
          onClick={handleCustomDateClick}
        >
          <IoCalendarOutline className="size-3.5 text-action" />
          <span className="font-mono">
            {selectedDate ? formatCustomDateLabel(selectedDate) : 'Fecha'}
          </span>
        </button>
      </div>
    </div>
  )
}

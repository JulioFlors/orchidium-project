'use client'

import type { StatusFilterPreset } from './DosingFiltersBar'

import React from 'react'
import clsx from 'clsx'

interface StatusFilterBarProps {
  preset: StatusFilterPreset
  onPresetChange: (preset: StatusFilterPreset) => void
}

export function StatusFilterBar({ preset, onPresetChange }: StatusFilterBarProps) {
  const statusOptions: { id: StatusFilterPreset; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'COMPLETED', label: 'Completados' },
    { id: 'CANCELLED', label: 'Cancelados' },
  ]

  return (
    <div className="bg-hover-overlay flex w-full max-w-full flex-wrap items-center gap-1 rounded-md p-1 tds-sm:w-auto tds-sm:inline-flex">
      {statusOptions.map((opt) => {
        const isActive = preset === opt.id

        return (
          <button
            key={opt.id}
            className={clsx(
              'focus-visible:outline-accessibility flex-1 cursor-pointer rounded-md px-3 py-1 text-center text-xs font-semibold transition-colors outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 tds-sm:flex-none',
              isActive ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary',
            )}
            type="button"
            onClick={() => onPresetChange(opt.id)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

import React from 'react'
import clsx from 'clsx'

export interface SelectorGroupItem {
  id: string | number
  label: string
  subtitle?: string
  value?: string | number
  percentage?: number
}

interface SelectorGroupProps {
  items: SelectorGroupItem[]
  shape?: 'circle' | 'rectangle'
  mode?: 'info' | 'multi-select' | 'range-select'
  selectedIds?: (string | number)[]
  onSelectChange?: (selectedIds: (string | number)[]) => void
  className?: string
  itemClassName?: string
}

export function SelectorGroup({
  items,
  shape = 'circle',
  mode = 'info',
  selectedIds = [],
  onSelectChange,
  className,
  itemClassName,
}: SelectorGroupProps) {
  const isCircle = shape === 'circle'

  const handleItemClick = (id: string | number) => {
    if (mode === 'info') return

    if ((mode === 'multi-select' || mode === 'range-select') && onSelectChange) {
      const isSelected = selectedIds.includes(id)
      const newSelected = isSelected ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]

      onSelectChange(newSelected)
    }
  }

  return (
    <div className={clsx('flex flex-wrap gap-2.5 isolate', className)}>
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id)
        const hasPercentage = item.percentage !== undefined && item.percentage > 0

        return (
          <div key={item.id} className="flex flex-col items-center gap-1.5">
            <button
              className={clsx(
                'relative overflow-hidden border text-xs font-bold transition-all duration-300 outline-none',
                isCircle
                  ? 'flex h-10 w-10 items-center justify-center rounded-full'
                  : 'flex h-9 items-center justify-center rounded-md px-3.5',
                mode === 'info'
                  ? 'cursor-default'
                  : 'focus-visible:outline-accessibility cursor-pointer outline-none focus-visible:outline-1 focus-visible:-outline-offset-1',
                isSelected || mode === 'info'
                  ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/30 text-white shadow-xs'
                  : 'bg-surface border-input-outline text-secondary hover:bg-hover-overlay/80 hover:text-primary hover:border-primary/30',
                itemClassName,
              )}
              disabled={mode === 'info'}
              type="button"
              onClick={() => handleItemClick(item.id)}
            >
              {hasPercentage && (
                <div
                  className="bg-linear-to-t from-blue-600 to-indigo-500 absolute bottom-0 left-0 w-full transition-all duration-500"
                  style={{ height: `${item.percentage}%` }}
                />
              )}
              <span className="relative z-1 font-mono text-xs font-bold text-white drop-shadow-xs">
                {item.value !== undefined ? item.value : item.label}
              </span>
            </button>

            {item.subtitle && (
              <span
                className={clsx(
                  'text-center text-[10px] font-semibold sm:text-xs',
                  mode === 'info' ? 'text-secondary' : 'text-secondary/50',
                )}
              >
                {item.subtitle}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

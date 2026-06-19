'use client'

import clsx from 'clsx'
import React, { useEffect, useState } from 'react'

export interface ToggleSwitchProps {
  optionA: {
    label: string
    icon: React.ReactNode
    value: string
  }
  optionB: {
    label: string
    icon: React.ReactNode
    value: string
  }
  activeValue: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
  isSidebar?: boolean
}

export function ToggleSwitch({
  optionA,
  optionB,
  activeValue,
  onChange,
  disabled = false,
  ariaLabel,
  className,
  isSidebar = false,
}: ToggleSwitchProps) {
  const [mounted, setMounted] = useState(false)

  // Prevenir hydration mismatches
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render de carga consistente con las dimensiones finales
    return (
      <div className={clsx('bg-hover-overlay flex h-10 w-full animate-pulse rounded', className)} />
    )
  }

  const isActiveA = activeValue === optionA.value
  const isActiveB = activeValue === optionB.value

  const handleToggle = () => {
    if (disabled) return
    const nextValue = isActiveA ? optionB.value : optionA.value

    onChange(nextValue)
  }

  return (
    <button
      aria-label={ariaLabel}
      className={clsx(
        'group cursor-pointer transition-all duration-300 ease-in-out outline-none select-none',
        isSidebar ? 'focus-sidebar-content px-3 py-2' : 'focus-link-hover toolbar-icon',
        disabled && 'pointer-events-none cursor-not-allowed opacity-40',
        className,
      )}
      disabled={disabled}
      type="button"
      onClick={handleToggle}
    >
      <div className="flex items-center">
        {/* Renderiza el ícono correspondiente al estado activo */}
        <span className="text-primary flex h-5 w-5 items-center justify-center transition-transform duration-200">
          {isActiveA ? optionA.icon : optionB.icon}
        </span>

        {/* Muestra la etiqueta opcional si está presente en la opción */}
        {((isActiveA && optionA.label) || (isActiveB && optionB.label)) && (
          <span className="text-primary ml-2 font-semibold">
            {isActiveA ? optionA.label : optionB.label}
          </span>
        )}
      </div>
    </button>
  )
}

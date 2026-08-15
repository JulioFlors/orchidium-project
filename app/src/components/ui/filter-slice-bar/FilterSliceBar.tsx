'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IoCalendarOutline, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'
import clsx from 'clsx'

export type FilterSliceRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

const ROUNDED_MAP: Record<
  FilterSliceRounded,
  {
    container: string
    inner: string
    leftOverlay: string
    rightOverlay: string
  }
> = {
  none: {
    container: 'rounded-none',
    inner: 'rounded-none',
    leftOverlay: 'rounded-none',
    rightOverlay: 'rounded-none',
  },
  sm: {
    container: 'rounded-sm',
    inner: 'rounded-xs',
    leftOverlay: 'rounded-l-sm',
    rightOverlay: 'rounded-r-sm',
  },
  md: {
    container: 'rounded-md',
    inner: 'rounded-sm',
    leftOverlay: 'rounded-l-md',
    rightOverlay: 'rounded-r-md',
  },
  lg: {
    container: 'rounded-lg',
    inner: 'rounded-md',
    leftOverlay: 'rounded-l-lg',
    rightOverlay: 'rounded-r-lg',
  },
  xl: {
    container: 'rounded-xl',
    inner: 'rounded-lg',
    leftOverlay: 'rounded-l-xl',
    rightOverlay: 'rounded-r-xl',
  },
  '2xl': {
    container: 'rounded-2xl',
    inner: 'rounded-xl',
    leftOverlay: 'rounded-l-2xl',
    rightOverlay: 'rounded-r-2xl',
  },
  full: {
    container: 'rounded-full',
    inner: 'rounded-full',
    leftOverlay: 'rounded-l-full',
    rightOverlay: 'rounded-r-full',
  },
}

export interface FilterSliceOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface FilterSliceGroup {
  id: string
  options: FilterSliceOption[]
  value?: string
  onChange: (value: string) => void
  ariaLabel?: string
}

export interface FilterSliceDatePicker {
  value?: string
  onChange: (date?: string) => void
  minDate?: string
  maxDate?: string
  placeholder?: string
  ariaLabel?: string
  customColor?: string
}

export interface FilterSliceBarProps {
  groups?: FilterSliceGroup[]
  datePicker?: FilterSliceDatePicker
  activeVariant?: 'gradient' | 'surface' | 'glow'
  customColor?: string
  rounded?: FilterSliceRounded
  className?: string
  ariaLabel?: string
}

export function FilterSliceBar({
  groups = [],
  datePicker,
  activeVariant = 'glow',
  customColor,
  rounded = 'lg',
  className,
  ariaLabel = 'Barra de filtros de navegación',
}: FilterSliceBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const radius = ROUNDED_MAP[rounded] || ROUNDED_MAP.lg

  // Verificar la capacidad de scroll horizontal en la tira
  const checkScroll = useCallback(() => {
    const el = scrollRef.current

    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el

    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current

    if (!el) return

    checkScroll()

    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)

    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  // Drag-to-scroll con mouse: implementado con listeners nativos (fuera del ciclo JSX)
  // para evitar la restricción del React Compiler sobre mutaciones de DOM en eventos React.
  useEffect(() => {
    const el = scrollRef.current

    if (!el) return

    let dragging = false
    let startX = 0
    let startScrollLeft = 0

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return

      dragging = true
      startX = e.clientX
      startScrollLeft = el.scrollLeft
      el.setPointerCapture(e.pointerId)
      el.classList.add('cursor-grabbing', 'select-none')
      el.classList.remove('cursor-grab')
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return

      const delta = e.clientX - startX

      el.scrollLeft = startScrollLeft - delta
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return

      dragging = false
      el.releasePointerCapture(e.pointerId)
      el.classList.remove('cursor-grabbing', 'select-none')
      el.classList.add('cursor-grab')
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // Navegación accesible mediante teclado (Flechas Izquierda / Derecha, Inicio, Fin)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return

    const container = scrollRef.current

    if (!container) return

    const focusableItems = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    )
    const currentIndex = focusableItems.indexOf(document.activeElement as HTMLButtonElement)

    if (currentIndex === -1) return

    e.preventDefault()

    let nextIndex = currentIndex

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % focusableItems.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + focusableItems.length) % focusableItems.length
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = focusableItems.length - 1
    }

    const nextButton = focusableItems[nextIndex]

    if (nextButton) {
      nextButton.focus()
      nextButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }

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

  const buttonBaseFocusClasses =
    'focus-visible:outline-accessibility focus-visible:outline-solid focus-visible:outline-1 focus-visible:-outline-offset-1 focus:outline-none'

  const isDateSelected = Boolean(datePicker?.value && /^\d{4}-\d{2}-\d{2}$/.test(datePicker.value))
  const resolvedColor = customColor || datePicker?.customColor

  const getActiveClass = (isActive: boolean) => {
    if (!isActive) {
      return 'bg-hover-overlay/40 text-secondary hover:bg-hover-overlay hover:text-primary border border-transparent'
    }

    if (activeVariant === 'surface') {
      return 'bg-surface text-primary border-input-outline border shadow-xs'
    }

    if (activeVariant === 'glow' && resolvedColor) {
      return 'shadow-xs border text-secondary'
    }

    // Default Dosing style (gradient)
    return 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/30 border text-white shadow-xs'
  }

  const getActiveInlineStyle = (isActive: boolean): React.CSSProperties | undefined => {
    if (!isActive || !resolvedColor) return undefined

    if (activeVariant === 'surface') {
      return { color: resolvedColor }
    }

    if (activeVariant === 'glow') {
      return {
        backgroundColor: `color-mix(in srgb, ${resolvedColor} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${resolvedColor} 45%, transparent)`,
      }
    }

    return undefined
  }

  return (
    <div
      aria-label={ariaLabel}
      className={clsx(
        'bg-surface border-input-outline relative flex w-full items-center border p-1 select-none isolate',
        radius.container,
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Botón Flotante Izquierdo */}
      {canScrollLeft && (
        <div
          className={clsx(
            'bg-linear-to-r from-surface via-surface/90 to-transparent absolute left-0 z-20 flex h-full items-center pr-4 pl-0.5 pointer-events-none',
            radius.leftOverlay,
          )}
        >
          <button
            aria-label="Desplazar a la izquierda"
            className="bg-surface border-input-outline hover:bg-hover-overlay text-primary pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full border shadow-xs focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => scrollByAmount(-200)}
          >
            <IoChevronBackOutline className="size-3.5" />
          </button>
        </div>
      )}

      {/* Contenedor Horizontal Continuo en 1 sola Fila */}
      <div
        ref={scrollRef}
        className="no-scrollbar cursor-grab flex w-full items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 whitespace-nowrap"
      >
        {groups.map((group) => (
          <React.Fragment key={group.id}>
            {group.options.map((opt) => {
              const isActive = group.value === opt.id && !isDateSelected

              return (
                <button
                  key={opt.id}
                  className={clsx(
                    'flex-1 shrink-0 cursor-pointer px-3 py-1.5 text-center text-xs font-semibold outline-none tds-sm:flex-none transition-colors',
                    radius.inner,
                    buttonBaseFocusClasses,
                    getActiveClass(isActive),
                  )}
                  style={getActiveInlineStyle(isActive)}
                  type="button"
                  onClick={() => {
                    group.onChange(opt.id)
                    if (datePicker?.value) {
                      datePicker.onChange(undefined)
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'nearest',
                    })
                  }}
                >
                  {opt.icon && <span className="mr-1 inline-block">{opt.icon}</span>}
                  {opt.label}
                </button>
              )
            })}
          </React.Fragment>
        ))}

        {/* Píldora de Selector de Fecha Personalizada - Port exacto de Dosing */}
        {datePicker && (
          <div className="relative flex-1 shrink-0 tds-sm:flex-none">
            <input
              ref={dateInputRef}
              aria-label={datePicker.ariaLabel || 'Selector de fecha personalizada'}
              className="pointer-events-none absolute inset-0 size-full opacity-0"
              max={datePicker.maxDate}
              min={datePicker.minDate || '2026-05-25'}
              tabIndex={-1}
              type="date"
              value={datePicker.value || ''}
              onChange={(e) => {
                const val = e.target.value

                if (val) {
                  datePicker.onChange(val)
                }
              }}
            />
            <button
              className={clsx(
                'flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold outline-none tds-sm:w-auto transition-colors',
                radius.inner,
                buttonBaseFocusClasses,
                getActiveClass(isDateSelected),
              )}
              style={getActiveInlineStyle(isDateSelected)}
              type="button"
              onClick={handleCustomDateClick}
              onFocus={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
            >
              <IoCalendarOutline
                className={clsx(
                  'size-3.5',
                  !resolvedColor && isDateSelected && activeVariant === 'gradient'
                    ? 'text-white'
                    : 'text-action',
                )}
                style={resolvedColor ? { color: resolvedColor } : undefined}
              />
              <span className="font-mono">
                {isDateSelected && datePicker.value
                  ? formatCustomDateLabel(datePicker.value)
                  : datePicker.placeholder || 'Fecha'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Botón Flotante Derecho */}
      {canScrollRight && (
        <div
          className={clsx(
            'bg-linear-to-l from-surface via-surface/90 to-transparent absolute right-0 z-20 flex h-full items-center pr-0.5 pl-4 pointer-events-none',
            radius.rightOverlay,
          )}
        >
          <button
            aria-label="Desplazar a la derecha"
            className="bg-surface border-input-outline hover:bg-hover-overlay text-primary pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full border shadow-xs focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => scrollByAmount(200)}
          >
            <IoChevronForwardOutline className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

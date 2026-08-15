'use client'

import type { TimeFilterPreset, StatusFilterPreset } from './DosingFiltersBar'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IoCalendarOutline, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'
import clsx from 'clsx'

interface FilterSliceBarProps {
  timePreset: TimeFilterPreset
  onTimePresetChange: (preset: TimeFilterPreset) => void
  statusPreset: StatusFilterPreset
  onStatusPresetChange: (preset: StatusFilterPreset) => void
  selectedDate?: string
  onSelectedDateChange?: (date?: string) => void
}

export function FilterSliceBar({
  timePreset,
  onTimePresetChange,
  statusPreset,
  onStatusPresetChange,
  selectedDate,
  onSelectedDateChange,
}: FilterSliceBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

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

  // Secuencia estricta de filtros por Tiempo
  const timeOptions: { id: TimeFilterPreset; label: string }[] = [
    { id: 'all', label: 'Todos los Tiempos' },
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'next-week', label: 'Prox. Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'next-month', label: 'Prox. Mes' },
  ]

  // Secuencia estricta de filtros por Estado
  const statusOptions: { id: StatusFilterPreset; label: string }[] = [
    { id: 'all', label: 'Todos los Estados' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'COMPLETED', label: 'Completados' },
    { id: 'CANCELLED', label: 'Cancelados' },
  ]

  const buttonBaseFocusClasses =
    'focus-visible:outline-accessibility focus-visible:outline-solid focus-visible:outline-1 focus-visible:-outline-offset-1 focus:outline-none'

  return (
    <div
      aria-label="Barra de filtros de dosificación"
      className="relative flex w-full items-center select-none isolate"
      onKeyDown={handleKeyDown}
    >
      {/* Botón Flotante Izquierdo */}
      {canScrollLeft && (
        <div className="bg-linear-to-r from-surface via-surface/90 to-transparent absolute left-0 z-20 flex h-full items-center pr-4 pl-0.5 pointer-events-none">
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
        {/* 1 a 6: Grupo de Filtros por Tiempo */}
        {timeOptions.map((opt) => {
          const isActive = timePreset === opt.id && !selectedDate

          return (
            <button
              key={opt.id}
              className={clsx(
                'shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-center text-xs font-semibold outline-none tds-lg:flex-1 tds-lg:shrink',
                buttonBaseFocusClasses,
                isActive
                  ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/30 border text-white shadow-xs'
                  : 'bg-hover-overlay/40 text-secondary hover:bg-hover-overlay hover:text-primary border border-transparent',
              )}
              type="button"
              onClick={() => {
                onTimePresetChange(opt.id)
                if (onSelectedDateChange) onSelectedDateChange(undefined)
              }}
              onFocus={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
            >
              {opt.label}
            </button>
          )
        })}

        {/* 7: Píldora de Selector de Fecha Personalizada */}
        <div className="relative shrink-0 tds-lg:flex-1 tds-lg:shrink">
          <input
            ref={dateInputRef}
            className="pointer-events-none absolute inset-0 size-full opacity-0"
            tabIndex={-1}
            type="date"
            value={selectedDate || ''}
            onChange={(e) => {
              if (e.target.value && onSelectedDateChange) {
                onTimePresetChange('all')
                onSelectedDateChange(e.target.value)
              }
            }}
          />
          <button
            className={clsx(
              'flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold outline-none tds-lg:shrink',
              buttonBaseFocusClasses,
              selectedDate
                ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/30 border text-white shadow-xs'
                : 'bg-hover-overlay/40 text-secondary hover:bg-hover-overlay hover:text-primary border border-transparent',
            )}
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
              className={clsx('size-3.5', selectedDate ? 'text-white' : 'text-action')}
            />
            <span className="font-mono">
              {selectedDate ? formatCustomDateLabel(selectedDate) : 'Fecha'}
            </span>
          </button>
        </div>

        {/* 8 a 11: Grupo de Filtros por Estado */}
        {statusOptions.map((opt) => {
          const isActive = statusPreset === opt.id

          return (
            <button
              key={opt.id}
              className={clsx(
                'shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-center text-xs font-semibold outline-none tds-lg:flex-1 tds-lg:shrink',
                buttonBaseFocusClasses,
                isActive
                  ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/30 border text-white shadow-xs'
                  : 'bg-hover-overlay/40 text-secondary hover:bg-hover-overlay hover:text-primary border border-transparent',
              )}
              type="button"
              onClick={() => onStatusPresetChange(opt.id)}
              onFocus={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Botón Flotante Derecho */}
      {canScrollRight && (
        <div className="bg-linear-to-l from-surface via-surface/90 to-transparent absolute right-0 z-20 flex h-full items-center pr-0.5 pl-4 pointer-events-none">
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'
import { clsx } from 'clsx'
import { AnimatePresence, motion, Variants } from 'motion/react'
import { ZoneType } from '@package/database/enums'

import { ZoneTypeLabels } from '@/config/mappings'

interface DeviceStatusProps {
  /** Título interno del dropdown */
  dropdownTitle?: string
  /** Mapeo de nombres personalizados para zonas */
  zoneMapping?: Record<string, string>
  /** Zona actualmente seleccionada */
  selectedZone: string
  /** Lista de llaves de zonas disponibles */
  zones: string[]
  /** Callback al cambiar de zona */
  onZoneChanged?: (newZone: string) => void
  /** Estado de conexión del dispositivo */
  connectionState?: 'online' | 'offline' | 'unknown' | 'zombie'
  /** Indica si se está consultando el estado actualmente */
  isLoadingStatus?: boolean
  /** Clases adicionales para el contenedor */
  className?: string
}

/**
 * DeviceStatus - Widget de monitoreo y selección de zona (Dynamic Island style).
 * Extraído de la lógica original de DeviceViewHeader para ser inyectado en un Heading.
 */
export function DeviceStatus({
  dropdownTitle,
  zoneMapping,
  selectedZone,
  zones,
  onZoneChanged,
  connectionState = 'unknown',
  isLoadingStatus = false,
  className,
}: DeviceStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const getDisplayName = (zoneKey: string) => {
    if (zoneMapping && zoneMapping[zoneKey]) return zoneMapping[zoneKey]

    return ZoneTypeLabels[zoneKey as ZoneType] || zoneKey.replace('_', ' ')
  }

  // Manejo de clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Navegación por teclado
  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isOpen && zones.length > 1) {
      if (event.key === 'Tab') {
        event.preventDefault()
        if (event.shiftKey) {
          ;(resultsRef.current?.lastElementChild as HTMLElement)?.focus()
        } else {
          ;(resultsRef.current?.firstElementChild as HTMLElement)?.focus()
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        ;(resultsRef.current?.firstElementChild as HTMLElement)?.focus()
      } else if (event.key === 'Escape') {
        setIsOpen(false)
      }
    } else if (event.key === 'ArrowDown' && zones.length > 1) {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const handleResultKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, zone: string) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = event.currentTarget.nextElementSibling as HTMLElement

      if (next) next.focus()
      else (resultsRef.current?.firstElementChild as HTMLElement)?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = event.currentTarget.previousElementSibling as HTMLElement

      if (prev) prev.focus()
      else (resultsRef.current?.lastElementChild as HTMLElement)?.focus()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const next = (
        event.shiftKey
          ? event.currentTarget.previousElementSibling
          : event.currentTarget.nextElementSibling
      ) as HTMLElement

      if (next && next.tagName === 'LI') next.focus()
      else {
        if (event.shiftKey) {
          buttonRef.current?.focus()
        } else {
          ;(resultsRef.current?.firstElementChild as HTMLElement)?.focus()
        }
      }
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onZoneChanged?.(zone)
      setIsOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  const statusConfig = (() => {
    if (isLoadingStatus || connectionState === 'unknown') {
      return {
        label: 'Conectando',
        dot: 'bg-zinc-400',
        gradientBorder: 'via-zinc-500/10 to-zinc-500/30',
        glow: 'bg-zinc-500/5 group-hover:bg-zinc-500/10',
        pipe: 'bg-input-outline',
        text: 'text-zinc-300',
      }
    }
    switch (connectionState) {
      case 'online':
        return {
          label: 'Online',
          dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
          gradientBorder: 'via-green-500/10 to-green-500/50',
          glow: 'bg-green-500/5 group-hover:bg-green-500/20',
          pipe: 'bg-green-500/30',
          text: 'text-green-500',
        }
      case 'zombie':
        return {
          label: 'Offline',
          dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
          gradientBorder: 'via-yellow-500/10 to-yellow-500/50',
          glow: 'bg-yellow-500/5 group-hover:bg-yellow-500/20',
          pipe: 'bg-yellow-500/30',
          text: 'text-yellow-500',
        }
      case 'offline':
        return {
          label: 'Offline',
          dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
          gradientBorder: 'via-red-500/10 to-red-500/50',
          glow: 'bg-red-500/5 group-hover:bg-red-500/20',
          pipe: 'bg-red-500/30',
          text: 'text-red-500',
        }
      default:
        return {
          label: 'Conectando',
          dot: 'bg-zinc-400',
          gradientBorder: 'via-zinc-500/10 to-zinc-500/30',
          glow: 'bg-zinc-500/5 group-hover:bg-zinc-500/10',
          pipe: 'bg-input-outline',
          text: 'text-zinc-300',
        }
    }
  })()

  const menuVariants: Variants = {
    initial: { opacity: 0, scale: 0.8, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
  }

  return (
    <div ref={dropdownRef} className={clsx('relative w-full p-0.5 sm:w-64', className)}>
      <div className="group relative w-full rounded-md p-px shadow-sm transition-all duration-300 hover:shadow-md">
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 overflow-hidden rounded-md bg-linear-to-tr from-transparent',
            statusConfig.gradientBorder,
          )}
        />
        <button
          ref={buttonRef}
          aria-expanded={zones.length > 1 ? isOpen : undefined}
          aria-haspopup={zones.length > 1 ? 'listbox' : undefined}
          className={clsx(
            'bg-surface relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[5px] px-3 py-3 font-medium transition-all sm:py-4',
            zones.length > 1 ? 'cursor-pointer focus:ring-1 focus:outline-none' : '',
            statusConfig.text,
          )}
          tabIndex={zones.length > 1 ? 0 : -1}
          type="button"
          onClick={() => {
            if (zones.length > 1) setIsOpen(!isOpen)
          }}
          onKeyDown={handleButtonKeyDown}
        >
          <div
            className={clsx(
              'pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:blur-3xl',
              statusConfig.glow,
            )}
          />
          <span className="text-primary relative z-5 flex-1 truncate text-center font-semibold">
            {getDisplayName(selectedZone)}
          </span>
          <div
            className={clsx('relative z-5 h-4 w-px flex-none transition-colors', statusConfig.pipe)}
          />
          <div className="relative z-5 flex flex-1 items-center justify-center gap-3">
            <span className="text-[11px] font-bold tracking-wider uppercase opacity-80 group-hover:opacity-100">
              {statusConfig.label}
            </span>
            <span
              className={clsx(
                'aspect-square h-2 w-2 flex-none animate-pulse rounded-full transition-colors',
                statusConfig.dot,
              )}
            />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && zones.length > 1 && (
          <motion.div
            animate="animate"
            className="border-input-outline bg-surface absolute top-[calc(100%+4px)] left-0 z-5 w-full origin-top overflow-hidden rounded-md border py-1 shadow-lg"
            exit="exit"
            initial="initial"
            variants={menuVariants}
          >
            {dropdownTitle && (
              <div className="border-input-outline text-secondary border-b px-3 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">
                {dropdownTitle}
              </div>
            )}
            <ul
              ref={resultsRef}
              className="text-black-and-white flex flex-col pt-1 pb-1"
              role="listbox"
              tabIndex={-1}
            >
              {zones.map((zone, index) => {
                const isSelected = selectedZone === zone

                return (
                  <li
                    key={zone}
                    aria-selected={isSelected}
                    className={clsx(
                      'flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-all select-none',
                      'hover:bg-black/5 dark:hover:bg-white/5',
                      index > 0 && 'border-input-outline/50 border-t',
                      isSelected ? 'text-primary font-medium' : 'text-secondary font-regular',
                    )}
                    role="option"
                    tabIndex={0}
                    onClick={() => {
                      onZoneChanged?.(zone)
                      setIsOpen(false)
                      buttonRef.current?.focus()
                    }}
                    onKeyDown={(e) => handleResultKeyDown(e, zone)}
                  >
                    <span>{getDisplayName(zone)}</span>
                    {isSelected && (
                      <motion.div className="text-black-and-white" layoutId="active-check">
                        <IoCheckmarkCircleOutline className="h-5 w-5" />
                      </motion.div>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

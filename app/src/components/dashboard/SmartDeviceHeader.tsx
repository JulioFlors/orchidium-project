'use client'

import { useState, useEffect, useRef } from 'react'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'
import { clsx } from 'clsx'
import { AnimatePresence, motion, Variants } from 'motion/react'

interface SmartHeaderProps {
  deviceName?: string
  deviceDescription?: string
  dropdownTitle?: string
  gridClassName?: string
  titleClassName?: string
  zoneMapping?: Record<string, string>
  selectedZone: string
  zones: string[]
  onZoneChanged?: (newZone: string) => void
  connectionState?: 'online' | 'offline' | 'unknown' | 'zombie'
  isLoadingStatus?: boolean
}

const ZONE_MAPPING: Record<string, string> = {
  ZONA_A: 'Orquideario',
  EXTERIOR: 'Exterior',
}

export function SmartDeviceHeader({
  deviceName,
  deviceDescription,
  dropdownTitle,
  gridClassName = 'grid-cols-1 gap-5 tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:gap-6',
  titleClassName = 'col-span-1 tds-sm:col-span-2',
  zoneMapping,
  selectedZone,
  zones,
  onZoneChanged,
  connectionState = 'unknown',
  isLoadingStatus = false,
}: SmartHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const getDisplayName = (zoneKey: string) => {
    // Si pasaron un diccionario por props y la llave existe ahí, la tomamos (Prioridad 1)
    if (zoneMapping && zoneMapping[zoneKey]) return zoneMapping[zoneKey]

    // Sino, usamos el mapeo de default de este componente (Prioridad 2) o el string raw
    return ZONE_MAPPING[zoneKey] || zoneKey.replace('_', ' ')
  }

  // Manejo de clic afuera para cerrar el menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Navegación por teclado (Copidado del SearchBox + Focus Trap)
  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isOpen && zones.length > 1) {
      if (event.key === 'Tab') {
        event.preventDefault()
        if (event.shiftKey) {
          const lastOption = resultsRef.current?.lastElementChild as HTMLElement

          if (lastOption) lastOption.focus()
        } else {
          const firstOption = resultsRef.current?.firstElementChild as HTMLElement

          if (firstOption) firstOption.focus()
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        const firstOption = resultsRef.current?.firstElementChild as HTMLElement

        if (firstOption) firstOption.focus()
      } else if (event.key === 'Escape') {
        setIsOpen(false)
      }
    } else {
      if (event.key === 'ArrowDown' && zones.length > 1) {
        event.preventDefault()
        setIsOpen(true)
      }
    }
  }

  const handleResultKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, zone: string) => {
    // ---- Navegación Vertical ----
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextSibling = event.currentTarget.nextElementSibling as HTMLElement

      if (nextSibling) nextSibling.focus()
      else {
        // Enfoque Cíclico hacia arriba
        const firstSibling = resultsRef.current?.firstElementChild as HTMLElement

        if (firstSibling) firstSibling.focus()
      }
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prevSibling = event.currentTarget.previousElementSibling as HTMLElement

      if (prevSibling) {
        prevSibling.focus()
      } else {
        // Enfoque Cíclico hacia abajo
        const lastSibling = resultsRef.current?.lastElementChild as HTMLElement

        if (lastSibling) lastSibling.focus()
        else buttonRef.current?.focus()
      }
    }

    // ---- Control de Focus Trap con Tab ----
    if (event.key === 'Tab') {
      event.preventDefault() // Prevenir escape del Focus Trap
      const targetElementClass = event.shiftKey ? 'previousElementSibling' : 'nextElementSibling'
      const sibling = event.currentTarget[targetElementClass] as HTMLElement

      if (sibling && sibling.tagName === 'LI') {
        sibling.focus()
      } else {
        // Retornar al botón o ciclar
        if (event.shiftKey) {
          buttonRef.current?.focus()
        } else {
          const firstSibling = resultsRef.current?.firstElementChild as HTMLElement

          if (firstSibling) firstSibling.focus()
        }
      }
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onZoneChanged?.(zone)
      setIsOpen(false)
      buttonRef.current?.focus()
    }
    if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  // Configuración de estilos visuales según el estado
  const statusConfig = (() => {
    // Si la conexión no ha respondido de vuelta o si estamos cargando activamente
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
          label: 'Offline', // A nivel de UI siempre es OFFLINE
          dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]', // En Zombie pinta amarillo
          gradientBorder: 'via-yellow-500/10 to-yellow-500/50',
          glow: 'bg-yellow-500/5 group-hover:bg-yellow-500/20',
          pipe: 'bg-yellow-500/30',
          text: 'text-yellow-500',
        }
      case 'offline':
        return {
          label: 'Offline',
          dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]', // En Muerto pinta rojo
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

  // Animaciones estilo SearchBox
  const menuVariants: Variants = {
    initial: { opacity: 0, scale: 0.8, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
  }

  return (
    <div className={clsx('grid w-full items-end pt-9 pb-2', gridClassName)}>
      {/* Título de la Vista */}
      <div className={titleClassName}>
        <h1 className="text-primary text-2xl leading-10.5 font-bold tracking-tight antialiased">
          {deviceName}
        </h1>
        {deviceDescription && <p className="text-secondary mt-1 text-sm">{deviceDescription}</p>}
      </div>

      {/* Componente Unificado: Selector + Estado (Tipo Dynamic Island) */}
      <div ref={dropdownRef} className="relative col-span-1 w-full p-0.5">
        {/* Envoltorio para Radius, Overflow (Escondiendo el blur+gradient) y el P-px para bordes */}
        <div className="group relative w-full rounded-md p-px shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Border Gradient Line Dinámico */}
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
              'bg-surface relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[5px] px-3 py-4 font-medium transition-all',
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
            {/* Spotlight Luminoso del Estado (dinamico) */}
            <div
              className={clsx(
                'pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:blur-3xl',
                statusConfig.glow,
              )}
            />

            {/* Todo el contenido interno necesita relative z-5 para posicionarse encima de los resplandores */}
            {/* Nombre (Centrado en todos los tamaños) */}
            <span className="text-primary relative z-5 w-auto flex-1 truncate text-center font-semibold">
              {getDisplayName(selectedZone)}
            </span>

            {/* Separador visual con color dinámico (Visible en todos los tamaños) */}
            <div
              className={clsx(
                'relative z-5 mx-auto h-4 w-px flex-none transition-colors',
                statusConfig.pipe,
              )}
            />

            {/* Etiqueta de texto de estado y pulso (Centrado en todos los tamaños) */}
            <div className="relative z-5 flex w-auto flex-1 items-center justify-center gap-3">
              <span className="text-[11px] leading-3 font-bold tracking-wider uppercase opacity-80 transition-opacity group-hover:opacity-100">
                {statusConfig.label}
              </span>
              {/* Animación de latido permanente indicando modo escucha activa */}
              <span
                className={clsx(
                  'aspect-square h-2 w-2 flex-none animate-pulse rounded-full transition-colors',
                  statusConfig.dot,
                )}
              />
            </div>
          </button>
        </div>

        {/* Menú Desplegable con estilos idénticos al SearchBox */}
        <AnimatePresence>
          {isOpen && zones.length > 1 && (
            <motion.div
              animate="animate"
              className={clsx(
                'border-input-outline bg-surface absolute top-[calc(100%+4px)] left-0 z-5 w-full origin-top overflow-hidden rounded-md border py-1 shadow-lg',
              )}
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
                key="zone-dropdown"
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
    </div>
  )
}

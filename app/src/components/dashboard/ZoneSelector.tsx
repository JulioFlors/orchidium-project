'use client'

import { useState, useEffect, useRef } from 'react'
import { IoChevronDownSharp, IoCheckmarkCircleOutline } from 'react-icons/io5'
import { clsx } from 'clsx'
import { AnimatePresence, motion, Variants } from 'motion/react'

interface Props {
  selectedZone: string
  zones: string[]
  onZoneChanged: (newZone: string) => void
}

export function ZoneSelector({ selectedZone, zones, onZoneChanged }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const ZONE_MAPPING: Record<string, string> = {
    ZONA_A: 'Orquideario',
    EXTERIOR: 'Exterior',
  }

  const getDisplayName = (zoneKey: string) => {
    return ZONE_MAPPING[zoneKey] || zoneKey.replace('_', ' ')
  }

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelection = (zone: string) => {
    onZoneChanged(zone)
    setIsOpen(false)
  }

  const dropdownPanelVariants: Variants = {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.15, ease: 'easeIn' },
    },
  }

  return (
    <div className="flex items-center select-none">
      <div ref={dropdownRef} className="relative">
        <motion.button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={clsx(
            'bg-surface border-input-outline focus:ring-primary/20 hover:bg-hover-overlay flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus:ring-2 focus:outline-none',
          )}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-primary">{getDisplayName(selectedZone)}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <IoChevronDownSharp className="text-secondary h-4 w-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              key="zone-dropdown-panel"
              animate="animate"
              className="bg-surface border-input-outline absolute top-full right-0 z-10 mt-1 w-40 overflow-hidden rounded-md border shadow-lg"
              exit="exit"
              initial="initial"
              role="listbox"
              variants={dropdownPanelVariants}
            >
              {zones.map((zone) => (
                <li
                  key={zone}
                  aria-selected={selectedZone === zone}
                  className={clsx(
                    'hover:bg-hover-overlay flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-colors',
                    selectedZone === zone ? 'text-primary font-medium' : 'text-secondary',
                  )}
                  role="option"
                  onClick={() => handleSelection(zone)}
                >
                  <span>{getDisplayName(zone)}</span>
                  {selectedZone === zone && (
                    <IoCheckmarkCircleOutline className="text-primary h-4 w-4" />
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

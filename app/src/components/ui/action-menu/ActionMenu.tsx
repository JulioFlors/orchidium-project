'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { IoEllipsisHorizontal, IoEllipsisVertical } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ActionMenuItem {
  label: string
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  variant?: 'default' | 'danger'
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  className?: string
  triggerClassName?: string
  /**
   * Determina si el menú solo es visible cuando el padre tiene el estado hover.
   * Requiere que el padre tenga la clase 'group'.
   */
  hoverOnly?: boolean
}

export function ActionMenu({
  items,
  className,
  triggerClassName,
  hoverOnly = true,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'Escape') {
      handleClose()

      return
    }

    const itemElements = menuRef.current?.querySelectorAll(
      '[role="menuitem"]',
    ) as NodeListOf<HTMLElement>

    if (!itemElements || itemElements.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (focusedIndex + 1) % itemElements.length

      setFocusedIndex(nextIndex)
      itemElements[nextIndex].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (focusedIndex - 1 + itemElements.length) % itemElements.length

      setFocusedIndex(prevIndex)
      itemElements[prevIndex].focus()
    } else if (e.key === 'Tab') {
      handleClose()
    }
  }

  return (
    <div ref={menuRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Opciones"
        className={cn(
          'focus-visible:ring-black-and-white flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none active:scale-95',
          'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/10',
          hoverOnly &&
            (isOpen
              ? 'opacity-100'
              : 'md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100'),
          isOpen && 'bg-black/5 opacity-100 dark:bg-white/10',
          triggerClassName,
        )}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        {/* Mobile: Vertical Dots (Always reachable but user says vertical) */}
        <IoEllipsisVertical className="h-4 w-4 md:hidden" />
        {/* Desktop: Horizontal Dots */}
        <IoEllipsisHorizontal className="hidden h-4 w-4 md:block" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="border-input-outline bg-surface absolute right-0 z-50 mt-1 w-max min-w-40 origin-top-right overflow-hidden rounded-xl border py-1.5 shadow-xl"
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            role="menu"
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                className={cn(
                  'flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm whitespace-nowrap transition-colors outline-none',
                  'hover:bg-hover-overlay focus:bg-hover-overlay',
                  item.variant === 'danger' ? 'text-red-500' : 'text-primary',
                )}
                role="menuitem"
                tabIndex={0}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick(e)
                  handleClose()
                }}
              >
                <span
                  className={cn(
                    'mr-2.5 h-4 w-4 shrink-0',
                    item.variant === 'danger' ? 'text-red-500' : 'text-secondary',
                  )}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

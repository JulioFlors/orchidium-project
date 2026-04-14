'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { IoEllipsisHorizontal, IoCloseOutline } from 'react-icons/io5'

interface TaskOptionsMenuProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
  onClose: () => void
  onCancel: () => void
}

export function TaskOptionsMenu({ isOpen, onToggle, onClose, onCancel }: TaskOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleClose = useCallback(() => {
    setFocusedIndex(-1)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) handleClose()
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      setFocusedIndex(-1)
    }
  }, [isOpen, handleClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'Escape') {
      handleClose()

      return
    }

    const items = menuRef.current?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>

    if (!items || items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (focusedIndex + 1) % items.length

      setFocusedIndex(nextIndex)
      items[nextIndex].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (focusedIndex - 1 + items.length) % items.length

      setFocusedIndex(prevIndex)
      items[prevIndex].focus()
    } else if (e.key === 'Tab') {
      handleClose()
    }
  }

  return (
    <div ref={menuRef} className="relative h-8 w-8" onKeyDown={handleKeyDown}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Opciones de tarea"
        className="focus-visible:ring-accessibility text-secondary hover:text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-white/10"
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle(!isOpen)
        }}
      >
        <IoEllipsisHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className="border-input-outline bg-surface absolute top-full right-0 z-10 mt-1 w-44 rounded-lg border py-1 shadow-lg"
          role="menu"
        >
          <button
            className="search-results focus-bg-surface flex w-[calc(100%-0.5rem)] cursor-pointer items-center outline-none"
            role="menuitem"
            tabIndex={0}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
              onCancel()
            }}
          >
            <IoCloseOutline className="mr-2 h-5 w-5 shrink-0 text-red-500" />
            <span className="text-primary font-medium">Cancelar tarea</span>
          </button>
        </div>
      )}
    </div>
  )
}

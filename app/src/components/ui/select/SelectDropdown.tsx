'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IoChevronDown } from 'react-icons/io5'
import clsx from 'clsx'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface SelectDropdownProps {
  id?: string
  options: SelectOption[]
  value: string | number | undefined
  onChange: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  menuClassName?: string
}

const motionProps = {
  initial: { opacity: 0, scale: 0.95, y: -5 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.95, y: -5, transition: { duration: 0.1, ease: 'easeIn' as const } },
}

/**
 * Dropdown reutilizable basado en Radix/CommandIsland concepts pero puramente Vanilla React.
 * Aporta navegación por teclado (ArrowUp/Down, Enter, Esc), trampa de foco y
 * animaciones motion integradas.
 */
export function SelectDropdown({
  id,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  className,
  buttonClassName,
  menuClassName,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // ----------- Handlers principales -----------
  const handleToggle = () => {
    if (disabled) return
    setIsOpen((prev) => !prev)
  }

  const handleSelect = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return
      onChange(option.value)
      setIsOpen(false)
      buttonRef.current?.focus()
    },
    [onChange],
  )

  // ----------- Manejo de Teclado -----------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen) {
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex])
          }
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex((prev) => {
            let nextIndex = prev + 1 >= options.length ? 0 : prev + 1

            // Skip disabled
            while (options[nextIndex]?.disabled) {
              nextIndex = nextIndex + 1 >= options.length ? 0 : nextIndex + 1
              if (nextIndex === prev) break // Prevenir loop infinito
            }

            return nextIndex
          })
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(options.length - 1)
        } else {
          setFocusedIndex((prev) => {
            let nextIndex = prev - 1 < 0 ? options.length - 1 : prev - 1

            // Skip disabled
            while (options[nextIndex]?.disabled) {
              nextIndex = nextIndex - 1 < 0 ? options.length - 1 : nextIndex - 1
              if (nextIndex === prev) break
            }

            return nextIndex
          })
        }
        break
      case 'Escape':
        e.preventDefault()
        if (isOpen) {
          setIsOpen(false)
          buttonRef.current?.focus()
        }
        break
      case 'Tab':
        // Comportamiento nativo de tab, simplemente cerramos si el menú estaba abierto y pierde foco.
        if (isOpen) {
          setIsOpen(false)
        }
        break
    }
  }

  // ----------- FocusTrap & ClickOutside -----------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Effect to set initial focused index when dropdown opens or closes
  useEffect(() => {
    if (isOpen) {
      // Ajustar focusedIndex al elemento seleccionado actualmente previniendo cascading renders
      setTimeout(() => {
        const activeIdx = options.findIndex((o) => o.value === value)

        setFocusedIndex(activeIdx >= 0 ? activeIdx : 0)
      }, 0)
    }
  }, [isOpen, options, value])

  // ----------- Scrolling listbox to focus -----------
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[focusedIndex] as HTMLElement

      if (activeItem) {
        // Scroll element into view without moving window
        activeItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, isOpen])

  return (
    <div
      ref={containerRef}
      className={clsx('relative w-full font-sans', className)}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(
          'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
          'focus:ring-opacity-50 focus:ring-2 focus:outline-none',
          disabled
            ? 'bg-canvas-muted text-secondary border-divider cursor-not-allowed'
            : 'bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary cursor-pointer',
          buttonClassName,
        )}
        disabled={disabled}
        id={id}
        type="button"
        onClick={handleToggle}
      >
        <span className={clsx('truncate', !selectedOption && 'text-secondary/70')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IoChevronDown
          className={clsx('text-secondary h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={listboxRef}
            aria-activedescendant={focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined}
            className={clsx(
              'border-input-outline bg-canvas text-black-and-white absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-lg',
              'scrollbar-thin scrollbar-thumb-divider scrollbar-track-transparent',
              menuClassName,
            )}
            role="listbox"
            tabIndex={-1}
            {...motionProps}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                aria-disabled={option.disabled}
                aria-selected={value === option.value}
                className={clsx(
                  'search-results block w-full cursor-pointer px-3 py-2 text-left text-sm',
                  option.disabled && 'cursor-not-allowed opacity-50',
                  focusedIndex === index && !option.disabled && 'focus-bg-canvas',
                  value === option.value &&
                    !option.disabled &&
                    'bg-hover-overlay text-brand-primary font-medium',
                )}
                id={`${id}-option-${index}`}
                role="option"
                onClick={() => handleSelect(option)}
                onMouseEnter={() => {
                  if (!option.disabled) setFocusedIndex(index)
                }}
              >
                {option.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

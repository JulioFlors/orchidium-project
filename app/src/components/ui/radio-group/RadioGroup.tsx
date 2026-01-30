'use client'

import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export interface RadioOption<T extends string> {
  value: T
  label: ReactNode
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[]
  selectedValue: T
  onValueChange: (value: T) => void
  name: string
}

export function RadioGroup<T extends string>({
  options,
  selectedValue,
  onValueChange,
  name,
}: RadioGroupProps<T>) {
  return (
    <div className="flex flex-col items-start space-y-5" role="radiogroup">
      {options.map((option) => (
        <label
          key={option.value}
          className="group ml-0.75 flex cursor-pointer items-center" // Usaremos 'group' para el hover en el span
          htmlFor={`${name}-${option.value}`}
        >
          {/* El input real con 'peer' */}
          <input
            checked={selectedValue === option.value}
            className="peer sr-only" // Oculto pero con la clase 'peer'
            id={`${name}-${option.value}`}
            name={name}
            type="radio"
            value={option.value}
            onChange={() => onValueChange(option.value)}
          />

          {/* Círculo exterior personalizado */}
          <div className="ring-label peer-focus:ring-primary peer-active:ring-primary peer-checked:ring-label relative flex h-4.5 w-4.5 items-center justify-center rounded-full border-4 border-white bg-white ring-1 ring-offset-2 transition-all duration-300 outline-none peer-focus:ring-2 peer-focus:ring-offset-1 peer-active:ring-2 peer-active:ring-offset-1">
            {/* Punto interior animado */}
            <AnimatePresence>
              {selectedValue === option.value && (
                <motion.div
                  animate={{ scale: 1 }}
                  className="bg-secondary h-full w-full rounded-full"
                  exit={{ scale: 0 }}
                  initial={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.2 }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Etiqueta de texto */}
          <span className="text-label group-hover:text-primary peer-checked:text-primary ml-3 text-[13.5px] leading-5 font-semibold tracking-wide transition-colors duration-300 ease-in-out">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}

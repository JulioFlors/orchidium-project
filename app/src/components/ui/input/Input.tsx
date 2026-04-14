import * as React from 'react'
import clsx from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string
}

/**
 * Componente Input estandarizado para PristinoPlant.
 * Encapsula los estados de foco, hover y error de forma centralizada.
 *
 * @param error - Si es true o un string, aplica el estilo de validación fallida.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          // Layout & Base
          'bg-input w-full rounded px-3 py-2 text-sm leading-6 font-medium transition-all duration-300 ease-in-out',
          // Outline / Border base
          'outline-input-outline outline-1 -outline-offset-1',
          // Focus state
          'focus:outline-primary focus:z-10',
          // Error state (Prioridad sobre los anteriores)
          error && 'outline-1! -outline-offset-1! outline-red-500!',
          // Custom overrides
          className,
        )}
        type={type}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }

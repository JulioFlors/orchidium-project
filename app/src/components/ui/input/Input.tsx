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
        aria-invalid={error ? 'true' : undefined}
        className={clsx(
          // Layout & Base
          'bg-input w-full rounded px-3 py-2 text-sm leading-6 font-medium transition-all duration-300 ease-in-out',
          // Outline / Border base
          'outline-input-outline outline-1 -outline-offset-1',
          // Focus state (1px solid con color de accesibilidad)
          'focus:outline-1 focus:-outline-offset-1 focus:outline-accessibility focus:z-10',
          // Error state (Prioridad sobre los anteriores con colores estándar de auth)
          error && 'outline-1! -outline-offset-1! outline-red-800/75! dark:outline-red-400/75!',
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

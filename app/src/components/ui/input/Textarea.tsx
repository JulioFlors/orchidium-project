import * as React from 'react'
import clsx from 'clsx'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string
}

/**
 * Componente Textarea estandarizado para PristinoPlant.
 * Comparte la misma estética que el componente Input.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          // Layout & Base
          'bg-input min-h-[100px] w-full rounded px-3 py-2 text-sm leading-6 font-medium transition-all duration-300 ease-in-out',
          // Outline / Border base
          'outline-input-outline outline-1 -outline-offset-1',
          // Focus state
          'focus:outline-primary focus:z-10',
          // Error state (Prioridad sobre los anteriores)
          error && 'outline-1! -outline-offset-1! outline-red-500!',
          // Custom overrides
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea }

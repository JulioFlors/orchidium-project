import { forwardRef } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

export function buttonVariants({
  variant = 'primary',
  size = 'default',
  className,
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded outline-none transition-colors duration-300 ease-in-out font-semibold shadow-[inset_0_0_0_2px_transparent] cursor-pointer'

  const variants = {
    primary: 'btn-primary', // Ya maneja el hover, focus, disabled en globals.css
    secondary: 'btn-secondary',
    ghost: 'btn-border-none', // Se comporta como ghost
    destructive:
      'bg-red-600 text-white hover:bg-red-700 focus:shadow-[inset_0_0_0_2px_white] disabled:bg-red-400',
  }

  const sizes = {
    default: 'px-6 py-1 leading-[26.5px] min-h-10',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10 shrink-0',
  }

  return twMerge(clsx(baseStyles, variants[variant], sizes[size], className))
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'default', isLoading, disabled, children, ...props },
    ref,
  ) => {
    // Si está en loading, se desactiva y opaca igual que btn-disabled
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        className={buttonVariants({
          variant,
          size,
          className: clsx(className, {
            'cursor-wait opacity-70': isLoading,
            'cursor-not-allowed opacity-80': disabled && !isLoading && variant === 'primary',
          }),
        })}
        disabled={isDisabled}
        type="button"
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

import { forwardRef } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'info'
    | 'purple'
    | 'green'
    | 'status'
  size?: 'default' | 'sm'
}

export function badgeVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: BadgeProps['variant']
  size?: BadgeProps['size']
  className?: string
}) {
  const baseStyles =
    'inline-flex items-center rounded-full font-bold tracking-wide uppercase transition-colors'

  const variants = {
    default: 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900',
    secondary: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50',
    outline: 'border border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-50',
    destructive: 'bg-red-500/10 text-red-500 border border-red-500/20',
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    green: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    status: 'bg-current/10 border border-current/20',
  }

  const sizes = {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-[10px]',
  }

  return twMerge(clsx(baseStyles, variants[variant], sizes[size], className))
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return <div ref={ref} className={badgeVariants({ variant, size, className })} {...props} />
  },
)
Badge.displayName = 'Badge'

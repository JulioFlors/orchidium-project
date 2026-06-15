'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

import { Card, StatusCircleIcon } from '@/components'

interface QuickActionCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
  color?: 'orange' | 'pink' | 'emerald' | 'blue'
  className?: string
}

const COLOR_MAP = {
  orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
  pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
}

export function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  color = 'blue',
  className,
}: QuickActionCardProps) {
  // Mapear el color a la variante de color glow de StatusCircleIcon
  const glowVariant =
    color === 'orange'
      ? 'orange'
      : color === 'pink'
        ? 'pink'
        : color === 'emerald'
          ? 'green'
          : 'blue'

  return (
    <Card
      className={clsx(
        'group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl p-6 transition-all duration-300 select-none',
        'border bg-linear-to-br shadow-lg hover:shadow-xl',
        'hover:bg-hover-overlay',
        COLOR_MAP[color],
        className,
      )}
      onClick={onClick}
    >
      {/* Hover overlay para asegurar accesibilidad */}
      <div className="bg-hover-overlay absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Glow radial sutil de fondo */}
      <div
        className={clsx(
          'absolute -top-4 -right-4 h-24 w-24 rounded-full bg-current opacity-0 blur-3xl transition-opacity',
          color === 'orange' && 'text-orange-500 group-hover:opacity-10 dark:group-hover:opacity-5',
          color === 'pink' && 'text-pink-500 group-hover:opacity-10 dark:group-hover:opacity-5',
          color === 'emerald' &&
            'text-emerald-500 group-hover:opacity-10 dark:group-hover:opacity-5',
          color === 'blue' && 'text-blue-500 group-hover:opacity-10 dark:group-hover:opacity-5',
        )}
      />

      <div className="relative z-1 flex flex-col gap-4">
        {/* Usamos el StatusCircleIcon con variante glow y tamaño lg */}
        <StatusCircleIcon
          translucent
          glowVariant={glowVariant}
          icon={icon}
          size="lg"
          variant="glow"
        />

        <div>
          <h3 className="text-primary text-lg font-bold tracking-tight">{title}</h3>
          <p className="text-secondary mt-1 text-sm leading-relaxed">{description}</p>
        </div>

        <div
          className={clsx(
            'mt-2 flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase opacity-60 transition-opacity group-hover:opacity-100',
            color === 'orange' && 'text-orange-500 dark:text-orange-400',
            color === 'pink' && 'text-pink-500 dark:text-pink-400',
            color === 'emerald' && 'text-emerald-500 dark:text-emerald-400',
            color === 'blue' && 'text-blue-500 dark:text-blue-400',
          )}
        >
          <span>Acción Rápida</span>
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="text-[10px]">Pristino Engine</span>
        </div>
      </div>
    </Card>
  )
}

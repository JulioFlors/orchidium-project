'use client'

import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface StatusCircleIconProps {
  icon: React.ReactNode
  variant?: 'canvas' | 'surface' | 'vibrant'
  colorClassName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Activa el fondo de color DENTRO del círculo, que se intensifica en group-hover */
  glow?: boolean
  /**
   * Color RGB para el glow interno (ej: '249, 115, 22').
   * Solo aplica cuando `glow` es true.
   */
  glowColor?: string
  /** Estilos inline para el círculo (ej: borderColor dinámico) */
  style?: React.CSSProperties
}

const sizeClasses = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-10 w-10 text-xl',
  lg: 'h-12 w-12 text-2xl',
}

export function StatusCircleIcon({
  icon,
  variant = 'canvas',
  colorClassName,
  className,
  size = 'md',
  glow = false,
  glowColor,
  style,
}: StatusCircleIconProps) {
  /**
   * Cuando `glow` está activo, usamos CSS custom properties para manejar
   * la transición de intensidad del fondo: sutil en reposo → intenso en hover.
   * La variable --glow-bg se aplica como backgroundColor inline y se sobreescribe
   * con la clase group-hover vía el pseudo-elemento CSS nativo de Tailwind.
   */
  const glowStyles: React.CSSProperties =
    glow && glowColor
      ? ({
          '--_glow-rest': `rgba(${glowColor}, 0.08)`,
          '--_glow-hover': `rgba(${glowColor}, 0.2)`,
          backgroundColor: 'var(--_glow-rest)',
        } as React.CSSProperties)
      : {}

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-300',
        sizeClasses[size],
        variant === 'canvas' && !glow && 'bg-canvas border-input-outline',
        variant === 'surface' && !glow && 'bg-surface border-input-outline',
        variant === 'vibrant' && !glow && 'bg-hover-overlay border-transparent',
        // Cuando glow está activo, aún aplicamos el borde del variant
        glow && variant === 'canvas' && 'border-input-outline',
        glow && variant === 'surface' && 'border-input-outline',
        glow && variant === 'vibrant' && 'border-transparent',
        glow && 'group-hover:bg-(--_glow-hover)',
        colorClassName,
        className,
      )}
      style={{ ...glowStyles, ...style }}
    >
      {icon}
    </div>
  )
}

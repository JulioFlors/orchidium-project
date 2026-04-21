'use client'

import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Tipos ---

export type GlowVariant =
  | 'yellow'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'red'
  | 'green'
  | 'cyan'
  | 'orange'

interface GlowColors {
  borderHover: string
  bgHover: string
  borderRest: string
  bgRest: string
}

// --- Helpers de Color (Motor Dinámico) ---

/**
 * Convierte un hex (#RRGGBB) a HSL.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Asegura que el color sea vibrante (Pristino Quality Check).
 */
function normalizeHsl(h: number, s: number, l: number) {
  return {
    h,
    s: Math.max(s, 40), // Mínimo 40% saturación
    l: Math.min(Math.max(l, 35), 60), // Entre 35-60% de luminosidad
  }
}

/**
 * Deriva los 4 colores del sistema de glow partiendo de un HSL.
 */
function deriveGlowColors(h: number, s: number, l: number): GlowColors {
  return {
    borderHover: `hsl(${h}, ${s}%, ${l}%)`,
    bgHover: `hsl(${h}, ${s * 0.65}%, 12%)`,
    borderRest: `hsl(${h}, ${s * 0.3}%, 13%)`,
    bgRest: `hsl(${h}, ${s * 0.5}%, 12%)`,
  }
}

// --- Mapeo Estático (Referencia) ---

const GLOW_MAP: Record<GlowVariant, GlowColors> = {
  yellow: {
    borderHover: '#FFB224',
    bgHover: '#3B2C0F',
    borderRest: '#2F271A',
    bgRest: '#221A0C',
  },
  blue: {
    borderHover: '#0070F3',
    bgHover: '#081E39',
    borderRest: '#17212E',
    bgRest: '#081321',
  },
  violet: {
    borderHover: '#8E4EC6',
    bgHover: '#241830',
    borderRest: '#241E29',
    bgRest: '#16101C',
  },
  pink: {
    borderHover: '#E93D82',
    bgHover: '#371422',
    borderRest: '#1E1318',
    bgRest: '#180B10',
  },
  red: {
    borderHover: '#E5484D',
    bgHover: '#361617',
    borderRest: '#2C1D1E',
    bgRest: '#1F0F10',
  },
  green: {
    borderHover: '#3B8D4B',
    bgHover: '#152618',
    borderRest: '#1D271F',
    bgRest: '#0F1911',
  },
  cyan: {
    borderHover: '#12A594',
    bgHover: '#0C2926',
    borderRest: '#182725',
    bgRest: '#0A1917',
  },
  orange: {
    borderHover: '#F97316',
    bgHover: '#331B0E',
    borderRest: '#2B1D16',
    bgRest: '#1B110B',
  },
}

// --- Componente ---

interface StatusCircleIconProps {
  icon: React.ReactNode
  variant?: 'canvas' | 'surface' | 'vibrant'
  colorClassName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Activa el fondo de color DENTRO del círculo, que se intensifica en group-hover */
  glow?: boolean
  /** Variante de color para el glow basada en el mapeo estático */
  glowVariant?: GlowVariant
  /** Color hexadecimal arbitrario para el glow. Será normalizado si no es vibrante. */
  glowColor?: string
  /** Fuerza el estado encendido sin necesidad de hover */
  active?: boolean
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
  glowVariant,
  glowColor,
  active = false,
  style,
}: StatusCircleIconProps) {
  // Determinar colores base: prioridad Variant > Hex
  let colors: GlowColors | null = null

  if (glowVariant) {
    colors = GLOW_MAP[glowVariant]
  } else if (glowColor && glowColor.startsWith('#')) {
    const { h, s, l } = hexToHsl(glowColor)
    const normalized = normalizeHsl(h, s, l)

    colors = deriveGlowColors(normalized.h, normalized.s, normalized.l)
  }

  const glowStyles: React.CSSProperties =
    glow && colors
      ? ({
          '--_glow-rest': colors.bgRest,
          '--_glow-hover': colors.bgHover,
          '--_glow-border-rest': active ? colors.borderHover : colors.borderRest,
          '--_glow-border-hover': colors.borderHover,
        } as React.CSSProperties)
      : {}

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-300',
        sizeClasses[size],
        // Bases por variante
        variant === 'canvas' && 'bg-canvas border-input-outline',
        variant === 'surface' && 'bg-surface border-input-outline',
        variant === 'vibrant' && 'bg-hover-overlay border-transparent',
        // Capa de Glow
        glow && 'border-(--_glow-border-rest) bg-(--_glow-rest)',
        glow && 'group-hover:border-(--_glow-border-hover) group-hover:bg-(--_glow-hover)',
        colorClassName,
        className,
      )}
      style={{ ...glowStyles, ...style }}
    >
      {icon}
    </div>
  )
}

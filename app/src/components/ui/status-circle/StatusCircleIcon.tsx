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
 * Deriva los colores del sistema de glow partiendo de un HSL.
 * Se utilizan transparencias (hsla) para que el efecto glass se adapte al modo claro/oscuro.
 */
function deriveGlowColors(h: number, s: number, l: number): GlowColors {
  return {
    borderHover: `hsl(${h}, ${s}%, ${l}%)`,
    bgHover: `hsla(${h}, ${s}%, ${l}%, 0.45)`,
    borderRest: `hsla(${h}, ${s}%, ${l}%, 0.25)`,
    bgRest: `hsla(${h}, ${s}%, ${l}%, 0.1)`,
  }
}

// --- Mapeo Estático (Basado en el sistema dinámico) ---

const GLOW_MAP: Record<GlowVariant, GlowColors> = {
  yellow: deriveGlowColors(40, 100, 56),
  blue: deriveGlowColors(212, 100, 48),
  violet: deriveGlowColors(272, 60, 56),
  pink: deriveGlowColors(336, 82, 58),
  red: deriveGlowColors(358, 82, 57),
  green: deriveGlowColors(131, 51, 45),
  cyan: deriveGlowColors(173, 82, 38),
  orange: deriveGlowColors(24, 98, 53),
}

// --- Componente ---

interface StatusCircleIconProps {
  icon: React.ReactNode
  variant?: 'canvas' | 'surface' | 'overlay' | 'glow'
  colorClassName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
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
  glowVariant,
  glowColor,
  active = false,
  style,
}: StatusCircleIconProps) {
  // Determinar colores base: prioridad Variant > Hex
  let colors: GlowColors | null = null

  const isGlow = variant === 'glow'

  if (isGlow) {
    if (glowVariant) {
      colors = GLOW_MAP[glowVariant]
    } else if (glowColor && glowColor.startsWith('#')) {
      const { h, s, l } = hexToHsl(glowColor)
      const normalized = normalizeHsl(h, s, l)

      colors = deriveGlowColors(normalized.h, normalized.s, normalized.l)
    }
  }

  const glowStyles: React.CSSProperties =
    isGlow && colors
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
        'flex shrink-0 items-center justify-center rounded-full border shadow-xs transition-all duration-300',
        sizeClasses[size],
        // Bases por variante
        variant === 'canvas' && 'bg-canvas border-input-outline',
        variant === 'surface' && 'bg-surface border-input-outline',
        variant === 'overlay' && 'bg-hover-overlay border-transparent',

        // Lógica para Glow (Acrílico)
        isGlow &&
          'bg-surface border-(--_glow-border-rest) bg-linear-to-br from-(--_glow-rest) to-transparent',

        // Aplicar estado "encendido" (hover appearance) si active es true
        isGlow && active && 'border-(--_glow-border-hover) from-(--_glow-hover) to-(--_glow-rest)',

        // Hover adaptativo (Intensificación)
        isGlow &&
          'group-hover:border-(--_glow-border-hover) group-hover:from-(--_glow-hover) group-hover:to-(--_glow-rest)',

        colorClassName,
        className,
      )}
      style={{ ...glowStyles, ...style }}
    >
      <div
        className={cn(
          'relative z-9 transition-colors duration-300',
          isGlow && (active || 'group-hover:text-black-and-white'),
          isGlow && !active && 'text-(--_glow-border-hover)',
          isGlow && active && 'text-black-and-white',
        )}
      >
        {icon}
      </div>
    </div>
  )
}

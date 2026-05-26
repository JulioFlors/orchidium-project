'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

import { Card } from './Card'

// ---- Mapa de Colores por Herramienta / Actuador ----
export const GLOW_CARD_COLORS: Record<
  string,
  { bg: string; ring: string; border: string; icon: string; pulse: string }
> = {
  slate: {
    bg: 'from-slate-500/30 to-slate-500/10',
    ring: 'ring-slate-500/15',
    border: 'border-slate-500/30',
    icon: 'text-slate-500',
    pulse: 'bg-slate-400',
  },
  emerald: {
    bg: 'from-emerald-500/30 to-emerald-500/10',
    ring: 'ring-emerald-500/15',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-500',
    pulse: 'bg-emerald-400',
  },
  orange: {
    bg: 'from-orange-500/30 to-orange-500/10',
    ring: 'ring-orange-500/15',
    border: 'border-orange-500/30',
    icon: 'text-orange-500',
    pulse: 'bg-orange-400',
  },
  fuchsia: {
    bg: 'from-fuchsia-500/30 to-fuchsia-500/10',
    ring: 'ring-fuchsia-500/15',
    border: 'border-fuchsia-500/30',
    icon: 'text-fuchsia-500',
    pulse: 'bg-fuchsia-400',
  },
  amber: {
    bg: 'from-amber-500/30 to-amber-500/10',
    ring: 'ring-amber-500/15',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    pulse: 'bg-amber-400',
  },
  blue: {
    bg: 'from-blue-500/30 to-blue-500/10',
    ring: 'ring-blue-500/15',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    pulse: 'bg-blue-400',
  },
  indigo: {
    bg: 'from-indigo-500/30 to-indigo-500/10',
    ring: 'ring-indigo-500/15',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-500',
    pulse: 'bg-indigo-400',
  },
  purple: {
    bg: 'from-purple-500/30 to-purple-500/10',
    ring: 'ring-purple-500/15',
    border: 'border-purple-500/30',
    icon: 'text-purple-500',
    pulse: 'bg-purple-400',
  },
  cyan: {
    bg: 'from-cyan-500/30 to-cyan-500/10',
    ring: 'ring-cyan-500/15',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-500',
    pulse: 'bg-cyan-400',
  },
  green: {
    bg: 'from-green-500/30 to-green-500/10',
    ring: 'ring-green-500/15',
    border: 'border-green-500/30',
    icon: 'text-green-500',
    pulse: 'bg-green-400',
  },
}

const fallbackColor = {
  bg: 'from-indigo-500/30 to-indigo-500/10',
  ring: 'ring-indigo-500/15',
  border: 'border-indigo-500/30',
  icon: 'text-indigo-400',
  pulse: 'bg-indigo-400',
}

interface GlowCardProps {
  icon: ReactNode
  label: string
  color: string
  onClick: () => void
  pending?: boolean
  active?: boolean
  disabled?: boolean
}

export function GlowCard({
  icon,
  label,
  color,
  onClick,
  pending = false,
  active = false,
  disabled = false,
}: GlowCardProps) {
  const colors = GLOW_CARD_COLORS[color] || fallbackColor

  // pending = esperando confirmación del nodo → bloquea click, muestra spinner
  // disabled = inhabilitado por sistema (offline, busy, etc.) → grayscale + no-pointer
  const isInteractive = !pending && !disabled
  const isVisualActive = active || pending

  return (
    <Card
      className={clsx(
        'group relative flex aspect-square min-h-[110px] w-full flex-col items-center justify-center gap-4 overflow-hidden p-6 transition-all duration-300 select-none',
        // Cursor y pointer-events por estado
        isInteractive ? 'cursor-pointer' : 'pointer-events-none',
        // Fondo activo / inactivo
        isVisualActive
          ? clsx(
              `bg-linear-to-br ${colors.bg} ${colors.border} text-neutral-400 dark:text-neutral-200`,
            )
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        // Hover overlay solo cuando interactivo
        isInteractive && 'hover:bg-hover-overlay',
        // Inhabilitado: grayscale + opacidad reducida (pointer-events-none ya cubre el pending)
        disabled && 'opacity-30 grayscale',
      )}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Hover overlay */}
      {isInteractive && (
        <div className="bg-hover-overlay absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      {/* Glow radial de fondo */}
      <div
        className={clsx(
          'absolute -top-4 -right-4 h-24 w-24 rounded-full bg-current opacity-0 blur-3xl transition-opacity group-hover:opacity-10 dark:group-hover:opacity-5',
          isVisualActive && 'opacity-20! dark:opacity-10!',
        )}
      />

      {/* Indicador de estado activo (puntito) — solo cuando activo y sin pendiente */}
      {active && !pending && (
        <div className="absolute top-4 right-4 aspect-square h-2 w-2 shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor] select-none" />
      )}

      {/* Contenedor de Icono y Spinner con transiciones fluidas de opacidad y escala */}
      <div className="relative z-1 flex h-9 w-9 items-center justify-center text-4xl">
        {/* Wrapper del Spinner */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            pending ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0',
            isVisualActive ? 'text-black-and-white' : 'text-zinc-400 dark:text-zinc-500',
          )}
        >
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>

        {/* Wrapper del Icono */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            pending ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100',
            isVisualActive
              ? 'text-black-and-white'
              : 'text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100',
          )}
        >
          <div
            className={clsx(
              'flex items-center justify-center transition-all duration-300',
              active && 'drop-shadow-sm',
            )}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Label */}
      <span
        className={clsx(
          'z-10 text-center text-[10px] font-black tracking-[0.15em] uppercase transition-colors',
          isVisualActive
            ? 'text-black-and-white'
            : 'text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100',
          pending && 'opacity-50',
        )}
      >
        {label}
      </span>
    </Card>
  )
}

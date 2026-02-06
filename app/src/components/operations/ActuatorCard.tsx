import clsx from 'clsx'
import { ReactNode } from 'react'

interface ActuatorCardProps {
  title: string
  icon: ReactNode
  isActive: boolean
  isLoading?: boolean
  isDisabled?: boolean
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'cyan'
  isDeviceOnline?: boolean
  onToggle: () => void
}

export function ActuatorCard({
  title,
  icon,
  isActive,
  isLoading = false,
  isDisabled = false,
  onToggle,
  color = 'blue',
  isDeviceOnline = true,
}: ActuatorCardProps) {
  // Mapa de colores para estados activos
  const colorMap = {
    blue: 'bg-blue-500 shadow-blue-500/50',
    green: 'bg-green-500 shadow-green-500/50',
    amber: 'bg-amber-500 shadow-amber-500/50',
    purple: 'bg-purple-500 shadow-purple-500/50',
    cyan: 'bg-cyan-500 shadow-cyan-500/50',
  }

  const activeClass = isActive ? colorMap[color] : 'bg-zinc-800'

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 select-none',

        // --- Estado Deshabilitado o Cargando ---
        isDisabled
          ? 'cursor-not-allowed border border-zinc-200 bg-zinc-100/50 text-zinc-400 grayscale dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500'
          : 'cursor-pointer',

        // --- Estado Activo vs Inactivo (Solo si habilitado) ---
        !isDisabled && isActive
          ? clsx('transform text-white hover:scale-[1.02] hover:shadow-lg', activeClass)
          : !isDisabled
            ? 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80'
            : '',
      )}
      onClick={() => {
        if (isDisabled) return
        onToggle()
      }}
    >
      {/* Icono Principal */}
      <div
        className={clsx(
          'text-4xl',
          isActive ? 'scale-110' : '',
          'transition-transform duration-300',
        )}
      >
        {isLoading ? (
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
      </div>

      {/* Título */}
      <h3
        className={clsx(
          'text-lg font-medium tracking-wide',
          isActive ? 'text-white' : 'text-zinc-700 dark:text-zinc-300', // Light mode text
        )}
      >
        {title}
      </h3>

      {/* Indicador de Estado (Puntito) */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span
          className={clsx(
            'h-2 w-2 rounded-full',
            isActive
              ? isDeviceOnline
                ? 'animate-pulse bg-white'
                : 'animate-ping bg-amber-500' // Alerta visual si está activo pero offline
              : 'bg-zinc-400 dark:bg-zinc-700', // Light mode dot
          )}
        />
        <span
          className={clsx(
            'font-mono text-xs tracking-wider uppercase opacity-60',
            isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-500',
          )}
        >
          {isActive ? (isDeviceOnline ? 'ON' : 'OFFLINE') : 'OFF'}
        </span>
      </div>
    </div>
  )
}

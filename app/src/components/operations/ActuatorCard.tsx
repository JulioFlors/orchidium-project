import clsx from 'clsx'
import { ReactNode } from 'react'
import { IoPower } from 'react-icons/io5'

interface ActuatorCardProps {
  title: string
  icon: ReactNode
  isActive: boolean
  isLoading?: boolean
  isDisabled?: boolean
  onToggle: () => void
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'cyan'
}

export function ActuatorCard({
  title,
  icon,
  isActive,
  isLoading = false,
  isDisabled = false,
  onToggle,
  color = 'blue',
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
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all duration-300',
        isDisabled ? 'cursor-not-allowed opacity-50 grayscale' : '',
        isActive ? 'text-white' : 'text-zinc-400 hover:bg-zinc-700/50',
        isActive ? activeClass : 'border border-zinc-800 bg-zinc-900',
      )}
    >
      {/* Icono Principal */}
      <div
        className={clsx(
          'text-4xl',
          isActive ? 'scale-110' : '',
          'transition-transform duration-300',
        )}
      >
        {icon}
      </div>

      {/* Título */}
      <h3
        className={clsx(
          'text-lg font-medium tracking-wide',
          isActive ? 'text-white' : 'text-zinc-400 hover:bg-zinc-700/50',
        )}
      >
        {title}
      </h3>

      {/* Botón de Acción */}
      <button
        className={clsx(
          'group absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          isActive
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white',
        )}
        disabled={isLoading || isDisabled}
        type="button"
        onClick={() => {
          if (isDisabled) return
          onToggle()
        }}
      >
        <IoPower className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
      </button>

      {/* Indicador de Estado (Puntito) */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isActive ? 'animate-pulse bg-white' : 'bg-zinc-700'}`}
        />
        <span className="font-mono text-xs tracking-wider uppercase opacity-60">
          {isActive ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* TODO: Slider de Duración aquí */}
    </div>
  )
}

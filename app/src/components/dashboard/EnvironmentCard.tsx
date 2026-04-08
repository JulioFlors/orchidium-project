'use client'

import { clsx } from 'clsx'
import { motion, useMotionTemplate, useMotionValue } from 'motion/react'
import { MouseEvent, useRef, useState } from 'react'

import { BorderTrail } from '@/components/ui/border-trail/BorderTrail'

export interface EnvironmentCardProps {
  title: string
  value: string | number
  unit: string
  icon: React.ReactNode
  status?: 'optimal' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
  isActive?: boolean
  onClick?: () => void
  className?: string
  description?: React.ReactNode
  color?: 'orange' | 'blue' | 'yellow' | 'cyan' | 'purple' | 'green'
  isOffline?: boolean
  isLoading?: boolean
  hasData?: boolean
  statusLabel?: string
}

export function EnvironmentCard({
  title,
  value,
  unit,
  icon,
  status = 'optimal',
  className,
  description,
  color = 'purple',
  isActive = false,
  isOffline = false,
  isLoading = false,
  hasData = true,
  statusLabel,
  onClick,
  trend: _trend,
}: EnvironmentCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()

    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const statusColors = {
    optimal: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500',
  }

  const colorStyles = {
    orange: {
      text: 'text-orange-500',
      bgRaw: '249, 115, 22',
      border: 'group-hover:border-orange-500/50',
      stroke: '#f97316',
      bgClass: 'bg-orange-500',
    },
    blue: {
      text: 'text-blue-500',
      bgRaw: '59, 130, 246',
      border: 'group-hover:border-blue-500/50',
      stroke: '#3b82f6',
      bgClass: 'bg-blue-500',
    },
    yellow: {
      text: 'text-yellow-400',
      bgRaw: '250, 204, 21',
      border: 'group-hover:border-yellow-400/50',
      stroke: '#facc15',
      bgClass: 'bg-yellow-400',
    },
    cyan: {
      text: 'text-cyan-400',
      bgRaw: '34, 211, 238',
      border: 'group-hover:border-cyan-400/50',
      stroke: '#22d3ee',
      bgClass: 'bg-cyan-400',
    },
    purple: {
      text: 'text-purple-500',
      bgRaw: '168, 85, 247',
      border: 'group-hover:border-purple-500/50',
      stroke: '#a855f7',
      bgClass: 'bg-purple-500',
    },
    green: {
      text: 'text-green-500',
      bgRaw: '34, 197, 94',
      border: 'group-hover:border-green-500/50',
      stroke: '#22c55e',
      bgClass: 'bg-green-500',
    },
  }

  const selectedColor = color ? colorStyles[color] : colorStyles.orange

  return (
    <motion.div
      ref={containerRef}
      animate="rest"
      className={clsx(
        'group relative flex min-h-[180px] w-full flex-col overflow-hidden rounded-md border',
        'bg-surface',
        // 1. MANTENEMOS EL BORDE DE LA TARJETA SIEMPRE VISIBLE PERO SUTIL
        // Usamos una opacidad baja cuando hay trail para que no compitan, pero que no desaparezca.
        isHovered || isActive ? 'border-primary/20' : 'border-input-outline',
        'cursor-pointer transition-all duration-300 select-none',
        className,
      )}
      initial="rest"
      whileHover="hover"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-md opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              320px circle at ${mouseX}px ${mouseY}px,
              rgba(${selectedColor.bgRaw}, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* Border Trail Effect */}
      <div
        className={clsx(
          'absolute inset-0 transition-opacity duration-300',
          isHovered || isActive ? 'opacity-100' : 'opacity-0',
        )}
      >
        <BorderTrail
          active={isHovered || isActive}
          color={selectedColor.stroke}
          isSelected={isActive}
          trackRadius={4}
        />
      </div>

      {/* Content Container */}
      <div className="relative flex h-full flex-1 flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={clsx(
                'bg-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors duration-300',
                !isActive && 'border-input-outline',
                selectedColor.text,
                `group-hover:bg-[rgba(${selectedColor.bgRaw},0.1)]`,
                selectedColor.border,
                isActive && `bg-[rgba(${selectedColor.bgRaw},0.1)]`,
              )}
              style={{
                borderColor: isActive ? `rgba(${selectedColor.bgRaw}, 0.5)` : undefined,
              }}
            >
              {icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-primary text-sm font-semibold transition-colors">{title}</h3>
              {description && <div className="text-secondary text-xs">{description}</div>}
            </div>
          </div>
        </div>

        {/* Value Area / Skeleton */}
        <div className="mt-5 flex items-baseline gap-1.5">
          {isLoading ? (
            <div className="bg-primary/10 h-10 w-24 animate-pulse rounded-md" />
          ) : (
            <>
              <span className="text-primary text-4xl font-extrabold tracking-tight">
                {isOffline || !hasData ? '--' : value}
              </span>
              <span className="text-secondary text-sm font-semibold">{unit}</span>
            </>
          )}
        </div>

        {/* Status / Trend / Offline Indicators */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isLoading ? (
            <div className="bg-primary/10 h-5 w-16 animate-pulse rounded-full" />
          ) : (
            <>
              {(statusLabel || status !== 'optimal') && !isOffline && hasData && (
                <div
                  className={clsx(
                    'border-input-outline bg-surface rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm',
                    statusColors[status],
                  )}
                >
                  {statusLabel || (status === 'warning' ? 'Revisar' : 'Crítico')}
                </div>
              )}
              {isOffline && (
                <div className="border-input-outline bg-surface text-secondary rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  Offline
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'
import clsx from 'clsx'

import { Card } from '@/components/ui'

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
  return (
    <motion.div className="h-full" whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        className={clsx(
          'group relative h-full cursor-pointer overflow-hidden p-6 transition-all duration-300',
          'border bg-linear-to-br shadow-lg hover:shadow-xl',
          COLOR_MAP[color],
          className,
        )}
        onClick={onClick}
      >
        {/* Glow de fondo */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-current opacity-10 blur-3xl transition-opacity group-hover:opacity-20" />

        <div className="relative flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner transition-colors group-hover:border-current/30">
            {icon}
          </div>

          <div>
            <h3 className="text-primary text-lg font-bold tracking-tight">{title}</h3>
            <p className="text-secondary mt-1 text-sm leading-relaxed">{description}</p>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase opacity-60 transition-opacity group-hover:opacity-100">
            <span>Acción Rápida</span>
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="text-[10px]">Pristino Engine</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

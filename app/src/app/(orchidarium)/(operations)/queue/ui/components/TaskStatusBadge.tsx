'use client'

import { HiOutlineCog } from 'react-icons/hi'
import { LuRadioTower } from 'react-icons/lu'

import { Badge } from '@/components/ui'

interface TaskStatusBadgeProps {
  isPast: boolean
  status: string
}

export function TaskStatusBadge({ isPast, status }: TaskStatusBadgeProps) {
  if (status === 'IN_PROGRESS') {
    return (
      <Badge className="gap-1.5 border-none bg-amber-500/10 text-amber-500" size="sm">
        <HiOutlineCog className="h-3 w-3 animate-spin" />
        Ejecutando
      </Badge>
    )
  }

  if (status === 'CONFIRMED') {
    return (
      <Badge className="gap-1.5 border-none bg-blue-500/10 text-blue-500" size="sm">
        <LuRadioTower className="h-3 w-3" />
        Confirmado
      </Badge>
    )
  }

  if (isPast && status === 'PENDING') {
    return (
      <Badge className="border-none bg-yellow-500/10 text-yellow-500" size="sm">
        En espera
      </Badge>
    )
  }

  // Por defecto, las tareas en Queue suelen ser PENDING.
  // Si no es ninguna de las anteriores, mostramos un estado neutral para PENDING futuro.
  if (status === 'PENDING') {
    return (
      <Badge className="text-secondary border-none bg-black/5 dark:bg-white/5" size="sm">
        Agendada
      </Badge>
    )
  }

  return null
}

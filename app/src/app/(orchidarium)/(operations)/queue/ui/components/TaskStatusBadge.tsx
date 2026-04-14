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
      <Badge className="gap-1 border-none" size="sm" variant="warning">
        <HiOutlineCog className="h-3 w-3 animate-spin" />
        Ejecutando
      </Badge>
    )
  }
  if (status === 'CONFIRMED') {
    return (
      <Badge className="gap-1 border-none" size="sm" variant="info">
        <LuRadioTower className="h-3 w-3" />
        Confirmado
      </Badge>
    )
  }
  if (isPast && status === 'PENDING') {
    return (
      <Badge className="gap-1 border-none" size="sm" variant="warning">
        En espera
      </Badge>
    )
  }

  return null
}

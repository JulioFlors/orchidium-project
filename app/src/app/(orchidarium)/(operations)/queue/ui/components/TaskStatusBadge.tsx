'use client'

import { TaskStatusLabels, DosingTaskStatusLabels, TaskStatusStyles } from '@/config'
import { Badge } from '@/components'

export interface TaskStatusBadgeProps {
  status: string
  hasDbId: boolean
  context?: 'operations' | 'dosing'
}

export function TaskStatusBadge({ status, hasDbId, context = 'operations' }: TaskStatusBadgeProps) {
  // Si no tiene ID en la DB (ej. tareas proyectadas routine-), no renderizar badge de estado
  if (!hasDbId) return null

  const labelDictionary = context === 'dosing' ? DosingTaskStatusLabels : TaskStatusLabels
  const label = labelDictionary[status as keyof typeof TaskStatusLabels] || status
  const style = TaskStatusStyles[status as keyof typeof TaskStatusStyles] || 'text-secondary'

  return (
    <Badge className={style} size="sm" variant="status">
      {label}
    </Badge>
  )
}

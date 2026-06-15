'use client'

import { TaskStatusLabels, TaskStatusStyles } from '@/config/mappings'
import { Badge } from '@/components/ui'

export function TaskStatusBadge({ status, hasDbId }: { status: string; hasDbId: boolean }) {
  // Si no tiene ID en la DB (ej. tareas proyectadas routine-), no renderizar badge de estado
  if (!hasDbId) return null

  const label = TaskStatusLabels[status as keyof typeof TaskStatusLabels] || status
  const style = TaskStatusStyles[status as keyof typeof TaskStatusStyles] || 'text-secondary'

  return (
    <Badge className={style} size="sm" variant="status">
      {label}
    </Badge>
  )
}

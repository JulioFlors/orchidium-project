'use client'

import { HiOutlineCog } from 'react-icons/hi'

import { Badge } from '@/components/ui'

export function TaskStatusBadge({ status, isPast }: { status: string; isPast?: boolean }) {
  const STATUS_MAP: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    WAITING_CONFIRMATION: {
      label: 'Esperando Confirmación',
      className: 'border-none bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    AUTHORIZED: {
      label: 'Autorizada',
      className: 'border-none bg-green-500/10 text-green-600 dark:text-green-400',
    },
    DISPATCHED: {
      label: 'Despachada',
      className: 'border-none bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    ACKNOWLEDGED: {
      label: 'Recibida',
      className: 'border-none bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    IN_PROGRESS: {
      label: 'Ejecutando',
      className: 'border-none bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: <HiOutlineCog className="h-3 w-3 animate-spin" />,
    },
    CANCELLED: {
      label: 'Cancelada',
      className: 'border-none bg-red-500/10 text-red-600 dark:text-red-400',
    },
    SKIPPED: {
      label: 'Omitida',
      className: 'border-none bg-slate-500/10 text-slate-500',
    },
    EXPIRED: {
      label: 'Expirada',
      className: 'border-none bg-slate-500/20 text-slate-400',
    },
    PENDING: {
      label: isPast ? 'En espera' : 'Agendada',
      className: isPast
        ? 'border-none bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
        : 'text-secondary border-none bg-black/5 dark:bg-white/5',
    },
    COMPLETED: {
      label: 'Completada',
      className: 'border-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  }

  const config = STATUS_MAP[status] || { label: status, className: '' }

  return (
    <Badge className={config.className + ' gap-1.5'} size="sm">
      {config.icon}
      {config.label}
    </Badge>
  )
}

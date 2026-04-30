'use client'

import React from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { IoCalendarOutline, IoTimeOutline, IoCloseOutline } from 'react-icons/io5'
import { RxStopwatch } from 'react-icons/rx'
import { MdLayers } from 'react-icons/md'
import { useSWRConfig } from 'swr'

import { TaskStatusBadge } from './TaskStatusBadge'

import { Badge, StatusCircleIcon, ActionMenu, ActionMenuItem, Button } from '@/components/ui'
import { formatTime12h } from '@/utils'
import { useToast } from '@/hooks'
import { TaskPurpose, ZoneType, TaskPurposeLabels, ZoneTypeLabels } from '@/config/mappings'

interface PendingTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  status: string
  isRoutine?: boolean
  routineName?: string
  agrochemicalName?: string
  notes?: string
  source?: string
}

interface QueueTaskCardProps {
  task: PendingTask
  onCancel: (task: { id: string; label: string; isRoutine?: boolean; scheduledAt: string }) => void
  icon: React.ReactNode
  colorClassName: string
}

/**
 * Tarjeta de Tarea en Cola (Execution Queue)
 *
 * Este componente es una pieza crítica del sistema de operaciones. Implementa una lógica
 * responsiva híbrida diseñada para mantener la legibilidad en pantallas de 320px hasta escritorio.
 *
 * Características clave de diseño:
 * 1. Dual-Layout: Vertical en móvil (stack) y Horizontal en escritorio (grid col-2).
 * 2. Ultra-Mobile (sub-tds-xs): Oculta iconos y reordena la cabecera mediante `contents/order`.
 * 3. Fluid Wrapping: El bloque de detalles utiliza hijos desagrupados para permitir que
 *    los datos técnicos colapsen en una única columna vertical si el espacio es crítico,
 *    protegiendo siempre la visibilidad del ActionMenu.
 */
export function QueueTaskCard({ task, onCancel, icon, colorClassName }: QueueTaskCardProps) {
  const dateObj = new Date(task.scheduledAt)
  const { mutate } = useSWRConfig()
  const { success, error: toastError } = useToast()

  const isPast = dateObj < new Date()
  const actionLabel = TaskPurposeLabels[task.purpose] || task.purpose

  const handleAction = async (
    actionPromise: Promise<{ success: boolean; error?: string }>,
    successMsg: string,
  ) => {
    try {
      const res = await actionPromise

      if (res.success) {
        success(successMsg)
        mutate('/api/planner/queue')
      } else {
        toastError(res.error || 'Error al ejecutar la acción')
      }
    } catch {
      toastError('Error de red')
    }
  }

  const menuItems: ActionMenuItem[] = [
    ...(task.status === 'WAITING_CONFIRMATION' ||
    task.status === 'PENDING' ||
    task.status === 'AUTHORIZED'
      ? [
          {
            label: 'Posponer 24h',
            icon: <IoCalendarOutline className="text-blue-400" />,
            onClick: async () => {
              const { postponeAgrochemicalTask } =
                await import('@/actions/tasks/task-confirmation-actions')

              handleAction(postponeAgrochemicalTask(task.id, 24), 'Tarea pospuesta 24h')
            },
          },
          {
            label: 'Posponer 48h',
            icon: <IoCalendarOutline className="text-indigo-400" />,
            onClick: async () => {
              const { postponeAgrochemicalTask } =
                await import('@/actions/tasks/task-confirmation-actions')

              handleAction(postponeAgrochemicalTask(task.id, 48), 'Tarea pospuesta 48h')
            },
          },
        ]
      : []),
    {
      label: 'Cancelar tarea',
      icon: <IoCloseOutline className="text-red-500" />,
      onClick: () =>
        onCancel({
          id: task.id,
          label: actionLabel,
          isRoutine: task.isRoutine,
          scheduledAt: task.scheduledAt,
        }),
      variant: 'destructive',
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay tds-sm:flex-row tds-sm:items-center relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all"
      initial={{ opacity: 0, y: 5 }}
    >
      <div className="tds-sm:grid tds-sm:grid-cols-[1fr_auto] tds-sm:items-center tds-sm:gap-x-6 flex flex-1 flex-col gap-4">
        {/* Lado Izquierdo: Contexto de la Tarea 
            Contiene el estado visual (Icono), el propósito de la acción, el origen (Badge) 
            y los detalles secundarios (Nombre de rutina o notas). */}
        <div className="flex flex-row items-start gap-4">
          <StatusCircleIcon
            active={task.status === 'IN_PROGRESS'}
            className="tds-xs:flex hidden shrink-0"
            colorClassName={colorClassName}
            icon={icon}
            size="md"
            variant="vibrant"
          />
          <div className="flex flex-1 flex-col gap-y-1 overflow-hidden text-left">
            <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 tds-xs:flex contents">
              <h3 className="text-primary tds-xs:truncate tds-xs:whitespace-nowrap order-1 text-[15px] leading-tight font-bold antialiased">
                {actionLabel}
              </h3>
              <div className="order-3 flex items-center gap-2">
                <SourceBadge isRoutine={task.isRoutine} />
                <TaskStatusBadge
                  isPast={isPast}
                  status={
                    task.status as
                      | 'PENDING'
                      | 'IN_PROGRESS'
                      | 'COMPLETED'
                      | 'CANCELED'
                      | 'FAILED'
                      | 'EXPIRED'
                  }
                />
              </div>
            </div>

            <div className="text-secondary tds-xs:mt-1 order-2 flex items-center gap-2 text-[11px] font-medium opacity-60">
              {task.isRoutine ? (
                <span className="truncate">{task.routineName}</span>
              ) : task.agrochemicalName ? (
                <span className="truncate">{task.agrochemicalName}</span>
              ) : (
                <>
                  <span className="font-mono text-[10px]">#{task.id.substring(0, 8)}</span>
                  {task.notes && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="line-clamp-1 italic">{task.notes}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Detalles */}
        <div className="tds-sm:border-0 tds-sm:pt-0 border-black-and-white/5 flex flex-1 flex-col gap-3 border-t border-dashed pt-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="tds-sm:justify-end flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3">
              {/* Fecha */}
              <div className="text-primary flex shrink-0 items-center gap-1.5 font-bold whitespace-nowrap">
                <IoCalendarOutline className="h-4 w-4 opacity-40" />
                <span className="text-[11px] tracking-tight uppercase">
                  {dateObj.toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>

              {/* Hora */}
              <div className="text-primary flex shrink-0 items-center gap-1.5 font-mono text-xs font-bold tracking-tighter whitespace-nowrap uppercase">
                <IoTimeOutline className="h-4 w-4 opacity-40" />
                <span className={clsx(isPast && 'opacity-30')}>{formatTime12h(dateObj)}</span>
              </div>

              {/* Duración */}
              <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                <RxStopwatch className="text-secondary h-4 w-4 opacity-30" />
                <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.duration} min
                </span>
              </div>

              {/* Zonas */}
              <div className="flex shrink-0 items-center gap-1.5 overflow-hidden">
                <MdLayers className="text-secondary h-4 w-4 shrink-0 opacity-30" />
                <span className="text-primary truncate font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.zones.map((z) => ZoneTypeLabels[z] || z).join(', ')}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex shrink-0 items-center gap-2">
              {task.status === 'WAITING_CONFIRMATION' && (
                <div className="flex items-center gap-2 pr-2">
                  <Button
                    className="h-8 px-3 text-[11px]"
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      const { confirmAgrochemicalTask } =
                        await import('@/actions/tasks/task-confirmation-actions')

                      handleAction(confirmAgrochemicalTask(task.id), 'Tarea autorizada')
                    }}
                  >
                    Confirmar
                  </Button>
                  <Button
                    className="h-8 px-3 text-[11px]"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const { cancelAgrochemicalTask } =
                        await import('@/actions/tasks/task-confirmation-actions')

                      handleAction(cancelAgrochemicalTask(task.id), 'Tarea cancelada')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              <ActionMenu items={menuItems} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Badge de Origen de Tarea
 *
 * Clasifica visualmente de dónde proviene la tarea:
 * - Rutina: Verde (Programación automática establecida).
 * - Diferida: Azul (Acción manual postergada por el usuario).
 * - Inferencia: Ámbar (Sugerencia inteligente del motor de reglas).
 */
function SourceBadge({ isRoutine }: { isRoutine?: boolean }) {
  if (isRoutine) {
    return (
      <Badge size="sm" variant="success">
        Rutina
      </Badge>
    )
  }
  if (isRoutine === false) {
    return (
      <Badge size="sm" variant="info">
        Diferida
      </Badge>
    )
  }

  return (
    <Badge size="sm" variant="warning">
      Inferencia
    </Badge>
  )
}

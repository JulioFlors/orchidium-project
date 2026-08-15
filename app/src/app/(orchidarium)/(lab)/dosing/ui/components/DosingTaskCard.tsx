'use client'

import type { DosingTaskItem } from '@/actions/lab'

import React from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCalendarClearOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoPencilOutline,
} from 'react-icons/io5'
import { TbBug, TbSpider } from 'react-icons/tb'
import { FaBacteria } from 'react-icons/fa'
import { GiSuperMushroom, GiChemicalDrop } from 'react-icons/gi'
import { PiSprayBottle, PiFlowerThin } from 'react-icons/pi'
import { GrCycle } from 'react-icons/gr'

import { StatusCircleIcon, ActionMenu, ActionMenuItem, Badge, ZoneBadges } from '@/components/ui'
import { TaskStatusBadge } from '@/app/(orchidarium)/(operations)/queue/ui/components/TaskStatusBadge'
import { formatTime12h } from '@/utils'
import {
  AgrochemicalPurposeLabels,
  AgrochemicalPurposeStyles,
  type AgrochemicalPurpose,
} from '@/config/mappings'

const PURPOSE_ICONS: Record<string, React.ReactNode> = {
  DESARROLLO: <PiSprayBottle />,
  FLORACION: <PiFlowerThin />,
  MANTENIMIENTO: <GrCycle />,
  ACARICIDA: <TbSpider />,
  BACTERICIDA: <FaBacteria />,
  FUNGICIDA: <GiSuperMushroom />,
  INSECTICIDA: <TbBug />,
}

interface DosingTaskCardProps {
  task: DosingTaskItem
  onStatusChange: (taskId: string, status: string, postponeHours?: number) => void
  onDelete: (task: DosingTaskItem) => void
  onCancel?: (task: DosingTaskItem) => void
  onEdit?: (task: DosingTaskItem) => void
}

/**
 * Tarjeta de Tarea de Dosificación de Agroquímicos (DosingTaskCard)
 *
 * Combina la estructura híbrida responsiva de QueueTaskCard y los estilos agrónomos de AgrochemicalCard.
 */
export function DosingTaskCard({
  task,
  onStatusChange,
  onDelete,
  onCancel,
  onEdit,
}: DosingTaskCardProps) {
  const dateObj = new Date(task.scheduledAt)
  const isPast = dateObj < new Date()

  const agroPurpose = (task.agrochemical?.purpose || 'DESARROLLO') as AgrochemicalPurpose
  const purposeStyle = AgrochemicalPurposeStyles[agroPurpose] || 'text-purple-500'
  const purposeLabel = AgrochemicalPurposeLabels[agroPurpose] || agroPurpose
  const purposeIcon = PURPOSE_ICONS[agroPurpose] || <GiChemicalDrop />

  const menuItems: ActionMenuItem[] = [
    ...(task.status === 'PENDING' || task.status === 'WAITING_CONFIRMATION'
      ? [
          ...(onEdit
            ? [
                {
                  label: 'Editar',
                  icon: <IoPencilOutline className="text-primary" />,
                  onClick: () => onEdit(task),
                },
              ]
            : []),
          {
            label: 'Marcar Completado',
            icon: <IoCheckmarkCircleOutline className="text-emerald-500" />,
            onClick: () => onStatusChange(task.id, 'COMPLETED'),
          },
          {
            label: 'Posponer 24h',
            icon: <IoCalendarClearOutline className="text-blue-400" />,
            onClick: () => onStatusChange(task.id, 'PENDING', 24),
          },
          {
            label: 'Cancelar Tarea',
            icon: <IoCloseOutline className="text-amber-500" />,
            onClick: () => (onCancel ? onCancel(task) : onStatusChange(task.id, 'CANCELLED')),
            variant: 'destructive' as const,
          },
        ]
      : []),
    {
      label: 'Eliminar Registro',
      icon: <IoTrashOutline className="text-red-500" />,
      onClick: () => onDelete(task),
      variant: 'destructive' as const,
    },
  ]

  const productName = task.agrochemical?.name || 'Insumo no especificado'
  const preparation = task.agrochemical?.preparation || 'Sin especificación de dosis'
  const routineName = task.routineName || 'Aplicación Manual Independiente'

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 tds-sm:flex-row tds-sm:items-center relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
    >
      <div className="tds-sm:grid tds-sm:grid-cols-[1fr_auto] tds-sm:items-center tds-sm:gap-x-6 flex flex-1 flex-col gap-4">
        {/* Lado Izquierdo: Contexto Insumo + Programa */}
        <div className="flex flex-row items-start gap-4">
          <StatusCircleIcon
            active={task.status === 'IN_PROGRESS'}
            className="tds-xs:flex hidden shrink-0"
            colorClassName={purposeStyle}
            icon={purposeIcon}
            size="md"
            variant="overlay"
          />

          <div className="flex flex-1 flex-col gap-y-1 overflow-hidden text-left">
            {/* Fila 1: Título de producto + Badges */}
            <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 tds-xs:flex contents">
              <h3
                className="text-primary order-1 text-[14px] leading-tight font-bold whitespace-normal break-words antialiased"
                title={productName}
              >
                {productName}
              </h3>
              <div className="order-3 flex items-center gap-2">
                <TaskStatusBadge
                  hasDbId={Boolean(task.id)}
                  status={
                    task.status as
                      'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'FAILED' | 'EXPIRED'
                  }
                />
                <Badge className={clsx('shrink-0', purposeStyle)} size="sm" variant="status">
                  {purposeLabel}
                </Badge>
              </div>
            </div>

            {/* Fila 2: Subtítulo de Programa / Etapa */}
            <div className="text-secondary tds-xs:mt-1 order-2 flex items-center gap-2 text-[11px] font-medium opacity-60">
              <span className="truncate">{routineName}</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Detalles Técnicos + Acciones */}
        <div className="tds-sm:border-0 tds-sm:pt-0 border-black-and-white/5 flex flex-1 flex-col gap-3 border-t border-dashed pt-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="tds-sm:justify-end flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3">
              {/* Medida / Preparación */}
              <div className="text-primary flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap">
                <GiChemicalDrop className="text-secondary h-4 w-4 opacity-40" />
                <span className="font-mono text-[11px] font-bold tracking-tight">
                  {preparation}
                </span>
              </div>

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
                <span className={clsx(isPast && task.status === 'PENDING' && 'opacity-30')}>
                  {formatTime12h(
                    task.status === 'COMPLETED' && task.executedAt
                      ? new Date(task.executedAt)
                      : dateObj,
                  )}
                </span>
              </div>

              {/* Zonas Involucradas */}
              <ZoneBadges zones={task.zones} />
            </div>

            {/* Menú de Acciones */}
            <div className="flex shrink-0 items-center gap-2">
              <ActionMenu items={menuItems} />
            </div>
          </div>

          {/* Observaciones / Notas (si existen) */}
          {task.notes && (
            <div className="border-black-and-white/5 mt-1 border-t border-dashed pt-2">
              <p className="text-secondary text-[11px] leading-relaxed italic opacity-60">
                {task.notes.replace(/\n/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

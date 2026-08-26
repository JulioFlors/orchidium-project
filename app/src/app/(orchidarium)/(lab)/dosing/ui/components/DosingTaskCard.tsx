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
import { MdOutlineStickyNote2 } from 'react-icons/md'
import { TbBug, TbSpider } from 'react-icons/tb'
import { FaBacteria } from 'react-icons/fa'
import { GiSuperMushroom, GiChemicalDrop } from 'react-icons/gi'
import { PiSprayBottle, PiFlowerThin } from 'react-icons/pi'
import { GrCycle } from 'react-icons/gr'

import { StatusCircleIcon, ActionMenu, ActionMenuItem, ZoneTags } from '@/components'
import { TaskStatusBadge } from '@/app/(orchidarium)/(operations)/queue/ui/components/TaskStatusBadge'
import { formatTime12h } from '@/utils'
import {
  AgrochemicalPurposeStyles,
  type AgrochemicalPurpose,
  formatAgrochemicalDosage,
} from '@/config'

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
 * Estructurada bajo el patrón canónico modular de FloweringRecordCard:
 * 1. Fila Principal Horizontal (Cabecera, Estado, Metadatos y Acciones).
 * 2. Sección de Notas Observacionales a ancho completo (Full-Width).
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
  const preparation = formatAgrochemicalDosage(task.agrochemical) || 'Sin especificación de dosis'
  const routineName = task.routineName || 'Aplicación Manual Independiente'

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex min-w-0 w-full flex-col gap-3.5 rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
    >
      {/* 1. Cabecera y Métricas Principales (Layout Horizontal en Desktop > tds-sm) */}
      <div className="tds-sm:flex-row tds-sm:items-center tds-sm:justify-between flex flex-col gap-3 min-w-0">
        {/* Lado Izquierdo: Contexto Insumo + Estado + Programa */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <StatusCircleIcon
            active={task.status === 'IN_PROGRESS'}
            className="h-8 w-8 text-xs tds-sm:h-9 tds-sm:w-9 shrink-0"
            colorClassName={purposeStyle}
            icon={purposeIcon}
            size="md"
            variant="overlay"
          />

          <div className="flex flex-col min-w-0 overflow-hidden text-left">
            {/* Fila 1: Título de producto + Badge de Estado de Tarea */}
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-primary text-[14px] leading-tight font-bold truncate"
                title={productName}
              >
                {productName}
              </h3>
              <TaskStatusBadge context="dosing" hasDbId={Boolean(task.id)} status={task.status} />
            </div>

            {/* Fila 2: Subtítulo de Programa / Etapa */}
            <div className="text-secondary flex items-center gap-2 text-[11px] font-medium opacity-60 mt-0.5">
              <span className="truncate">{routineName}</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Detalles Técnicos + Menú de Acciones */}
        <div className="tds-sm:border-0 tds-sm:pt-0 border-black-and-white/5 flex items-center justify-between tds-sm:justify-end gap-x-6 gap-y-3 border-t border-dashed pt-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Medida / Preparación */}
            <div className="text-primary flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap">
              <GiChemicalDrop className="text-secondary h-4 w-4 opacity-40" />
              <span className="font-mono text-[11px] font-bold tracking-tight">{preparation}</span>
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
            <ZoneTags zones={task.zones} />
          </div>

          {/* Menú de Acciones */}
          <div className="flex shrink-0 items-center gap-2">
            <ActionMenu items={menuItems} />
          </div>
        </div>
      </div>

      {/* 2. Sección de Notas Observacionales (Renderizado Condicional a Ancho Completo) */}
      {task.notes && task.notes.trim().length > 0 && (
        <div className="border-black-and-white/5 mt-0.5 border-t border-dashed pt-2.5 w-full">
          <div className="flex items-start gap-2">
            <MdOutlineStickyNote2 className="text-secondary mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
            <p className="text-secondary text-[12px] leading-relaxed italic opacity-80 whitespace-pre-wrap break-words">
              {task.notes}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

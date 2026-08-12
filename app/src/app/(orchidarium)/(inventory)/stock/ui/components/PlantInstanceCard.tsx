'use client'

import type { PotSize, PlantStatus } from '@package/database/enums'

import { motion } from 'motion/react'
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoGitBranchOutline,
  IoFlowerOutline,
} from 'react-icons/io5'
import { MdEdit, MdDelete, MdLocalFlorist } from 'react-icons/md'

import { StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'

interface Location {
  id: string
  zone: string
  table: string
}

interface FloweringEvent {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
  notes?: string | null
}

export interface PlantInstance {
  id: string
  currentSize: PotSize
  pottingDate?: Date | string | null
  status: PlantStatus
  location?: Location | null
  origin?: string | null
  FloweringEvent?: FloweringEvent[]
}

interface PlantInstanceCardProps {
  plant: PlantInstance
  potSizeLabels: Record<PotSize, string>
  zoneLabels: Record<string, string>
  onEdit: (plant: PlantInstance) => void
  onFlowering: (plant: PlantInstance) => void
  onDelete: (plant: PlantInstance) => void
}

function formatPottingDate(dateVal?: Date | string | null) {
  if (!dateVal) return null
  const str = typeof dateVal === 'string' ? dateVal : dateVal.toISOString()
  const datePart = str.split('T')[0]
  const parts = datePart.split('-')

  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  const localDate = new Date(year, month - 1, day, 12, 0, 0)

  return localDate.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PlantInstanceCard({
  plant,
  potSizeLabels,
  zoneLabels,
  onEdit,
  onFlowering,
  onDelete,
}: PlantInstanceCardProps) {
  const isMother = plant.status === 'MOTHER'
  const activeFlowering = plant.FloweringEvent?.find((e) => !e.endDate)
  const hasActiveFlowering = !!activeFlowering
  const zoneAlias = plant.location?.zone
    ? zoneLabels[plant.location.zone] || plant.location.zone
    : 'Sin Ubicación'

  const formattedDate = formatPottingDate(plant.pottingDate)

  const potCode = potSizeLabels[plant.currentSize] || plant.currentSize
  const originText = plant.origin || 'Establecida'

  // Determinación de glowVariant semántico
  const glowVariant = isMother
    ? 'red'
    : hasActiveFlowering
      ? 'pink'
      : plant.status === 'AVAILABLE'
        ? 'violet'
        : 'green'

  const menuItems: ActionMenuItem[] = [
    {
      label: 'Editar Planta',
      icon: <MdEdit />,
      onClick: () => onEdit(plant),
    },
    {
      label: hasActiveFlowering ? 'Finalizar Floración' : 'Registrar Floración',
      icon: <MdLocalFlorist className="text-pink-500" />,
      onClick: () => onFlowering(plant),
    },
    {
      label: 'Eliminar Planta',
      icon: <MdDelete />,
      onClick: () => onDelete(plant),
      variant: 'destructive',
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group relative flex min-w-0 w-full flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all hover:bg-hover-overlay"
      initial={{ opacity: 0, y: 5 }}
    >
      {/* 1. Cabecera Limpia (StatusCircleIcon + Código ID) */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <StatusCircleIcon
            className="h-8 w-8 text-xs tds-sm:h-10 tds-sm:w-10 tds-sm:text-sm shrink-0 font-mono font-extrabold"
            glowVariant={glowVariant}
            icon={
              <span className="font-mono text-[10px] tds-sm:text-xs font-black">{potCode}</span>
            }
            size="md"
            variant="glow"
          />
          <div className="flex flex-col min-w-0 overflow-hidden text-left">
            <h3 className="text-primary truncate font-mono text-xs tds-sm:text-[15px] font-bold leading-tight">
              #{plant.id.slice(-8).toUpperCase()}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Sección Inferior con Línea Punteada (Metadatos + ActionMenu) */}
      <div className="border-black-and-white/5 mt-1 border-t border-dashed pt-4 min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 text-xs min-w-0 flex-1">
            {/* Madre (si aplica) */}
            {isMother && (
              <div className="text-secondary flex shrink-0 items-center gap-1.5 font-medium">
                <IoFlowerOutline className="h-4 w-4 text-purple-500 shrink-0" />
                <span>Madre</span>
              </div>
            )}

            {/* Floración (si aplica) */}
            {hasActiveFlowering && (
              <div className="text-secondary flex shrink-0 items-center gap-1.5 font-medium">
                <MdLocalFlorist className="h-4 w-4 text-pink-500 shrink-0" />
                <span>Floración</span>
              </div>
            )}

            {/* Ubicación */}
            <div className="text-secondary flex shrink-0 items-center gap-1.5 font-medium">
              <IoLocationOutline className="h-4 w-4 text-emerald-500 opacity-90 shrink-0" />
              <span className="truncate">{zoneAlias}</span>
            </div>

            {/* Origen */}
            <div className="text-secondary flex shrink-0 items-center gap-1.5 font-medium">
              <IoGitBranchOutline className="h-4 w-4 text-blue-500 opacity-80 shrink-0" />
              <span className="truncate">{originText}</span>
            </div>

            {/* Fecha (si existe) */}
            {formattedDate && (
              <div className="text-secondary flex shrink-0 items-center gap-1.5 font-medium">
                <IoCalendarOutline className="h-4 w-4 opacity-60 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0">
            <ActionMenu hoverOnly={false} items={menuItems} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

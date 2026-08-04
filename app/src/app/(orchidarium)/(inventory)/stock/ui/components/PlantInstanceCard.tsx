import type { PotSize, PlantStatus } from '@package/database/enums'

import { motion } from 'motion/react'
import { PiMapPinFill, PiCalendarFill } from 'react-icons/pi'
import { MdEdit, MdDelete, MdLocalFlorist } from 'react-icons/md'

import { Badge, ActionMenu, StatusCircleIcon } from '@/components'
import { PotSizeDimensions } from '@/config/mappings'

interface Location {
  id: string
  zone: string
  table: string
}

interface FloweringEvent {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
}

export interface PlantInstance {
  id: string
  currentSize: PotSize
  pottingDate?: Date | string | null
  status: PlantStatus
  location?: Location | null
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

export function PlantInstanceCard({
  plant,
  potSizeLabels,
  zoneLabels,
  onEdit,
  onFlowering,
  onDelete,
}: PlantInstanceCardProps) {
  const isMother = plant.status === 'MOTHER'
  const hasActiveFlowering = plant.FloweringEvent && plant.FloweringEvent.length > 0
  const zoneAlias = plant.location?.zone
    ? zoneLabels[plant.location.zone] || plant.location.zone
    : 'Sin Ubicación'

  const formattedDate = plant.pottingDate
    ? new Date(plant.pottingDate).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Sin Fecha'

  const potCode = potSizeLabels[plant.currentSize] || plant.currentSize
  const potDim = PotSizeDimensions[plant.currentSize] || ''

  // Determinación de glowVariant semántico
  // Madres -> red (vinotinto), Floración -> pink (magenta), Tienda -> violet (lila)
  const glowVariant = isMother
    ? 'red'
    : hasActiveFlowering
      ? 'pink'
      : plant.status === 'AVAILABLE'
        ? 'violet'
        : 'green'

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay relative flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all duration-300"
      initial={{ opacity: 0, y: 5 }}
    >
      <div className="flex flex-col gap-3">
        {/* Cabecera con StatusCircleIcon y ActionMenu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <StatusCircleIcon
              className="shrink-0 font-mono text-xs font-extrabold"
              glowVariant={glowVariant}
              icon={<span className="font-mono text-xs font-black">{potCode}</span>}
              size="md"
              variant="glow"
            />
            <div className="flex min-w-0 flex-col">
              <span className="text-primary truncate font-mono text-xs font-bold tracking-tight">
                #{plant.id.slice(-8).toUpperCase()}
              </span>
              <span className="text-secondary text-[11px] font-semibold opacity-70">
                {potCode} {potDim && `• ${potDim}`}
              </span>
            </div>
          </div>

          <ActionMenu
            items={[
              {
                label: 'Editar Planta',
                icon: <MdEdit />,
                onClick: () => onEdit(plant),
              },
              {
                label: 'Registrar Floración',
                icon: <MdLocalFlorist className="text-pink-500" />,
                onClick: () => onFlowering(plant),
              },
              {
                label: 'Eliminar Planta',
                icon: <MdDelete />,
                onClick: () => onDelete(plant),
                variant: 'destructive',
              },
            ]}
          />
        </div>

        {/* Badges de Estado Semántico */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {isMother && (
            <Badge className="border border-rose-500/20 bg-rose-500/10 text-[10px] font-bold text-rose-700 dark:text-rose-400">
              Madre
            </Badge>
          )}
          {hasActiveFlowering && (
            <Badge className="border border-fuchsia-500/20 bg-fuchsia-500/10 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
              Floración
            </Badge>
          )}
          {!isMother && plant.status === 'AVAILABLE' && (
            <Badge className="text-[10px] font-bold" variant="purple">
              Tienda
            </Badge>
          )}
        </div>

        {/* Ubicación y Fecha de Siembra */}
        <div className="border-input-outline flex flex-col gap-1.5 border-t pt-2.5">
          <div className="flex items-center gap-2">
            <PiMapPinFill className="h-3.5 w-3.5 shrink-0 text-emerald-500 opacity-80" />
            <span className="text-primary truncate text-xs font-semibold">{zoneAlias}</span>
          </div>

          <div className="flex items-center gap-2">
            <PiCalendarFill className="text-secondary h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="text-secondary text-xs font-medium opacity-70">
              Siembra: {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

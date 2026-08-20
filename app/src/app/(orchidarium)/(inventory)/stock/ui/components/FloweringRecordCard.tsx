'use client'

import { motion } from 'motion/react'
import {
  MdLocalFlorist,
  MdOutlineStickyNote2,
  MdEventAvailable,
  MdCheckCircleOutline,
} from 'react-icons/md'
import { IoCalendarOutline, IoTimeOutline } from 'react-icons/io5'

import { StatusCircleIcon, Badge, Button } from '@/components'

export interface FloweringRecord {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
  notes?: string | null
  durationDays?: number
  isActive?: boolean
  daysElapsed?: number
}

interface FloweringRecordCardProps {
  record: FloweringRecord
  onCloseFlowering?: (record: FloweringRecord) => void
}

function formatDate(dateVal: Date | string) {
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal

  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function FloweringRecordCard({ record, onCloseFlowering }: FloweringRecordCardProps) {
  const isOngoing = !record.endDate
  const formattedStart = formatDate(record.startDate)
  const formattedEnd = record.endDate ? formatDate(record.endDate) : null

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex min-w-0 w-full flex-col gap-3.5 rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
    >
      {/* 1. Cabecera y Métricas Principales (Layout Horizontal en Desktop > tds-sm) */}
      <div className="tds-sm:flex-row tds-sm:items-center tds-sm:justify-between flex flex-col gap-3 min-w-0">
        {/* Lado Izquierdo: Icono + Estado + Rango de Fechas */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <StatusCircleIcon
            active={isOngoing}
            className="h-8 w-8 text-xs tds-sm:h-9 tds-sm:w-9 shrink-0"
            colorClassName={
              isOngoing
                ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }
            icon={
              isOngoing ? (
                <MdLocalFlorist className="size-4" />
              ) : (
                <MdCheckCircleOutline className="size-4" />
              )
            }
            size="md"
            variant="overlay"
          />

          <div className="flex flex-col min-w-0 overflow-hidden text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-primary text-[14px] font-bold leading-tight truncate">
                {isOngoing ? 'Floración en Curso' : 'Floración Completada'}
              </span>
              <Badge
                className={
                  isOngoing
                    ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 text-[10px]'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]'
                }
                size="sm"
              >
                {isOngoing ? 'Activa' : 'Finalizada'}
              </Badge>
            </div>

            <div className="text-secondary flex items-center gap-1.5 text-[11px] font-medium opacity-70 mt-0.5">
              <IoCalendarOutline className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span>
                {isOngoing
                  ? `Iniciada el ${formattedStart}`
                  : `${formattedStart} - ${formattedEnd}`}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Duración / Días Transcurridos + Acción Rápida */}
        <div className="tds-sm:border-0 tds-sm:pt-0 border-black-and-white/5 flex items-center justify-between tds-sm:justify-end gap-4 border-t border-dashed pt-3">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
            <IoTimeOutline className="h-4 w-4 text-fuchsia-500 shrink-0 opacity-80" />
            <span>
              {isOngoing
                ? `${record.daysElapsed ?? 0} ${(record.daysElapsed ?? 0) === 1 ? 'día transcurrido' : 'días transcurridos'}`
                : `${record.durationDays ?? 0} ${(record.durationDays ?? 0) === 1 ? 'día de flor' : 'días de flor'}`}
            </span>
          </div>

          {isOngoing && onCloseFlowering && (
            <Button size="sm" variant="secondary" onClick={() => onCloseFlowering(record)}>
              <MdEventAvailable className="mr-1.5 size-4 text-fuchsia-500" />
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* 2. Sección de Notas Observacionales (Renderizado Condicional a Ancho Completo) */}
      {record.notes && record.notes.trim().length > 0 && (
        <div className="border-black-and-white/5 mt-0.5 border-t border-dashed pt-2.5 w-full">
          <div className="flex items-start gap-2">
            <MdOutlineStickyNote2 className="text-secondary mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
            <p className="text-secondary text-[12px] leading-relaxed italic opacity-80 whitespace-pre-wrap break-words">
              {record.notes}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

'use client'

import { motion } from 'motion/react'
import { clsx } from 'clsx'
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoHourglassOutline,
  IoShieldCheckmarkOutline,
  IoRocketOutline,
  IoCalendarOutline,
} from 'react-icons/io5'
import { RxStopwatch } from 'react-icons/rx'
import { MdLayers } from 'react-icons/md'
import { LuRadioTower } from 'react-icons/lu'
import { HiOutlineCog } from 'react-icons/hi'
import { TaskPurpose, TaskStatus, TaskSource, ZoneType } from '@package/database/enums'

import { Badge, StatusCircleIcon } from '@/components'
import { formatTime12h } from '@/utils'
import {
  TaskPurposeLabels,
  TaskSourceLabels,
  TaskStatusLabels,
  TaskStatusStyles,
  ZoneTypeLabels,
} from '@/config/mappings'

interface HistoryTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  executedAt: string | null
  status: TaskStatus
  source: TaskSource
  notes: string | null
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <IoTimeOutline />,
  AUTHORIZED: <IoShieldCheckmarkOutline />,
  DISPATCHED: <IoRocketOutline />,
  ACKNOWLEDGED: <LuRadioTower />,
  CONFIRMED: <LuRadioTower />,
  IN_PROGRESS: <HiOutlineCog />,
  COMPLETED: <IoCheckmarkCircleOutline />,
  FAILED: <IoCloseCircleOutline />,
  EXPIRED: <IoCloseCircleOutline />,
  CANCELLED: <IoWarningOutline />,
  SKIPPED: <IoHourglassOutline />,
  WAITING_CONFIRMATION: <IoHourglassOutline className="animate-pulse" />,
}

export function HistoryTaskCard({
  task,
  onClickAction,
}: {
  task: HistoryTask
  onClickAction: (task: HistoryTask) => void
}) {
  const actionLabel = TaskPurposeLabels[task.purpose] || 'Desconocido'
  const statusLabel = TaskStatusLabels[task.status] || task.status
  const statusStyle = TaskStatusStyles[task.status] || 'text-secondary'
  const sourceLabel = TaskSourceLabels[task.source] || task.source

  return (
    <motion.div
      className="bg-surface border-input-outline group hover:bg-hover-overlay tds-sm:flex-row tds-sm:items-center relative flex cursor-pointer flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all"
      role="button"
      tabIndex={0}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClickAction(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClickAction(task)
        }
      }}
    >
      <div className="tds-sm:grid tds-sm:grid-cols-[1fr_auto] tds-sm:items-center tds-sm:gap-x-6 flex flex-1 flex-col gap-4">
        <div className="flex flex-row items-start gap-4">
          <StatusCircleIcon
            className="tds-xs:flex hidden"
            colorClassName={statusStyle}
            icon={STATUS_ICONS[task.status]}
            variant="vibrant"
          />

          <div className="flex flex-1 flex-col overflow-hidden text-left">
            <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 flex flex-col gap-y-1">
              <h3 className="text-primary tds-xs:order-1 tds-xs:truncate tds-xs:whitespace-nowrap order-2 text-[15px] leading-tight font-bold whitespace-normal">
                {actionLabel}
              </h3>
              <div className="tds-xs:order-2 order-1 flex">
                <Badge className={clsx('shrink-0', statusStyle)} size="sm" variant="status">
                  {statusLabel}
                </Badge>
              </div>
            </div>

            <div className="text-secondary order-3 mt-1 flex items-center gap-2 text-[11px] font-medium opacity-60">
              <span>{sourceLabel}</span>
              <span className="font-mono">#{task.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>

        <div className="tds-sm:items-end tds-sm:border-0 tds-sm:pt-0 border-black-and-white/5 flex flex-col gap-3 border-t border-dashed pt-4">
          <div className="tds-sm:justify-end flex flex-row flex-wrap items-center gap-x-6 gap-y-3">
            {/* Fecha y Hora */}
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-primary flex items-center gap-1.5 font-bold whitespace-nowrap">
                <IoCalendarOutline className="h-4 w-4 opacity-40" />
                <span className="text-[11px] tracking-tight uppercase">
                  {new Date(task.scheduledAt).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>

              <div className="text-primary flex items-center gap-1.5 font-mono text-xs font-bold tracking-tighter whitespace-nowrap uppercase">
                <IoTimeOutline className="h-4 w-4 opacity-40" />
                <span
                  className={clsx(
                    ['PENDING', 'WAITING_CONFIRMATION'].includes(task.status) && 'opacity-30',
                  )}
                >
                  {formatTime12h(
                    (['PENDING', 'WAITING_CONFIRMATION'].includes(task.status)
                      ? task.scheduledAt
                      : task.executedAt) || task.scheduledAt,
                  )}
                </span>
              </div>
            </div>

            {/* Duración y Zonas */}
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <RxStopwatch className="text-secondary h-4 w-4 opacity-30" />
                <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.duration} min
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-hidden">
                <MdLayers className="text-secondary h-4 w-4 shrink-0 opacity-30" />
                <span className="text-primary truncate font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.zones.map((z) => ZoneTypeLabels[z] || z).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {task.notes && (
            <div className="tds-sm:hidden border-black-and-white/5 mt-1 border-t border-dashed pt-2">
              <p className="text-secondary text-[11px] leading-relaxed italic opacity-60">
                {task.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

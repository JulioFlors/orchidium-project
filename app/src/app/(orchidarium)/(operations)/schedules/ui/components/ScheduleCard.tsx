'use client'

import React from 'react'
import { clsx } from 'clsx'
import { IoTimeOutline, IoSettingsOutline, IoCloseOutline } from 'react-icons/io5'
import { RxStopwatch } from 'react-icons/rx'
import { MdLayers } from 'react-icons/md'

import { StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components/ui'
import { TaskPurposeLabels, ZoneTypeLabels } from '@/config/mappings'

interface AutomationSchedule {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  cronTrigger: string
  durationMinutes: number
  isEnabled: boolean
  zones: string[]
}

interface ScheduleCardProps {
  schedule: AutomationSchedule
  onEdit: (schedule: AutomationSchedule) => void
  onDelete: (id: string) => void
  onToggle: (id: string, currentStatus: boolean) => void
  icon: React.ReactNode
  colorClassName: string
  isLoading?: boolean
}

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onToggle,
  icon,
  colorClassName,
  isLoading = false,
}: ScheduleCardProps) {
  // Helper para convertir el formato Cron "0 16 * * *" a "16:00" y luego a AM/PM
  const formatCronTime = (cronStr: string) => {
    const parts = cronStr.split(' ')

    if (parts.length < 2) return '--:--'
    const minutes = parts[0].padStart(2, '0')
    const hours = parseInt(parts[1], 10)

    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12

    return `${hours12}:${minutes} ${ampm}`
  }

  const menuItems: ActionMenuItem[] = [
    {
      label: 'Editar',
      icon: <IoSettingsOutline />,
      onClick: () => onEdit(schedule),
    },
    {
      label: 'Eliminar',
      icon: <IoCloseOutline />,
      onClick: () => onDelete(schedule.id),
      variant: 'destructive',
    },
  ]

  return (
    <div
      className={clsx(
        'bg-surface border-input-outline group relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all',
        !schedule.isEnabled && 'opacity-60 grayscale-[0.5]',
        isLoading && 'pointer-events-none opacity-50',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 overflow-hidden">
          <StatusCircleIcon colorClassName={colorClassName} icon={icon} variant="overlay" />
          <div className="flex flex-col overflow-hidden text-left">
            <h3
              className="text-primary text-[15px] leading-tight font-bold whitespace-normal"
              title={schedule.name}
            >
              {schedule.name}
            </h3>
            <span className="text-secondary text-[11px] font-medium opacity-60">
              {TaskPurposeLabels[schedule.purpose] || schedule.purpose}
            </span>
          </div>
        </div>

        <div className="flex pt-0.5">
          {/* Toggle Switch */}
          <label className="relative inline-flex scale-90 cursor-pointer items-center pr-1">
            <span className="sr-only">Toggle {schedule.name}</span>
            <input
              checked={schedule.isEnabled}
              className="peer sr-only"
              disabled={isLoading}
              type="checkbox"
              onChange={() => onToggle(schedule.id, schedule.isEnabled)}
            />
            <div className="peer peer-checked:bg-action active:bg-action/90 peer-focus-visible:ring-black-and-white ring-offset-canvas h-5 w-9 rounded-full bg-black/20 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-white/20" />
          </label>
        </div>
      </div>

      <div className="border-black-and-white/5 mt-1 border-t border-dashed pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-2">
            {/* Hora de ejecución */}
            <div className="text-primary flex shrink-0 items-center gap-1.5 font-mono text-xs font-bold tracking-tighter whitespace-nowrap uppercase">
              <IoTimeOutline className="h-4 w-4 opacity-40" />
              <span>{formatCronTime(schedule.cronTrigger)}</span>
            </div>

            {/* Duración */}
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <RxStopwatch className="text-secondary h-4 w-4 opacity-30" />
              <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
                {schedule.durationMinutes} min
              </span>
            </div>

            {/* Zona */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              <MdLayers className="text-secondary h-4 w-4 shrink-0 opacity-30" />
              <span className="text-primary truncate font-mono text-[11px] font-bold tracking-tight uppercase">
                {schedule.zones
                  .map((z) => ZoneTypeLabels[z as keyof typeof ZoneTypeLabels] || z)
                  .join(', ')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0">
            <ActionMenu items={menuItems} />
          </div>
        </div>
      </div>
    </div>
  )
}

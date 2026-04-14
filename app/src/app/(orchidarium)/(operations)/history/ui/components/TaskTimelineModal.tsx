import {
  IoCheckmarkCircle,
  IoTimeOutline,
  IoRadioOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoRocketOutline,
  IoHourglassOutline,
} from 'react-icons/io5'
import { ReactNode } from 'react'
import { motion } from 'motion/react'

import { Modal } from '@/components/ui'
import { TaskStatusLabels } from '@/config/mappings'
import { formatTime12h } from '@/utils'

const STATUS_ICONS: Record<string, ReactNode> = {
  // 1. Fase de Gestación (Azules y Violetas)
  PENDING: <IoTimeOutline className="text-blue-500" />,
  WAITING_CONFIRMATION: <IoHourglassOutline className="animate-pulse text-violet-500" />,

  // 2. Fase de Conectividad (Indigo y Cian)
  DISPATCHED: <IoRocketOutline className="text-indigo-500" />,
  ACKNOWLEDGED: <IoRadioOutline className="text-cyan-500" />,
  CONFIRMED: <IoRadioOutline className="text-cyan-500" />,

  // 3. Fase de Acción (Verdes)
  AUTHORIZED: <IoShieldCheckmarkOutline className="text-lime-500" />,
  IN_PROGRESS: <IoRadioOutline className="text-emerald-500" />,
  COMPLETED: <IoCheckmarkCircle className="text-green-600" />,

  // 4. Fase Terminal (Gris, Naranja y Rojos)
  SKIPPED: <IoHourglassOutline className="text-slate-400" />,
  CANCELLED: <IoAlertCircleOutline className="text-orange-600" />,
  FAILED: <IoAlertCircleOutline className="text-red-500" />,
  EXPIRED: <IoAlertCircleOutline className="text-red-500" />,
}

interface TaskEvent {
  id: string
  status: string
  timestamp: string | Date
  notes: string | null
}

interface TaskTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  taskName: string
  events: TaskEvent[]
  isLoading?: boolean
  scheduledAt?: string | Date
}

export function TaskTimelineModal({
  isOpen,
  onClose,
  taskName,
  events,
  isLoading,
  scheduledAt,
}: TaskTimelineModalProps) {
  let subtitleContent: ReactNode = null

  if (scheduledAt) {
    const d = new Date(scheduledAt)
    const dateStr = d.toLocaleDateString('es-VE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

    subtitleContent = `${dateStr} ${formatTime12h(d)}`
  }

  return (
    <Modal
      isOpen={isOpen}
      subtitle={subtitleContent}
      title={taskName || 'Línea de Tiempo'}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-secondary text-sm">Cargando eventos</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-secondary py-12 text-center text-sm italic">
          No hay eventos detallados registrados para esta tarea.
        </div>
      ) : (
        <div className="before:bg-input-outline relative space-y-8 before:absolute before:top-2 before:left-3 before:h-[calc(100%-16px)] before:w-px">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              animate={{ opacity: 1, x: 0 }}
              className="relative pl-10"
              initial={{ opacity: 0, x: -10 }}
              transition={{ delay: idx * 0.05 }}
            >
              {/* Dot Icon */}
              <div className="bg-surface border-input-outline absolute top-1 left-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-sm shadow-sm">
                {STATUS_ICONS[event.status] || <IoTimeOutline />}
              </div>

              {/* Body */}
              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-primary text-sm font-bold tracking-tight">
                    {TaskStatusLabels[event.status as keyof typeof TaskStatusLabels] ||
                      event.status}
                  </span>
                  <span className="text-secondary font-mono text-[10px] opacity-60">
                    {formatTime12h(event.timestamp, true)}
                  </span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  {event.notes || 'Cambio de estado automático.'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  )
}

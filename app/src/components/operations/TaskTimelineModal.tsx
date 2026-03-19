import {
  IoCheckmarkCircle,
  IoTimeOutline,
  IoRadioOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoRocketOutline,
} from 'react-icons/io5'
import { motion } from 'motion/react'

import { Modal } from '@/components/ui'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <IoTimeOutline className="text-zinc-500" />,
  AUTHORIZED: <IoShieldCheckmarkOutline className="text-orange-500" />,
  DISPATCHED: <IoRocketOutline className="text-blue-500" />,
  ACKNOWLEDGED: <IoRadioOutline className="text-cyan-500" />,
  CONFIRMED: <IoRadioOutline className="text-cyan-500" />,
  IN_PROGRESS: <IoRadioOutline className="animate-pulse text-amber-500" />,
  COMPLETED: <IoCheckmarkCircle className="text-emerald-500" />,
  FAILED: <IoAlertCircleOutline className="text-red-500" />,
  CANCELLED: <IoAlertCircleOutline className="text-zinc-400" />,
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
}

export function TaskTimelineModal({
  isOpen,
  onClose,
  taskName,
  events,
  isLoading,
}: TaskTimelineModalProps) {
  return (
    <Modal
      footer={
        <button
          className="text-primary text-sm font-semibold transition-opacity hover:opacity-80"
          type="button"
          onClick={onClose}
        >
          Cerrar
        </button>
      }
      isOpen={isOpen}
      subtitle={taskName}
      title="Línea de Tiempo"
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-secondary text-sm">Cargando eventos...</span>
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
                    {event.status}
                  </span>
                  <span className="text-secondary font-mono text-[10px] opacity-60">
                    {new Date(event.timestamp).toLocaleTimeString('es-VE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
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

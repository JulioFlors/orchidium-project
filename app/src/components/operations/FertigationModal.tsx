'use client'

import { motion, AnimatePresence } from 'motion/react'
import { IoCloseOutline, IoWarningOutline } from 'react-icons/io5'

interface WaitingTask {
  id: string
  purpose: string
  scheduledAt: Date | string
  schedule?: { name: string } | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  waitingTasks: WaitingTask[]
  isSubmitting: boolean
  onConfirmRelease: (taskIds: string[]) => void
  onConfirmManual: () => void
}

export function FertigationModal({
  isOpen,
  onClose,
  waitingTasks,
  isSubmitting,
  onConfirmRelease,
  onConfirmManual,
}: Props) {
  const hasWaitingTasks = waitingTasks && waitingTasks.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="fertigation-modal-overlay"
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key="fertigation-modal"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-input-outline relative w-full max-w-md rounded-xl border p-6 shadow-xl"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="text-secondary hover:text-primary focus-visible:ring-accessibility absolute top-4 right-4 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
              type="button"
              onClick={onClose}
            >
              <IoCloseOutline className="h-6 w-6" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <IoWarningOutline className="text-xl text-amber-500" />
              </div>
              <h3 className="text-primary text-xl font-bold">Confirmación de Fitosanitarios</h3>
            </div>

            <div className="text-secondary flex flex-col gap-4 text-sm">
              <p>
                La aspersión de agroquímicos requiere comprobación visual y manual por normativas de
                seguridad.
                <strong>
                  {' '}
                  ¿Confirmas que los tanques de mezcla contienen el producto preparado y listo para
                  su uso?
                </strong>
              </p>

              {hasWaitingTasks ? (
                <div className="bg-action/5 border-action/20 mt-2 rounded-md border p-4">
                  <p className="text-primary mb-2 font-semibold">
                    Rutinas en espera de confirmación:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    {waitingTasks.map((t) => (
                      <li key={t.id}>
                        {t.schedule?.name || 'Rutina Desconocida'} ({t.purpose}) -{' '}
                        {new Date(t.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs italic">
                    Al aceptar, las rutinas detenidas serán liberadas y el microservicio las
                    ejecutará inmediatamente.
                  </p>
                </div>
              ) : (
                <div className="mt-2 rounded-md bg-black/5 p-4 dark:bg-white/5">
                  <p>
                    No hay rutinas programadas en espera. Se ejecutará un ciclo de aspersión manual
                    de <strong>5 minutos</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="focus-visible:ring-accessibility rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 dark:hover:bg-white/5"
                disabled={isSubmitting}
                type="button"
                onClick={onClose}
              >
                Cancelar
              </button>

              {hasWaitingTasks ? (
                <button
                  className="focus-visible:ring-accessibility rounded-md bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => onConfirmRelease(waitingTasks.map((t) => t.id))}
                >
                  {isSubmitting ? 'Liberando...' : 'Liberar Rutinas Programadas'}
                </button>
              ) : (
                <button
                  className="bg-action hover:bg-action/90 focus-visible:ring-accessibility rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="button"
                  onClick={onConfirmManual}
                >
                  {isSubmitting ? 'Iniciando...' : 'Comenzar Aspersión Manual'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

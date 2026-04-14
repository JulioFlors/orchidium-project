'use client'

import { IoWarningOutline } from 'react-icons/io5'

import { Modal } from '@/components'
import { formatTime12h } from '@/utils'

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
    <Modal
      icon={
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <IoWarningOutline className="text-lg text-amber-500" />
        </div>
      }
      isOpen={isOpen}
      size="md"
      title="Confirmación de Fitosanitarios"
      onClose={onClose}
    >
      <div className="text-secondary flex flex-col gap-4 text-sm">
        <p>
          La aspersión de agroquímicos requiere comprobación visual y manual por normativas de
          seguridad.
          <strong>
            {' '}
            ¿Confirmas que los tanques de mezcla contienen el producto preparado y listo para su
            uso?
          </strong>
        </p>

        {hasWaitingTasks ? (
          <div className="bg-action/5 border-action/20 mt-2 rounded-md border p-4">
            <p className="text-primary mb-2 font-semibold">Rutinas en espera de confirmación:</p>
            <ul className="list-disc space-y-1 pl-5">
              {waitingTasks.map((t) => (
                <li key={t.id}>
                  {t.schedule?.name || 'Rutina Desconocida'} ({t.purpose}) -{' '}
                  {formatTime12h(t.scheduledAt)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs italic">
              Al aceptar, las rutinas detenidas serán liberadas y el microservicio las ejecutará
              inmediatamente.
            </p>
          </div>
        ) : (
          <div className="mt-2 rounded-md bg-black/5 p-4 dark:bg-white/5">
            <p>
              No hay rutinas programadas en espera. Se ejecutará un ciclo de aspersión manual de{' '}
              <strong>5 minutos</strong>.
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
            {isSubmitting ? 'Liberando' : 'Liberar Rutinas Programadas'}
          </button>
        ) : (
          <button
            className="bg-action hover:bg-action/90 focus-visible:ring-accessibility rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="button"
            onClick={onConfirmManual}
          >
            {isSubmitting ? 'Iniciando' : 'Comenzar Aspersión Manual'}
          </button>
        )}
      </div>
    </Modal>
  )
}

'use client'

import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { PlannerCircuitSelect, PlannerZoneSelect, PlannerDurationInput } from './PlannerInputs'

import { Modal } from '@/components/ui'

// Zod Schema idéntico al del planificador
const plannerSchema = z.object({
  purpose: z.enum(
    ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
    { errorMap: () => ({ message: 'Debes seleccionar un circuito' }) },
  ),
  zone: z.literal('ZONA_A', {
    errorMap: () => ({ message: 'La única zona habilitada es la ZONA A' }),
  }),
  duration: z.coerce
    .number({ invalid_type_error: 'Debe ser un número válido' })
    .min(1, 'Mínimo 1 minuto')
    .max(25, 'Máximo 25 minutos'),
  scheduledAt: z
    .string()
    .min(1, 'Debes seleccionar fecha y hora')
    .refine(
      (val) => {
        const selectedDate = new Date(val).getTime()
        const now = new Date().getTime()

        return selectedDate > now
      },
      {
        message: 'No puedes programar en el pasado',
      },
    ),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

export type PlannerFormInputs = z.infer<typeof plannerSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmitSuccess: (data: PlannerFormInputs) => Promise<void>
}

export function DeferredTaskModal({ isOpen, onClose, onSubmitSuccess }: Props) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlannerFormInputs>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      zone: 'ZONA_A',
      scheduledAt: '',
      notes: '',
    },
  })

  // Limpiar el form cuando se cierra el modal
  const handleClose = () => {
    reset()
    onClose()
  }

  // Interceptar el submit exitoso
  const submitHandler = async (data: PlannerFormInputs) => {
    await onSubmitSuccess(data)
    handleClose()
  }

  return (
    <Modal
      icon={<MdOutlineHistoryToggleOff className="h-5 w-5" />}
      isOpen={isOpen}
      title="Nueva Tarea Diferida"
      onClose={handleClose}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(submitHandler)}>
        <div className="grid grid-cols-2 gap-4">
          <PlannerCircuitSelect control={control} error={errors.purpose?.message} name="purpose" />
          <PlannerZoneSelect control={control} error={errors.zone?.message} name="zone" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="scheduledAt">
              Fecha y Hora
            </label>
            <input
              className={clsx(
                'focus-input border text-sm',
                errors.scheduledAt
                  ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75'
                  : 'border-input-outline',
              )}
              id="scheduledAt"
              // Ajuste de Zona Horaria: toISOString() devuelve UTC (Londres).
              // Restamos el desfase local (en ms) para obtener una cadena ISO que represente la hora local real del usuario.
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)}
              type="datetime-local"
              {...register('scheduledAt')}
            />
            {errors.scheduledAt && (
              <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                {errors.scheduledAt.message}
              </span>
            )}
          </div>

          <PlannerDurationInput
            control={control}
            error={errors.duration?.message}
            name="duration"
            register={register}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-secondary text-sm font-medium" htmlFor="notes">
            Notas / Justificación <span className="text-secondary/50 font-normal">(Opcional)</span>
          </label>
          <textarea
            className={clsx(
              'focus-input border text-sm',
              errors.notes
                ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75'
                : 'border-input-outline',
            )}
            id="notes"
            placeholder=""
            rows={2}
            {...register('notes')}
          />
          {errors.notes && (
            <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
              {errors.notes.message}
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-2 flex justify-end gap-3">
          <button
            className="focus-visible:ring-accessibility rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
            type="button"
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            className="bg-action hover:bg-action/90 focus-visible:ring-accessibility rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Agendando...' : 'Agendar Tarea'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

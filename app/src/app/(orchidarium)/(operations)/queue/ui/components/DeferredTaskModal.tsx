'use client'

import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'

import { PlannerCircuitSelect, PlannerZoneSelect, PlannerDurationInput } from './PlannerInputs'

import { ZoneType, ZoneTypeLabels } from '@/config/mappings'
import { Modal, Button, FormField, Input } from '@/components/ui'

// Zod Schema idéntico al del planificador
const plannerSchema = z.object({
  purpose: z.enum(
    ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
    { errorMap: () => ({ message: 'Debes seleccionar un circuito' }) },
  ),
  zone: z.literal(ZoneType.ZONA_A, {
    errorMap: () => ({
      message: `La única zona habilitada es el ${ZoneTypeLabels[ZoneType.ZONA_A]}`,
    }),
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
      zone: ZoneType.ZONA_A,
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
    <Modal isOpen={isOpen} size="md" title="Nueva Tarea Diferida" onClose={handleClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(submitHandler)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="purpose" label="Circuito">
            <PlannerCircuitSelect
              control={control}
              error={errors.purpose?.message}
              name="purpose"
            />
          </FormField>
          <FormField htmlFor="zone" label="Zona">
            <PlannerZoneSelect control={control} error={errors.zone?.message} name="zone" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="scheduledAt" label="Fecha y Hora">
            <Input
              error={errors.scheduledAt?.message}
              id="scheduledAt"
              // Ajuste de Zona Horaria
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)}
              type="datetime-local"
              {...register('scheduledAt')}
            />
          </FormField>

          <FormField htmlFor="duration" label="Duración">
            <PlannerDurationInput
              control={control}
              error={errors.duration?.message}
              name="duration"
              register={register}
            />
          </FormField>
        </div>

        <FormField htmlFor="notes" label="Notas / Justificación">
          <textarea
            className={clsx(
              'focus-input mt-1.5 w-full resize-none border text-sm',
              errors.notes
                ? 'border-red-500/50 outline -outline-offset-1 outline-red-500/50'
                : 'border-input-outline',
            )}
            id="notes"
            placeholder="Opcional..."
            rows={2}
            {...register('notes')}
          />
          {errors.notes && (
            <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-500">
              {errors.notes.message}
            </span>
          )}
        </FormField>

        {/* Footer Actions */}
        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} type="submit">
            {isSubmitting ? 'Agendando...' : 'Agendar Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

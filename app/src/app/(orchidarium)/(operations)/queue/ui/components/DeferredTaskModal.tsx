'use client'

import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'

import { PlannerCircuitSelect, PlannerZoneSelect, PlannerDurationInput } from './PlannerInputs'

import { useFormDraftStore } from '@/store'
import { ZoneType } from '@/config/mappings'
import { Modal, Button, FormField, Input } from '@/components/ui'

// Zod Schema idéntico al del planificador
const plannerSchema = z.object({
  purpose: z.enum(
    ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
    { message: 'Debes seleccionar un circuito' },
  ),
  zone: z.literal(ZoneType.ZONA_A),
  duration: z.coerce.number().min(1, 'Mínimo 1 minuto').max(25, 'Máximo 25 minutos'),
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

const DEFAULT_VALUES: z.input<typeof plannerSchema> = {
  purpose: 'IRRIGATION',
  zone: ZoneType.ZONA_A,
  duration: 1,
  scheduledAt: '',
  notes: '',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmitSuccess: (data: PlannerFormInputs) => Promise<void>
}

export function DeferredTaskModal({ isOpen, onClose, onSubmitSuccess }: Props) {
  const { setDraft, clearDraft } = useFormDraftStore()
  const draftKey = 'deferred-task'
  const isRestoringRef = useRef(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof plannerSchema>>({
    resolver: zodResolver(plannerSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Cargar borrador cuando se abre el modal (lectura imperativa, sin dependencia reactiva)
  useEffect(() => {
    if (isOpen) {
      const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as
        | z.input<typeof plannerSchema>
        | undefined

      isRestoringRef.current = true
      reset(savedDraft ?? DEFAULT_VALUES)
      // Dar tiempo a react-hook-form para completar el reset antes de permitir guardado
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, reset])

  // Persistir cambios en el store (lectura imperativa para comparar, sin dep. reactiva)
  const watchedValues = watch()
  const watchedString = JSON.stringify(watchedValues)

  useEffect(() => {
    if (!isOpen || isRestoringRef.current) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as
      | z.input<typeof plannerSchema>
      | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      setDraft(draftKey, JSON.parse(watchedString) as PlannerFormInputs)
    }
  }, [watchedString, isOpen, setDraft])

  // Cerrar sin limpiar borrador
  const handleClose = () => {
    onClose()
  }

  // Interceptar el submit exitoso y limpiar borrador
  const submitHandler = async (data: z.input<typeof plannerSchema>) => {
    const parsedData = plannerSchema.parse(data)

    await onSubmitSuccess(parsedData)
    clearDraft(draftKey)
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
            {isSubmitting ? 'Agendando' : 'Agendar Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

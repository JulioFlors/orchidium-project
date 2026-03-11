'use client'

import { useEffect } from 'react'
import { motion } from 'motion/react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoCloseOutline } from 'react-icons/io5'

import { PlannerCircuitSelect, PlannerZoneSelect, PlannerDurationInput } from './PlannerInputs'

import { Backdrop } from '@/components/ui/backdrop/Backdrop'
import { upsertSchedule } from '@/actions/planner/schedule-actions'

// Zod Schema
const programSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
  purpose: z.enum(
    ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
    { errorMap: () => ({ message: 'Debes seleccionar un circuito' }) },
  ),
  time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora inválida (HH:mm)'),
  duration: z.coerce.number().min(1, 'Mínimo 1 minuto').max(25, 'Máximo 25 minutos'),
  zone: z.literal('ZONA_A', {
    errorMap: () => ({ message: 'La única zona habilitada es la ZONA A' }),
  }),
})

type ProgramFormInputs = z.infer<typeof programSchema>

// Helpers para transformar cron <-> time
function timeToCron(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')

  return `${parseInt(minutes)} ${parseInt(hours)} * * *`
}

function cronToTime(cronStr: string): string {
  const parts = cronStr.split(' ')

  if (parts.length < 2) return '12:00'
  const minutes = parts[0].padStart(2, '0')
  const hours = parts[1].padStart(2, '0')

  return `${hours}:${minutes}`
}

export interface ScheduleInitialData {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  cronTrigger: string
  durationMinutes: number
  zones?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: ScheduleInitialData | null // Reemplazado any por tipo explícito
}

export function ScheduleFormModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProgramFormInputs>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      purpose: '' as 'HUMIDIFICATION',
      time: '',
      duration: '' as unknown as number,
      zone: 'ZONA_A',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          id: initialData.id,
          name: initialData.name,
          purpose: initialData.purpose,
          time: cronToTime(initialData.cronTrigger),
          duration: initialData.durationMinutes,
          zone: (initialData.zones?.[0] || 'ZONA_A') as 'ZONA_A',
        })
      } else {
        reset({
          id: undefined,
          name: '',
          purpose: '' as 'HUMIDIFICATION',
          time: '',
          duration: '' as unknown as number,
          zone: 'ZONA_A',
        } as ProgramFormInputs) // Added casting for reset()
      }
    }
  }, [isOpen, initialData, reset])

  const onSubmit = async (data: ProgramFormInputs) => {
    try {
      const cron = timeToCron(data.time)
      const res = await upsertSchedule({
        id: data.id,
        name: data.name,
        purpose: data.purpose,
        cronTrigger: cron,
        durationMinutes: data.duration,
        zones: [data.zone],
      })

      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setError('root', { message: res.error })
      }
    } catch {
      setError('root', { message: 'Ocurrió un error inesperado al guardar la rutina.' })
    }
  }

  return (
    <Backdrop blur="backdrop-blur-[2px]" className="p-4" visible={isOpen} onClick={onClose}>
      <motion.div
        key="schedule-modal"
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border-input-outline relative w-full max-w-md rounded-xl border p-6 shadow-xl"
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="text-secondary hover:text-primary focus-visible:ring-accessibility absolute top-4 right-4 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          type="button"
          onClick={onClose}
        >
          <IoCloseOutline className="h-6 w-6" />
        </button>

        <h3 className="text-primary mb-6 text-xl font-bold">
          {initialData ? 'Editar Rutina' : 'Nueva Rutina Diaria'}
        </h3>

        {errors.root && (
          <div className="mb-4 rounded-md bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
            {errors.root.message}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="name">
              Nombre de la Rutina
            </label>
            <input
              className={`focus-input border text-sm ${errors.name ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75' : 'border-input-outline'}`}
              id="name"
              type="text"
              {...register('name')}
            />
            {errors.name && (
              <span className="text-[11px] font-medium tracking-wide text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PlannerCircuitSelect
              control={control}
              error={errors.purpose?.message}
              name="purpose"
            />
            <PlannerZoneSelect control={control} error={errors.zone?.message} name="zone" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="time">
                Hora
              </label>
              <input
                className={`focus-input border text-sm ${errors.time ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75' : 'border-input-outline'}`}
                id="time"
                type="time"
                {...register('time')}
              />
              {errors.time && (
                <span className="text-[11px] font-medium tracking-wide text-red-500">
                  {errors.time.message}
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

          <div className="mt-2 flex justify-end gap-3">
            <button
              className="focus-visible:ring-accessibility rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="bg-action hover:bg-action/90 focus-visible:ring-accessibility rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Rutina'}
            </button>
          </div>
        </form>
      </motion.div>
    </Backdrop>
  )
}

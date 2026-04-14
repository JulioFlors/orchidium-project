'use client'

import React, { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  PlannerCircuitSelect,
  PlannerZoneSelect,
  PlannerDurationInput,
  PlannerProgramSelect,
  PlannerDaysSelector,
} from './PlannerInputs'

import { Modal, Button, FormField, Input } from '@/components/ui'
import { upsertSchedule } from '@/actions/planner/schedule-actions'
import { getPrograms } from '@/actions/lab/programs'

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
  fertilizationProgramId: z.string().optional(),
  phytosanitaryProgramId: z.string().optional(),
  days: z.array(z.number()).min(1, 'Selecciona al menos un día'),
})

type ProgramFormInputs = z.infer<typeof programSchema>

// Helpers para transformar cron <-> time/days
function timeToCron(timeStr: string, days: number[]): string {
  const [hours, minutes] = timeStr.split(':')
  // Si están todos los días seleccionados (o ninguno, aunque el schema obliga a 1), usamos '*'
  const dayStr = days.length === 7 ? '*' : days.join(',')

  return `${parseInt(minutes)} ${parseInt(hours)} * * ${dayStr}`
}

function cronToTime(cronStr: string): string {
  const parts = cronStr.split(' ')

  if (parts.length < 2) return '12:00'
  const minutes = parts[0].padStart(2, '0')
  const hours = parts[1].padStart(2, '0')

  return `${hours}:${minutes}`
}

function cronToDays(cronStr: string): number[] {
  const parts = cronStr.split(' ')

  if (parts.length < 5) return [0, 1, 2, 3, 4, 5, 6]
  const dayPart = parts[4]

  if (dayPart === '*') return [0, 1, 2, 3, 4, 5, 6]

  return dayPart.split(',').map(Number)
}

export interface ScheduleInitialData {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  cronTrigger: string
  durationMinutes: number
  zones?: string[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: ScheduleInitialData | null
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
      fertilizationProgramId: '',
      phytosanitaryProgramId: '',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  })

  // Watch del propósito para mostrar cargadores/selectores dinámicos
  const currentPurpose = useWatch({ control, name: 'purpose' })

  // Estado para programas de laboratorio
  const [programs, setPrograms] = useState<{
    fertilization: { label: string; value: string }[]
    phytosanitary: { label: string; value: string }[]
  }>({ fertilization: [], phytosanitary: [] })

  // Cargar programas al abrir el modal
  useEffect(() => {
    async function fetchPrograms() {
      if (!isOpen) return
      const res = await getPrograms()

      if (res.ok) {
        setPrograms({
          fertilization: (res.fertilizationPrograms || []).map((p) => ({
            label: p.name,
            value: p.id,
          })),
          phytosanitary: (res.phytosanitaryPrograms || []).map((p) => ({
            label: p.name,
            value: p.id,
          })),
        })
      }
    }
    fetchPrograms()
  }, [isOpen])

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
          fertilizationProgramId: initialData.fertilizationProgramId || '',
          phytosanitaryProgramId: initialData.phytosanitaryProgramId || '',
          days: cronToDays(initialData.cronTrigger),
        })
      } else {
        reset({
          id: undefined,
          name: '',
          purpose: '' as 'HUMIDIFICATION',
          time: '',
          duration: '' as unknown as number,
          zone: 'ZONA_A',
          fertilizationProgramId: '',
          phytosanitaryProgramId: '',
          days: [0, 1, 2, 3, 4, 5, 6],
        } as ProgramFormInputs)
      }
    }
  }, [isOpen, initialData, reset])

  const onSubmit = async (data: ProgramFormInputs) => {
    try {
      const cron = timeToCron(data.time, data.days)
      const res = await upsertSchedule({
        id: data.id,
        name: data.name,
        purpose: data.purpose,
        cronTrigger: cron,
        durationMinutes: data.duration,
        zones: [data.zone],
        fertilizationProgramId: data.purpose === 'FERTIGATION' ? data.fertilizationProgramId : null,
        phytosanitaryProgramId: data.purpose === 'FUMIGATION' ? data.phytosanitaryProgramId : null,
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
    <Modal
      isOpen={isOpen}
      size="md"
      title={initialData ? 'Editar Rutina' : 'Nueva Rutina'}
      onClose={onClose}
    >
      {errors.root && (
        <div className="mb-4 rounded-md bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
          {errors.root.message}
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className="flex flex-col gap-6"
        onKeyDown={(e) => {
          // Prevenimos que 'Enter' envíe el formulario si el foco está en un campo de texto
          if (
            e.key === 'Enter' &&
            e.target instanceof HTMLElement &&
            e.target.tagName === 'INPUT'
          ) {
            e.preventDefault()
          }
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormField htmlFor="name" label="Nombre">
          <Input
            error={errors.name?.message}
            id="name"
            placeholder=""
            type="text"
            {...register('name')}
          />
          {errors.name && (
            <span className="text-[11px] font-medium tracking-wide text-red-500">
              {errors.name.message}
            </span>
          )}
        </FormField>

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

        {/* SELECTORES DE PROGRAMA DINÁMICOS */}
        {currentPurpose === 'FERTIGATION' && (
          <FormField htmlFor="fertilizationProgramId" label="Programa de Fertirriego">
            <PlannerProgramSelect
              control={control}
              error={errors.fertilizationProgramId?.message}
              name="fertilizationProgramId"
              options={programs.fertilization}
            />
          </FormField>
        )}

        {currentPurpose === 'FUMIGATION' && (
          <FormField htmlFor="phytosanitaryProgramId" label="Programa Fitosanitario">
            <PlannerProgramSelect
              control={control}
              error={errors.phytosanitaryProgramId?.message}
              name="phytosanitaryProgramId"
              options={programs.phytosanitary}
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="time" label="Hora de Inicio">
            <Input error={errors.time?.message} id="time" type="time" {...register('time')} />
            {errors.time && (
              <span className="text-[11px] font-medium tracking-wide text-red-500">
                {errors.time.message}
              </span>
            )}
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

        <FormField htmlFor="days" label="Días de Ejecución">
          <PlannerDaysSelector control={control} error={errors.days?.message} name="days" />
        </FormField>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} type="submit">
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  PlannerCircuitSelect,
  PlannerMultiZoneSelect,
  PlannerProgramSelect,
  PlannerDaysSelector,
} from '@/app/(orchidarium)/(operations)/schedules/ui/components/PlannerInputs'
import { ZoneType } from '@/config/mappings'
import { Modal, Button, FormField, Input } from '@/components'
import { useFormDraftStore } from '@/store'
import { upsertDosingSchedule } from '@/actions/lab/dosing-schedule-actions'
import { getPrograms } from '@/actions/lab/programs'

// Zod Schema para Rutinas de Dosificación Manual
const programSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    purpose: z.enum(['FERTIGATION', 'FUMIGATION'] as const, {
      message: 'Debes seleccionar una tarea (Fertilización o Control Fitosanitario)',
    }),
    time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora inválida (HH:mm)'),
    zones: z.array(z.nativeEnum(ZoneType)).min(1, 'Selecciona al menos una zona'),
    fertilizationProgramId: z.string().optional(),
    phytosanitaryProgramId: z.string().optional(),
    days: z.array(z.number()).min(1, 'Selecciona al menos un día'),
  })
  .refine(
    (data) => {
      if (data.purpose === 'FERTIGATION') {
        return !!data.fertilizationProgramId && data.fertilizationProgramId.trim() !== ''
      }

      return true
    },
    {
      message: 'Debes seleccionar un Plan de Fertilización',
      path: ['fertilizationProgramId'],
    },
  )
  .refine(
    (data) => {
      if (data.purpose === 'FUMIGATION') {
        return !!data.phytosanitaryProgramId && data.phytosanitaryProgramId.trim() !== ''
      }

      return true
    },
    {
      message: 'Debes seleccionar un Plan Fitosanitario',
      path: ['phytosanitaryProgramId'],
    },
  )

type ProgramFormInputs = z.infer<typeof programSchema>

// Helpers para transformar cron <-> time/days
function timeToCron(timeStr: string, days: number[]): string {
  const [hours, minutes] = timeStr.split(':')
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

export interface DosingScheduleInitialData {
  id: string
  name: string
  purpose: 'FERTIGATION' | 'FUMIGATION'
  cronTrigger: string
  zones?: string[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: DosingScheduleInitialData | null
}

export function DosingScheduleFormModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.input<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      purpose: 'FERTIGATION',
      time: '',
      zones: [ZoneType.ZONA_A],
      fertilizationProgramId: '',
      phytosanitaryProgramId: '',
      days: [],
    },
  })

  const draftKey = 'dosing-schedule-form-draft'
  const isRestoringRef = React.useRef(false)

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

  // Cargar borrador/initialData al abrir
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        isRestoringRef.current = true
        reset({
          id: initialData.id,
          name: initialData.name,
          purpose: initialData.purpose,
          time: cronToTime(initialData.cronTrigger),
          zones:
            initialData.zones && initialData.zones.length > 0
              ? (initialData.zones as ZoneType[])
              : [ZoneType.ZONA_A],
          fertilizationProgramId: initialData.fertilizationProgramId || '',
          phytosanitaryProgramId: initialData.phytosanitaryProgramId || '',
          days: cronToDays(initialData.cronTrigger),
        })
        requestAnimationFrame(() => {
          isRestoringRef.current = false
        })
      } else {
        const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as
          z.input<typeof programSchema> | undefined

        isRestoringRef.current = true
        reset(
          savedDraft ?? {
            id: undefined,
            name: '',
            purpose: 'FERTIGATION',
            time: '',
            zones: [ZoneType.ZONA_A],
            fertilizationProgramId: '',
            phytosanitaryProgramId: '',
            days: [],
          },
        )
        requestAnimationFrame(() => {
          isRestoringRef.current = false
        })
      }
    }
  }, [isOpen, initialData, reset])

  // Persistir cambios del formulario de rutina
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)

  useEffect(() => {
    if (!isOpen || isRestoringRef.current || !!initialData) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as
      z.input<typeof programSchema> | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      useFormDraftStore
        .getState()
        .setDraft(draftKey, JSON.parse(watchedString) as ProgramFormInputs)
    }
  }, [watchedString, isOpen, initialData])

  const onSubmit = async (data: z.input<typeof programSchema>) => {
    try {
      const parsedData = programSchema.parse(data)
      const cron = timeToCron(parsedData.time, parsedData.days)

      const res = await upsertDosingSchedule({
        id: parsedData.id,
        name: parsedData.name,
        purpose: parsedData.purpose,
        cronTrigger: cron,
        durationMinutes: 0,
        zones: parsedData.zones,
        fertilizationProgramId:
          parsedData.purpose === 'FERTIGATION' ? parsedData.fertilizationProgramId : null,
        phytosanitaryProgramId:
          parsedData.purpose === 'FUMIGATION' ? parsedData.phytosanitaryProgramId : null,
      })

      if (res.success) {
        useFormDraftStore.getState().clearDraft(draftKey)
        onSuccess()
        onClose()
      } else {
        setError('root', { message: res.error })
      }
    } catch {
      setError('root', {
        message: 'Ocurrió un error inesperado al guardar la rutina de dosificación.',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={initialData ? 'Editar Rutina de Dosificación' : 'Nueva Rutina de Dosificación'}
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
        {/* 1. Nombre */}
        <FormField required error={errors.name?.message} htmlFor="name" label="Nombre">
          <Input
            error={errors.name?.message}
            id="name"
            maxLength={50}
            placeholder=""
            type="text"
            {...register('name')}
          />
        </FormField>

        {/* 2. Tarea */}
        <FormField required error={errors.purpose?.message} htmlFor="purpose" label="Tarea">
          <PlannerCircuitSelect
            allowedPurposes={['FERTIGATION', 'FUMIGATION']}
            control={control}
            error={errors.purpose?.message}
            name="purpose"
          />
        </FormField>

        {/* 3. Programa */}
        {currentPurpose === 'FERTIGATION' && (
          <FormField
            required
            error={errors.fertilizationProgramId?.message}
            htmlFor="fertilizationProgramId"
            label="Programa de Fertilización"
          >
            <PlannerProgramSelect
              control={control}
              error={errors.fertilizationProgramId?.message}
              name="fertilizationProgramId"
              options={programs.fertilization}
            />
          </FormField>
        )}

        {currentPurpose === 'FUMIGATION' && (
          <FormField
            required
            error={errors.phytosanitaryProgramId?.message}
            htmlFor="phytosanitaryProgramId"
            label="Programa de Control Fitosanitario"
          >
            <PlannerProgramSelect
              control={control}
              error={errors.phytosanitaryProgramId?.message}
              name="phytosanitaryProgramId"
              options={programs.phytosanitary}
            />
          </FormField>
        )}

        {/* 4. Hora de Aplicación */}
        <FormField required error={errors.time?.message} htmlFor="time" label="Hora de Aplicación">
          <Input
            className="cursor-pointer dark:scheme-dark"
            error={errors.time?.message}
            id="time"
            step="60"
            type="time"
            {...register('time')}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker()
              } catch {
                // Fallback
              }
            }}
          />
        </FormField>

        {/* 5. Zonas Múltiples */}
        <FormField required error={errors.zones?.message} htmlFor="zones" label="Zonas">
          <PlannerMultiZoneSelect control={control} error={errors.zones?.message} name="zones" />
        </FormField>

        {/* 6. Días de Ejecución */}
        <FormField required error={errors.days?.message} htmlFor="days" label="Días de Ejecución">
          <PlannerDaysSelector control={control} error={errors.days?.message} name="days" />
        </FormField>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-1 gap-3 border-t px-6 pt-4 tds-sm:grid-cols-2">
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

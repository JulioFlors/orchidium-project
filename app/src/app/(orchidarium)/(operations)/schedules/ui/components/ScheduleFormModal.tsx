'use client'

import React, { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'

import {
  PlannerCircuitSelect,
  PlannerExecutionTypeSelect,
  PlannerZoneSelect,
  PlannerMultiZoneSelect,
  PlannerDurationInput,
  PlannerProgramSelect,
  PlannerDaysSelector,
} from './PlannerInputs'

import { ZoneType } from '@/config/mappings'
import { Modal, Button, FormField, Input } from '@/components/ui'
import { useFormDraftStore } from '@/store'
import { upsertSchedule } from '@/actions/planner/schedule-actions'
import { getPrograms } from '@/actions/lab/programs'

// Zod Schema
const programSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    purpose: z.enum(
      ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
      { message: 'Debes seleccionar una tarea' },
    ),
    executionType: z.enum(['MANUAL', 'HARDWARE'] as const).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora inválida (HH:mm)'),
    duration: z.coerce.number().optional(),
    zones: z.array(z.nativeEnum(ZoneType)).min(1, 'Selecciona al menos una zona'),
    fertilizationProgramId: z.string().optional(),
    phytosanitaryProgramId: z.string().optional(),
    days: z.array(z.number()).min(1, 'Selecciona al menos un día'),
  })
  .superRefine((data, ctx) => {
    const isAgrochemical = ['FERTIGATION', 'FUMIGATION'].includes(data.purpose)

    if (isAgrochemical && !data.executionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['executionType'],
        message: 'Selecciona un modo de dosificación',
      })
    }

    const isManualExecution = isAgrochemical && data.executionType === 'MANUAL'

    if (!isManualExecution && (!data.duration || data.duration <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['duration'],
        message: 'La duración debe ser mayor a 0 minutos',
      })
    }
  })

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

export interface ScheduleInitialData {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  executionType?: 'HARDWARE' | 'MANUAL'
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
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.input<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      purpose: '' as 'IRRIGATION',
      executionType: undefined,
      time: '',
      duration: 0,
      zones: [ZoneType.ZONA_A],
      fertilizationProgramId: '',
      phytosanitaryProgramId: '',
      days: [],
    },
  })

  const draftKey = 'schedule-form-draft'
  const isRestoringRef = React.useRef(false)

  // Watchers independientes
  const currentPurpose = useWatch({ control, name: 'purpose' })
  const currentExecutionType = useWatch({ control, name: 'executionType' })

  // Derivados de estado
  const isAgrochemical = currentPurpose === 'FERTIGATION' || currentPurpose === 'FUMIGATION'
  const isManual = isAgrochemical && currentExecutionType === 'MANUAL'

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

  // Resetear executionType al cambiar a una tarea no agroquímica
  useEffect(() => {
    if (!isAgrochemical && !isRestoringRef.current) {
      setValue('executionType', undefined)
    }
  }, [isAgrochemical, setValue])

  // Cargar borrador/initialData al abrir
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        isRestoringRef.current = true
        reset({
          id: initialData.id,
          name: initialData.name,
          purpose: initialData.purpose,
          executionType: initialData.executionType ?? undefined,
          time: cronToTime(initialData.cronTrigger),
          duration: initialData.durationMinutes || 10,
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
            purpose: '' as 'IRRIGATION',
            executionType: undefined,
            time: '',
            duration: 0,
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
      const resolvedExecutionType = isAgrochemical ? parsedData.executionType! : 'HARDWARE'
      const isManualExecution = resolvedExecutionType === 'MANUAL'

      if (!isManualExecution && (!parsedData.duration || parsedData.duration <= 0)) {
        setError('duration', { message: 'La duración debe ser mayor a 0 minutos' })

        return
      }

      const cron = timeToCron(parsedData.time, parsedData.days)
      const res = await upsertSchedule({
        id: parsedData.id,
        name: parsedData.name,
        purpose: parsedData.purpose,
        executionType: resolvedExecutionType,
        cronTrigger: cron,
        durationMinutes: isManualExecution ? 0 : parsedData.duration || 10,
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

        {/* 2. Tarea + Zona single (la zona se oculta en modo Manual) */}
        <div className={clsx('grid gap-4', isManual ? 'grid-cols-1' : 'grid-cols-2')}>
          <FormField htmlFor="purpose" label="Tarea">
            <PlannerCircuitSelect
              control={control}
              error={errors.purpose?.message}
              name="purpose"
            />
          </FormField>

          {!isManual && (
            <FormField htmlFor="zones" label="Zona">
              <PlannerZoneSelect control={control} error={errors.zones?.message} name="zones" />
            </FormField>
          )}
        </div>

        {/* 3. Programa (solo para tareas agroquímicas) */}
        {currentPurpose === 'FERTIGATION' && (
          <FormField htmlFor="fertilizationProgramId" label="Programa de Fertilización">
            <PlannerProgramSelect
              control={control}
              error={errors.fertilizationProgramId?.message}
              name="fertilizationProgramId"
              options={programs.fertilization}
            />
          </FormField>
        )}

        {currentPurpose === 'FUMIGATION' && (
          <FormField htmlFor="phytosanitaryProgramId" label="Programa de Control Fitosanitario">
            <PlannerProgramSelect
              control={control}
              error={errors.phytosanitaryProgramId?.message}
              name="phytosanitaryProgramId"
              options={programs.phytosanitary}
            />
          </FormField>
        )}

        {/* 4. Dosificación (solo para tareas agroquímicas) */}
        {isAgrochemical && (
          <FormField htmlFor="executionType" label="Dosificación">
            <PlannerExecutionTypeSelect
              control={control}
              error={errors.executionType?.message}
              name="executionType"
            />
          </FormField>
        )}

        {/* 5. Hora + Duración | solo Hora (Manual) */}
        {isManual ? (
          <FormField htmlFor="time" label="Hora">
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
            {errors.time && (
              <span className="text-[11px] font-medium tracking-wide text-red-500">
                {errors.time.message}
              </span>
            )}
          </FormField>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField htmlFor="time" label="Hora de Inicio">
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
        )}

        {/* 6. Zonas múltiples (solo Dosificación Manual) */}
        {isManual && (
          <FormField htmlFor="zones" label="Zonas">
            <PlannerMultiZoneSelect control={control} error={errors.zones?.message} name="zones" />
          </FormField>
        )}

        {/* 7. Días de Ejecución */}
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

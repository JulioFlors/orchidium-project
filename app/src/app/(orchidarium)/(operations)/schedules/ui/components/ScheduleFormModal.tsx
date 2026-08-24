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

import { ZoneType } from '@/config/mappings'
import { Modal, Button, FormField, Input } from '@/components/ui'
import { useFormDraftStore } from '@/store'
import { upsertSchedule } from '@/actions/planner/schedule-actions'
import { getPrograms } from '@/actions/lab/programs'

// Zod Schema para Rutinas Automatizadas de Hardware
const programSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    purpose: z.enum(
      ['IRRIGATION', 'FERTIGATION', 'FUMIGATION', 'HUMIDIFICATION', 'SOIL_WETTING'] as const,
      { message: 'Debes seleccionar una tarea' },
    ),
    time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora inválida (HH:mm)'),
    duration: z.coerce.number().min(1, 'La duración debe ser mayor a 0 minutos'),
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
  const draftKey = initialData
    ? `schedule-edit-draft-${initialData.id}`
    : 'schedule-new-draft-hardware'
  const isRestoringRef = React.useRef(false)

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting, isDirty },
    setError,
  } = useForm<z.input<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      purpose: '' as 'IRRIGATION',
      time: '',
      duration: 10,
      zones: [ZoneType.ZONA_A],
      fertilizationProgramId: '',
      phytosanitaryProgramId: '',
      days: [],
    },
  })

  const currentPurpose = useWatch({ control, name: 'purpose' })

  // Estado para programas de laboratorio
  const [programs, setPrograms] = useState<{
    fertilization: { label: string; value: string }[]
    phytosanitary: { label: string; value: string }[]
  }>({ fertilization: [], phytosanitary: [] })
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false)

  // Cargar programas al abrir el modal
  useEffect(() => {
    async function fetchPrograms() {
      if (!isOpen) return
      setIsLoadingPrograms(true)
      try {
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
      } finally {
        setIsLoadingPrograms(false)
      }
    }
    fetchPrograms()
  }, [isOpen])

  // Cargar borrador/initialData al abrir
  useEffect(() => {
    if (isOpen) {
      isRestoringRef.current = true

      if (initialData) {
        const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as
          ProgramFormInputs | undefined

        reset(
          savedDraft ?? {
            id: initialData.id,
            name: initialData.name,
            purpose: initialData.purpose,
            time: cronToTime(initialData.cronTrigger),
            duration: initialData.durationMinutes || 10,
            zones:
              initialData.zones && initialData.zones.length > 0
                ? (initialData.zones as ZoneType[])
                : [ZoneType.ZONA_A],
            fertilizationProgramId: initialData.fertilizationProgramId || '',
            phytosanitaryProgramId: initialData.phytosanitaryProgramId || '',
            days: cronToDays(initialData.cronTrigger),
          },
        )
      } else {
        const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as
          ProgramFormInputs | undefined

        reset(
          savedDraft ?? {
            id: undefined,
            name: '',
            purpose: '' as 'IRRIGATION',
            time: '',
            duration: 10,
            zones: [ZoneType.ZONA_A],
            fertilizationProgramId: '',
            phytosanitaryProgramId: '',
            days: [],
          },
        )
      }

      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, initialData, reset, draftKey])

  // Persistir cambios del formulario de rutina SOLO cuando el formulario ha sido modificado activamente (isDirty)
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)

  useEffect(() => {
    if (!isOpen || isRestoringRef.current || !isDirty) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as
      ProgramFormInputs | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      useFormDraftStore
        .getState()
        .setDraft(draftKey, JSON.parse(watchedString) as ProgramFormInputs)
    }
  }, [watchedString, isOpen, isDirty, draftKey])

  const onSubmit = async (data: z.input<typeof programSchema>) => {
    try {
      const parsedData = programSchema.parse(data)
      const cron = timeToCron(parsedData.time, parsedData.days)

      const res = await upsertSchedule({
        id: parsedData.id,
        name: parsedData.name,
        purpose: parsedData.purpose,
        cronTrigger: cron,
        durationMinutes: parsedData.duration || 10,
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
      title={initialData ? 'Editar Rutina de Riego' : 'Nueva Rutina de Riego'}
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

        {/* 2. Tarea + Zona (1 columna en móvil) */}
        <div className="grid grid-cols-1 gap-4 tds-sm:grid-cols-2">
          <FormField required error={errors.purpose?.message} htmlFor="purpose" label="Tarea">
            <PlannerCircuitSelect
              control={control}
              error={errors.purpose?.message}
              name="purpose"
            />
          </FormField>

          <FormField required error={errors.zones?.message} htmlFor="zones" label="Zona">
            <PlannerZoneSelect control={control} error={errors.zones?.message} name="zones" />
          </FormField>
        </div>

        {/* 3. Programa (solo para ferti/fito automatizado) */}
        {currentPurpose === 'FERTIGATION' && (
          <FormField
            error={errors.fertilizationProgramId?.message}
            htmlFor="fertilizationProgramId"
            label="Programa de Fertilización"
          >
            <PlannerProgramSelect
              control={control}
              error={errors.fertilizationProgramId?.message}
              isLoading={isLoadingPrograms}
              name="fertilizationProgramId"
              options={programs.fertilization}
            />
          </FormField>
        )}

        {currentPurpose === 'FUMIGATION' && (
          <FormField
            error={errors.phytosanitaryProgramId?.message}
            htmlFor="phytosanitaryProgramId"
            label="Programa de Control Fitosanitario"
          >
            <PlannerProgramSelect
              control={control}
              error={errors.phytosanitaryProgramId?.message}
              isLoading={isLoadingPrograms}
              name="phytosanitaryProgramId"
              options={programs.phytosanitary}
            />
          </FormField>
        )}

        {/* 4. Hora de Inicio + Duración (1 columna en móvil) */}
        <div className="grid grid-cols-1 gap-4 tds-sm:grid-cols-2">
          <FormField required error={errors.time?.message} htmlFor="time" label="Hora de Inicio">
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

          <FormField required error={errors.duration?.message} htmlFor="duration" label="Duración">
            <PlannerDurationInput
              control={control}
              error={errors.duration?.message}
              name="duration"
              register={register}
            />
          </FormField>
        </div>

        {/* 5. Días de Ejecución */}
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

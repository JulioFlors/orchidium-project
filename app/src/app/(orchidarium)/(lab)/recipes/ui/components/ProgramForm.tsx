'use client'

import type { Agrochemical } from '@package/database'

import { AgrochemicalType } from '@package/database/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useTransition } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { IoAddOutline, IoTrashOutline, IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5'
import * as z from 'zod'

import { upsertFertilizationProgram, upsertPhytosanitaryProgram } from '@/actions'
import {
  FormField,
  Button,
  SelectDropdown,
  Input,
  Modal,
  ActionMenu,
  type ActionMenuItem,
} from '@/components'
import { useFormDraftStore } from '@/store'
import { useToastStore } from '@/store/toast/toast.store'
import { VALIDATION_LIMITS } from '@/config'

const cycleSchema = z.object({
  agrochemicalId: z.string().min(1, 'Debe seleccionar un insumo'),
  sequence: z.number(),
})

const programSchema = z
  .object({
    purposeType: z.enum(['fertilization', 'phytosanitary']),
    name: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(
        VALIDATION_LIMITS.PROGRAM_NAME_MAX,
        `El nombre no puede exceder ${VALIDATION_LIMITS.PROGRAM_NAME_MAX} caracteres`,
      ),
    frequency: z
      .number({ message: 'Debe ingresar un número válido' })
      .int('Debe ser un número entero')
      .min(1, 'El intervalo debe ser al menos 1'),
    cycles: z.array(cycleSchema).min(1, 'Debe agregar al menos un paso al programa'),
  })

  .superRefine((data, ctx) => {
    if (data.purposeType === 'fertilization') {
      if (data.frequency > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La frecuencia semanal no puede ser mayor a 4 semanas',
          path: ['frequency'],
        })
      }
      if (data.cycles.length > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los planes de fertilización no pueden tener más de 4 pasos (1 por semana)',
          path: ['cycles'],
        })
      }
    } else {
      if (data.frequency < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El espaciamiento fitosanitario debe ser de al menos 2 meses',
          path: ['frequency'],
        })
      }
      if (data.frequency > 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La frecuencia mensual no puede exceder 12 meses',
          path: ['frequency'],
        })
      }
      if (data.cycles.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los planes fitosanitarios no pueden tener más de 6 pasos al año',
          path: ['cycles'],
        })
      }
    }
  })

type FormValues = z.infer<typeof programSchema>

// Interfaces locales para los programas con sus ciclos
export interface ProgramWithCycles {
  id: string
  name: string
  productsCycle: {
    sequence: number
    agrochemical: Agrochemical
    agrochemicalId: string
  }[]
  weeklyFrequency?: number
  monthlyFrequency?: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialType?: 'fertilization' | 'phytosanitary'
  initialData?: ProgramWithCycles | null
  availableAgrochemicals: Agrochemical[]
}

const PURPOSE_OPTIONS = [
  { label: 'Fertilización', value: 'fertilization' },
  { label: 'Control Fitosanitario', value: 'phytosanitary' },
]

export function ProgramForm({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'fertilization',
  initialData,
  availableAgrochemicals,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const draftKey = `program-draft-${initialType}`
  const isRestoringRef = React.useRef(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: initialData
      ? {
          purposeType: initialType,
          name: initialData.name,
          frequency:
            initialType === 'fertilization'
              ? (initialData.weeklyFrequency ?? ('' as unknown as number))
              : (initialData.monthlyFrequency ?? ('' as unknown as number)),
          cycles: initialData.productsCycle.map((pc) => ({
            agrochemicalId: pc.agrochemicalId,
            sequence: pc.sequence,
          })),
        }
      : {
          purposeType: initialType,
          name: '',
          frequency: '' as unknown as number,
          cycles: [{ agrochemicalId: '', sequence: 1 }],
        },
  })

  // Cargar borrador al abrir el modal (solo para creación)
  React.useEffect(() => {
    if (isOpen && !initialData) {
      const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

      isRestoringRef.current = true
      reset(
        savedDraft ?? {
          purposeType: initialType,
          name: '',
          frequency: '' as unknown as number,
          cycles: [{ agrochemicalId: '', sequence: 1 }],
        },
      )
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    } else if (isOpen && initialData) {
      isRestoringRef.current = true
      reset({
        purposeType: initialType,
        name: initialData.name,
        frequency:
          initialType === 'fertilization'
            ? (initialData.weeklyFrequency ?? ('' as unknown as number))
            : (initialData.monthlyFrequency ?? ('' as unknown as number)),
        cycles: initialData.productsCycle.map((pc) => ({
          agrochemicalId: pc.agrochemicalId,
          sequence: pc.sequence,
        })),
      })
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, initialData, reset, draftKey, initialType])

  // Persistir cambios en tiempo real
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)
  const currentPurposeType = watchedValues?.purposeType || initialType

  React.useEffect(() => {
    if (!isOpen || isRestoringRef.current || !!initialData) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      useFormDraftStore.getState().setDraft(draftKey, JSON.parse(watchedString) as FormValues)
    }
  }, [watchedString, isOpen, draftKey, initialData])

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'cycles',
  })

  // Filtrar insumos disponibles según el propósito seleccionado
  const agroOptions = React.useMemo(() => {
    const activeAgros = availableAgrochemicals.filter((a) => a.isActive !== false)

    const filtered = activeAgros.filter((a) => {
      if (currentPurposeType === 'fertilization') {
        return a.type === AgrochemicalType.FERTILIZANTE
      }

      return a.type === AgrochemicalType.FITOSANITARIO
    })

    return filtered.map((a) => ({
      label: a.isMix ? `${a.name} (Mezcla)` : a.name,
      value: a.id,
    }))
  }, [availableAgrochemicals, currentPurposeType])

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const formattedCycles = values.cycles.map((c, index) => ({
        ...c,
        sequence: index + 1,
      }))

      const isFert = values.purposeType === 'fertilization'
      const payload = {
        id: initialData?.id,
        name: values.name.trim(),
        [isFert ? 'weeklyFrequency' : 'monthlyFrequency']: values.frequency,
        cycles: formattedCycles,
      }

      const result = isFert
        ? await upsertFertilizationProgram(
            payload as {
              id?: string
              name: string
              weeklyFrequency: number
              cycles: { sequence: number; agrochemicalId: string }[]
            },
          )
        : await upsertPhytosanitaryProgram(
            payload as {
              id?: string
              name: string
              monthlyFrequency: number
              cycles: { sequence: number; agrochemicalId: string }[]
            },
          )

      if (result.ok) {
        useFormDraftStore.getState().clearDraft(draftKey)
        onSuccess()
        onClose()
      } else {
        useToastStore.getState().addToast(result.message || 'Error al guardar el programa', 'error')
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={initialData ? 'Editar Plan de Dosificación' : 'Nuevo Plan de Dosificación'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {/* 1. Propósito (SelectDropdown, w-full, placeholder "Seleccionar") */}
        <FormField
          required
          error={errors.purposeType?.message}
          htmlFor="purposeType"
          label="Propósito"
        >
          <Controller
            control={control}
            name="purposeType"
            render={({ field: f }) => (
              <SelectDropdown
                error={errors.purposeType?.message}
                options={PURPOSE_OPTIONS}
                placeholder="Seleccionar"
                value={f.value}
                onChange={(val) => {
                  f.onChange(val)
                  // Limpiar frecuencia si cambia de tipo para obligar a introducir el intervalo adecuado
                  setValue('frequency', '' as unknown as number)
                }}
              />
            )}
          />
        </FormField>

        {/* 2. Nombre (w-full, sin placeholder) */}
        <FormField required error={errors.name?.message} htmlFor="name" label="Nombre">
          <Input
            error={errors.name?.message}
            id="name"
            maxLength={VALIDATION_LIMITS.PROGRAM_NAME_MAX}
            type="text"
            {...register('name')}
          />
        </FormField>

        {/* 3. Intervalo Dinámico (Semanal 1-4 vs Mensual 2-12) */}
        <FormField
          required
          error={errors.frequency?.message}
          htmlFor="frequency"
          label={
            currentPurposeType === 'fertilization'
              ? 'Intervalo Semanal (1 a 4 semanas)'
              : 'Intervalo Mensual (2 a 12 meses)'
          }
        >
          <Input
            error={errors.frequency?.message}
            id="frequency"
            maxLength={2}
            placeholder=""
            type="text"
            {...register('frequency', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')

                // Si queda vacío o escribe 0 inicial, dejar vacío
                if (!raw || raw === '0') {
                  setValue('frequency', '' as unknown as number)

                  return
                }

                const num = parseInt(raw, 10)

                if (currentPurposeType === 'fertilization') {
                  // Solo permitir dígitos 1 al 4
                  if (num >= 1 && num <= 4) {
                    setValue('frequency', num)
                  } else {
                    setValue('frequency', 4)
                  }
                } else {
                  // Fitosanitarios: rango 2 a 12
                  // Permitir '1' temporalmente solo para escribir 10, 11, 12
                  if (raw === '1') {
                    setValue('frequency', 1)
                  } else if (num > 12) {
                    setValue('frequency', 12)
                  } else {
                    setValue('frequency', num)
                  }
                }
              },
            })}
          />
          {!errors.frequency && (
            <span className="text-secondary mt-0.5 text-[11px] opacity-50">
              {currentPurposeType === 'fertilization'
                ? 'Indica cada cuántas semanas se repetirá la aplicación del ciclo.'
                : 'Indica el espaciamiento en meses entre cada tratamiento preventivo.'}
            </span>
          )}
        </FormField>

        {/* 4. Sección Ciclo de Aplicación (Sin separador, título con mismo estilo que label) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-xs font-semibold">Ciclo de Aplicación</span>
            <span className="text-secondary text-[11px] opacity-60">
              {fields.length} de {currentPurposeType === 'fertilization' ? 4 : 6} pasos
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const stepMenuItems: ActionMenuItem[] = [
                ...(index > 0
                  ? [
                      {
                        label: 'Subir paso',
                        icon: <IoArrowUpOutline className="size-4" />,
                        onClick: () => move(index, index - 1),
                      },
                    ]
                  : []),
                ...(index < fields.length - 1
                  ? [
                      {
                        label: 'Bajar paso',
                        icon: <IoArrowDownOutline className="size-4" />,
                        onClick: () => move(index, index + 1),
                      },
                    ]
                  : []),
                ...(fields.length > 1
                  ? [
                      {
                        label: 'Eliminar paso',
                        icon: <IoTrashOutline className="size-4" />,
                        onClick: () => remove(index),
                        variant: 'destructive' as const,
                      },
                    ]
                  : []),
              ]

              const stepError = errors.cycles?.[index]?.agrochemicalId?.message

              return (
                <div
                  key={field.id}
                  className="bg-surface/30 border-input-outline relative flex flex-col gap-3.5 rounded-xl border p-4 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-[13px] font-semibold antialiased">
                      {currentPurposeType === 'fertilization'
                        ? `Semana ${index + 1}`
                        : `Paso ${index + 1}`}
                    </span>

                    {stepMenuItems.length > 0 && <ActionMenu items={stepMenuItems} />}
                  </div>

                  <FormField
                    required
                    error={stepError}
                    htmlFor={`cycles.${index}.agrochemicalId`}
                    label="Insumo"
                  >
                    <Controller
                      control={control}
                      name={`cycles.${index}.agrochemicalId`}
                      render={({ field: fieldProps }) => (
                        <SelectDropdown
                          error={stepError}
                          options={agroOptions}
                          placeholder="Seleccionar"
                          value={fieldProps.value}
                          onChange={fieldProps.onChange}
                        />
                      )}
                    />
                  </FormField>
                </div>
              )
            })}
          </div>

          {/* Botón centrado en el footer con variante ghost (limitado según propósito) */}
          {fields.length < (currentPurposeType === 'fertilization' ? 4 : 6) && (
            <div className="mt-1 flex justify-center">
              <Button
                className="text-secondary hover:text-primary flex items-center gap-1.5"
                type="button"
                variant="ghost"
                onClick={() => append({ agrochemicalId: '', sequence: fields.length + 1 })}
              >
                <IoAddOutline className="size-4" />
                <span>Agregar Paso</span>
              </Button>
            </div>
          )}

          {errors.cycles && (
            <p className="mt-1 text-center text-xs text-red-500">{errors.cycles.message}</p>
          )}
        </div>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit">
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import type { AgrochemicalWithMix } from './AgrochemicalCard'

import clsx from 'clsx'
import React, { useTransition, useEffect, useRef } from 'react'
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5'
import * as z from 'zod'

import { createAgrochemical, updateAgrochemical } from '@/actions'
import { FormField, Button, SelectDropdown, Input, Textarea, Modal, ActionMenu } from '@/components'
import { useFormDraftStore, useToastStore } from '@/store'
import {
  VALIDATION_LIMITS,
  AgrochemicalType,
  AgrochemicalPurpose,
  DosageUnit,
  DosageUnitLabels,
  DOSAGE_UNIT_OPTIONS,
} from '@/config'

/**
 * Extrae la dosificación estructurada y formateada de un insumo simple.
 */
export function extractAgrochemicalDosage(agro?: AgrochemicalWithMix | null): {
  dosageValue: number | null
  dosageUnit: DosageUnit | null
  displayValue: string
  displayUnit: string
} {
  if (!agro) {
    return { dosageValue: null, dosageUnit: null, displayValue: '', displayUnit: '' }
  }

  const val = agro.dosageValue != null ? Number(agro.dosageValue) : null
  const unit = (agro.dosageUnit as DosageUnit) || null

  let displayVal = ''

  if (val != null) {
    const isSpoon =
      unit === DosageUnit.CDA_L || unit === DosageUnit.CDITA_L || unit === DosageUnit.CDITA_PLANTA

    if (isSpoon && val === 0.5) displayVal = '1/2'
    else if (isSpoon && val === 0.25) displayVal = '1/4'
    else if (isSpoon && val === 0.75) displayVal = '3/4'
    else if (isSpoon && val === 0.125) displayVal = '1/8'
    else if (isSpoon && val === 1.5) displayVal = '1 1/2'
    else displayVal = String(val)
  }

  const displayUnit = unit ? DosageUnitLabels[unit] || unit : ''

  return {
    dosageValue: val,
    dosageUnit: unit,
    displayValue: displayVal,
    displayUnit: displayUnit,
  }
}

/**
 * Convierte un valor de dosis (número decimal o fracción como "1/2", "1/4") a número de punto flotante.
 */
export function parseDosageNumber(raw: string): number | null {
  const trimmed = raw.trim()

  if (!trimmed) return null

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')

    if (parts.length === 2) {
      const num = parseFloat(parts[0])
      const den = parseFloat(parts[1])

      if (!isNaN(num) && !isNaN(den) && den > 0) {
        return Number((num / den).toFixed(3))
      }
    }
  }

  const parsed = parseFloat(trimmed)

  return isNaN(parsed) ? null : parsed
}

/**
 * Retorna el placeholder sugerido para la cantidad según la unidad seleccionada.
 */
export function getDosagePlaceholder(unit?: DosageUnit | null): string {
  if (!unit) return 'Seleccionar'
  if (unit === DosageUnit.PORCENTAJE) return '50'
  if (unit === DosageUnit.GOTAS_L) return '10'
  if (
    unit === DosageUnit.CDITA_PLANTA ||
    unit === DosageUnit.CDITA_L ||
    unit === DosageUnit.CDA_L
  ) {
    return '1/2'
  }
  if (unit === DosageUnit.ML_PLANTA) return '5'

  return ''
}

/**
 * Limpia y normaliza el input de cantidad en base a la unidad seleccionada.
 */
export function cleanDosageInput(raw: string, unit?: DosageUnit | null): string {
  if (!unit) return ''

  const isSpoonUnit =
    unit === DosageUnit.CDITA_PLANTA || unit === DosageUnit.CDITA_L || unit === DosageUnit.CDA_L

  if (isSpoonUnit) {
    const cleaned = raw.replace(/[^0-9./]/g, '')

    if (cleaned.includes('/')) {
      const parts = cleaned.split('/')

      return `${parts[0].slice(0, 2)}/${parts.slice(1).join('').slice(0, 2)}`
    }

    const parts = cleaned.split('.')

    return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
  }

  // Todas las demás unidades (mL/L, g/L, g/planta, mL/planta, %, gotas/L, cc/L) solo aceptan números enteros
  return raw.replace(/[^0-9]/g, '').slice(0, unit === DosageUnit.PORCENTAJE ? 3 : 4)
}

const mixIngredientSchema = z.object({
  ingredientId: z.string().optional().or(z.literal('')),
})

const agrochemicalSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(250, 'El nombre no puede exceder 250 caracteres')
      .optional()
      .or(z.literal('')),
    description: z
      .string()
      .trim()
      .max(
        VALIDATION_LIMITS.LONG_DESC_MAX,
        `La descripción no puede exceder ${VALIDATION_LIMITS.LONG_DESC_MAX} caracteres`,
      )
      .optional()
      .or(z.literal('')),
    type: z.nativeEnum(AgrochemicalType, { message: 'Debes seleccionar un tipo' }),
    purpose: z
      .nativeEnum(AgrochemicalPurpose, { message: 'Debes seleccionar un propósito' })
      .optional()
      .or(z.literal('')),
    isMix: z.boolean(),
    dosageValue: z.string().optional().or(z.literal('')),
    dosageUnit: z
      .nativeEnum(DosageUnit, { message: 'Debes seleccionar la unidad' })
      .optional()
      .or(z.literal('')),
    mixIngredients: z.array(mixIngredientSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isMix) {
      if (!data.name || data.name.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre debe tener al menos 3 caracteres',
          path: ['name'],
        })
      } else if (data.name.trim().length > VALIDATION_LIMITS.SUPPLY_NAME_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El nombre no puede exceder ${VALIDATION_LIMITS.SUPPLY_NAME_MAX} caracteres`,
          path: ['name'],
        })
      }

      if (!data.description || data.description.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La descripción es obligatoria (mínimo 5 caracteres)',
          path: ['description'],
        })
      }

      if (!data.purpose) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar un propósito',
          path: ['purpose'],
        })
      }

      if (!data.dosageUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar la unidad',
          path: ['dosageUnit'],
        })
      }

      if (!data.dosageValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar una cantidad',
          path: ['dosageValue'],
        })
      } else {
        const isSpoonUnit =
          data.dosageUnit === DosageUnit.CDITA_PLANTA ||
          data.dosageUnit === DosageUnit.CDITA_L ||
          data.dosageUnit === DosageUnit.CDA_L

        if (isSpoonUnit) {
          const parsedVal = parseDosageNumber(data.dosageValue)
          const isValidFraction = /^(1\/[248]|3\/4|[1-9]\d*(\/[248])?)$/.test(
            data.dosageValue.trim(),
          )
          const isValidDecimal =
            parsedVal != null &&
            parsedVal > 0 &&
            parsedVal <= 20 &&
            Math.abs((parsedVal * 1000) % 125) === 0

          if (!isValidFraction && !isValidDecimal) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Ingresa una medida de repostería válida (ej. 1, 1/2, 1/4 o 0.5, 0.25)',
              path: ['dosageValue'],
            })
          }
        } else {
          // mL/L, g/L, g/planta, mL/planta, %, gotas/L, cc/L: Solo números enteros mayores a 0
          const isInteger = /^[1-9]\d*$/.test(data.dosageValue.trim())
          const parsedVal = parseInt(data.dosageValue, 10)

          if (!isInteger || isNaN(parsedVal) || parsedVal <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Esta unidad solo acepta números enteros mayores a 0 (sin decimales)',
              path: ['dosageValue'],
            })
          } else if (data.dosageUnit === DosageUnit.PORCENTAJE) {
            if (parsedVal > 100) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Ingresa un porcentaje entero entre 1 y 100',
                path: ['dosageValue'],
              })
            }
          } else if (data.dosageUnit === DosageUnit.GOTAS_L) {
            if (parsedVal > 500) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Ingresa una cantidad de gotas menor o igual a 500',
                path: ['dosageValue'],
              })
            }
          } else if (parsedVal > 1000) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'La cantidad no puede ser mayor a 1000',
              path: ['dosageValue'],
            })
          }
        }
      }
    } else {
      if (
        !data.mixIngredients ||
        data.mixIngredients.length < 2 ||
        data.mixIngredients.some((i) => !i.ingredientId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Una mezcla compuesta debe incluir al menos 2 insumos válidos',
          path: ['mixIngredients'],
        })

        data.mixIngredients?.forEach((i, idx) => {
          if (!i.ingredientId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Debes seleccionar un insumo',
              path: ['mixIngredients', idx, 'ingredientId'],
            })
          }
        })
      } else {
        const selectedIds = data.mixIngredients.map((i) => i.ingredientId).filter(Boolean)
        const uniqueIds = new Set(selectedIds)

        if (uniqueIds.size !== selectedIds.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'No puedes seleccionar el mismo insumo más de una vez en la mezcla',
            path: ['mixIngredients'],
          })
        }
      }
    }
  })

type FormValues = z.infer<typeof agrochemicalSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: AgrochemicalWithMix | null
  availableAgrochemicals?: AgrochemicalWithMix[]
}

/**
 * Convierte el valor de dosis para el input del formulario (soporta fracciones legibles para cucharas).
 */
export function formatDosageInputValue(val?: number | null, unit?: DosageUnit | null): string {
  if (val == null) return ''

  const isSpoon =
    unit === DosageUnit.CDA_L || unit === DosageUnit.CDITA_L || unit === DosageUnit.CDITA_PLANTA

  if (isSpoon) {
    if (val === 0.5) return '1/2'
    if (val === 0.25) return '1/4'
    if (val === 0.75) return '3/4'
    if (val === 0.125) return '1/8'
    if (val === 1.5) return '1 1/2'
  }

  return String(val)
}

function getInitialFormValues(initialData?: AgrochemicalWithMix | null): FormValues {
  if (initialData) {
    const isMix = initialData.isMix || false
    const mixIngredients =
      isMix && initialData.mixIngredients && initialData.mixIngredients.length > 0
        ? initialData.mixIngredients.map((m) => ({ ingredientId: m.ingredientId }))
        : [{ ingredientId: '' }, { ingredientId: '' }]

    return {
      name: initialData.name,
      description: initialData.description || '',
      type: initialData.type,
      purpose: initialData.purpose,
      isMix,
      dosageValue: isMix
        ? ''
        : formatDosageInputValue(initialData.dosageValue, initialData.dosageUnit as DosageUnit),
      dosageUnit: isMix ? undefined : (initialData.dosageUnit as DosageUnit) || undefined,
      mixIngredients,
    }
  }

  return {
    name: '',
    description: '',
    type: '' as AgrochemicalType,
    purpose: '' as AgrochemicalPurpose,
    isMix: false,
    dosageValue: '',
    dosageUnit: undefined,
    mixIngredients: [{ ingredientId: '' }, { ingredientId: '' }],
  }
}

export function AgrochemicalForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  availableAgrochemicals = [],
}: Props) {
  const [isPending, startTransition] = useTransition()
  const isRestoringRef = useRef(false)
  const draftKey = initialData
    ? `agrochemical-edit-draft-${initialData.id}`
    : 'agrochemical-new-draft'

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(agrochemicalSchema),
    defaultValues: getInitialFormValues(initialData),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mixIngredients',
  })

  const selectedType = useWatch({ control, name: 'type' })
  const isMix = useWatch({ control, name: 'isMix' })
  const watchedIngredients = useWatch({ control, name: 'mixIngredients' })
  const watchedName = useWatch({ control, name: 'name' })
  const watchedUnit = useWatch({ control, name: 'dosageUnit' })

  // Cargar borrador de Zustand al abrir (si existe borrador pendiente) o cargar datos iniciales limpios
  useEffect(() => {
    if (isOpen) {
      isRestoringRef.current = true

      const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

      reset(savedDraft ?? getInitialFormValues(initialData))

      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, initialData, reset, draftKey])

  // Persistir cambios en Zustand SOLO cuando el usuario ha interactuado/modificado el formulario (isDirty)
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)

  useEffect(() => {
    if (!isOpen || isRestoringRef.current || !isDirty) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      useFormDraftStore.getState().setDraft(draftKey, JSON.parse(watchedString) as FormValues)
    }
  }, [watchedString, isOpen, isDirty, draftKey])

  // Inferir automáticamente el nombre de la mezcla compuesta
  useEffect(() => {
    if (isMix && watchedIngredients && watchedIngredients.length > 0) {
      const names = watchedIngredients
        .map((item) => availableAgrochemicals.find((a) => a.id === item.ingredientId)?.name)
        .filter(Boolean)

      if (names.length > 0) {
        setValue('name', names.join(' + '))
      }
    }
  }, [isMix, watchedIngredients, availableAgrochemicals, setValue])

  // Opciones de propósito filtradas por el tipo seleccionado
  const purposeOptions = React.useMemo(() => {
    if (selectedType === AgrochemicalType.FERTILIZANTE) {
      return [
        { label: 'Desarrollo', value: AgrochemicalPurpose.DESARROLLO },
        { label: 'Floración', value: AgrochemicalPurpose.FLORACION },
        { label: 'Mantenimiento', value: AgrochemicalPurpose.MANTENIMIENTO },
      ]
    }

    if (selectedType === AgrochemicalType.FITOSANITARIO) {
      return [
        { label: 'Acaricida', value: AgrochemicalPurpose.ACARICIDA },
        { label: 'Bactericida', value: AgrochemicalPurpose.BACTERICIDA },
        { label: 'Fungicida', value: AgrochemicalPurpose.FUNGICIDA },
        { label: 'Insecticida', value: AgrochemicalPurpose.INSECTICIDA },
      ]
    }

    return []
  }, [selectedType])

  // Insumos disponibles para mezclas filtrados por fila para evitar duplicados
  const getFilteredAgroOptions = React.useCallback(
    (currentIndex: number) => {
      if (!selectedType) return []

      const selectedOtherIds = new Set(
        (watchedIngredients || [])
          .filter((_, i) => i !== currentIndex)
          .map((item) => item?.ingredientId)
          .filter(Boolean),
      )

      return availableAgrochemicals
        .filter(
          (a) =>
            !a.isMix &&
            a.id !== initialData?.id &&
            a.type === selectedType &&
            !selectedOtherIds.has(a.id),
        )
        .map((a) => ({ label: a.name, value: a.id }))
    },
    [availableAgrochemicals, initialData, selectedType, watchedIngredients],
  )

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const finalPurpose: AgrochemicalPurpose = values.isMix
        ? availableAgrochemicals.find((a) => a.id === values.mixIngredients?.[0]?.ingredientId)
            ?.purpose ||
          (values.type === AgrochemicalType.FERTILIZANTE
            ? AgrochemicalPurpose.DESARROLLO
            : AgrochemicalPurpose.FUNGICIDA)
        : values.purpose || AgrochemicalPurpose.DESARROLLO

      const parsedValue = values.dosageValue ? parseDosageNumber(values.dosageValue) : null

      const payload = {
        name: values.isMix ? watchedName || values.name || '' : values.name || '',
        description: values.isMix ? '' : values.description || '',
        type: values.type,
        purpose: finalPurpose,
        dosageValue: values.isMix ? null : parsedValue,
        dosageUnit: values.isMix || !values.dosageUnit ? null : (values.dosageUnit as DosageUnit),
        isMix: values.isMix,
        mixIngredients: values.isMix
          ? values.mixIngredients
              ?.filter((i): i is { ingredientId: string } => !!i.ingredientId)
              .map((i) => {
                const agro = availableAgrochemicals.find((a) => a.id === i.ingredientId)
                const { dosageValue, dosageUnit } = extractAgrochemicalDosage(agro)

                return {
                  ingredientId: i.ingredientId,
                  dosageValue: dosageValue ?? 1,
                  dosageUnit: dosageUnit || DosageUnit.ML_L,
                }
              })
          : undefined,
      }

      const result = initialData
        ? await updateAgrochemical(initialData.id, payload)
        : await createAgrochemical(payload)

      if (result.ok) {
        useFormDraftStore.getState().clearDraft(draftKey)
        onSuccess()
        onClose()
      } else {
        useToastStore
          .getState()
          .addToast(result.message || 'Error al procesar la solicitud', 'error')
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={initialData ? 'Editar Insumo' : 'Nuevo Insumo'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit(onSubmit)}>
        {/* 1. Selector de Tipo de Insumo / Preparación (Simple vs Mezcla) */}
        <FormField htmlFor="isMix" label="Preparación">
          <Controller
            control={control}
            name="isMix"
            render={({ field }) => (
              <SelectDropdown
                disabled={!!initialData}
                options={[
                  { label: 'Simple', value: 'false' },
                  { label: 'Mezcla', value: 'true' },
                ]}
                placeholder="Seleccionar"
                value={field.value ? 'true' : 'false'}
                onChange={(val) => {
                  if (!initialData) {
                    field.onChange(val === 'true')
                  }
                }}
              />
            )}
          />
        </FormField>

        {/* 2. Tipo (Fertilizante / Fitosanitario) */}
        <FormField error={errors.type?.message} htmlFor="type" label="Tipo">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectDropdown
                disabled={!!initialData}
                error={errors.type?.message}
                options={[
                  { label: 'Fertilizante', value: AgrochemicalType.FERTILIZANTE },
                  { label: 'Fitosanitario', value: AgrochemicalType.FITOSANITARIO },
                ]}
                placeholder="Seleccionar"
                value={field.value}
                onChange={(val) => {
                  field.onChange(val)
                  setValue('purpose', '' as AgrochemicalPurpose)
                  if (isMix) {
                    setValue('mixIngredients', [{ ingredientId: '' }, { ingredientId: '' }])
                    setValue('name', '')
                  }
                }}
              />
            )}
          />
        </FormField>

        {/* 3. Propósito (Solo para Insumos Simples) */}
        {!isMix && (
          <FormField error={errors.purpose?.message} htmlFor="purpose" label="Propósito">
            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <SelectDropdown
                  error={errors.purpose?.message}
                  options={purposeOptions}
                  placeholder="Seleccionar"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        )}

        {/* 4. Nombre (Solo visible para Insumos Simples, ya que en Mezcla se muestra e infiere en el bloque de composición) */}
        {!isMix && (
          <FormField error={errors.name?.message} htmlFor="name" label="Nombre">
            <Input
              error={errors.name?.message}
              id="name"
              maxLength={VALIDATION_LIMITS.SUPPLY_NAME_MAX}
              placeholder=""
              type="text"
              {...register('name')}
            />
          </FormField>
        )}

        {/* 5. Dosificación ESTRUCTURADA para Producto Simple: Posicionada Primero Unidad y Luego Cantidad */}
        {!isMix ? (
          <div className="grid grid-cols-1 gap-4 tds-xs:grid-cols-2">
            {/* 1. Selector de Unidad */}
            <FormField error={errors.dosageUnit?.message} htmlFor="dosageUnit" label="Unidad">
              <Controller
                control={control}
                name="dosageUnit"
                render={({ field }) => (
                  <SelectDropdown
                    error={errors.dosageUnit?.message}
                    options={DOSAGE_UNIT_OPTIONS}
                    placeholder="Seleccionar"
                    value={field.value || ''}
                    onChange={(val) => {
                      field.onChange(val)
                      const currentVal = control._formValues.dosageValue

                      if (currentVal) {
                        const cleaned = cleanDosageInput(currentVal, val as DosageUnit)

                        setValue('dosageValue', cleaned)
                      }
                    }}
                  />
                )}
              />
            </FormField>

            {/* 2. Input de Cantidad (Deshabilitado si no hay Unidad seleccionada) */}
            <FormField error={errors.dosageValue?.message} htmlFor="dosageValue" label="Cantidad">
              <Input
                className={clsx(!watchedUnit && 'cursor-not-allowed opacity-60')}
                disabled={!watchedUnit}
                error={errors.dosageValue?.message}
                id="dosageValue"
                placeholder={getDosagePlaceholder(
                  watchedUnit ? (watchedUnit as DosageUnit) : undefined,
                )}
                type="text"
                {...register('dosageValue', {
                  onChange: (e) => {
                    const cleaned = cleanDosageInput(
                      e.target.value,
                      watchedUnit ? (watchedUnit as DosageUnit) : undefined,
                    )

                    setValue('dosageValue', cleaned)
                  },
                })}
              />
            </FormField>
          </div>
        ) : (
          /* 6. Sub-formulario para Insumo Compuesto / Mezcla */
          <div className="bg-surface-hover/30 border-input-outline flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-[11px] font-bold uppercase tracking-wider opacity-60">
                Mezcla
              </span>
              <span className="text-primary text-sm font-bold">
                {watchedName || 'Seleccione insumos'}
              </span>
            </div>

            {fields.map((field, idx) => {
              const currentIngredientId = watchedIngredients?.[idx]?.ingredientId
              const selectedAgro = availableAgrochemicals.find((a) => a.id === currentIngredientId)
              const dosageInfo = extractAgrochemicalDosage(selectedAgro)

              return (
                <div
                  key={field.id}
                  className="border-input-outline/40 flex flex-col gap-3 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  {/* FILA 1: DROPDOWN INSUMO W-FULL + ACTION MENU PARA ELIMINAR */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <FormField
                        error={errors.mixIngredients?.[idx]?.ingredientId?.message}
                        htmlFor={`mixIngredients.${idx}.ingredientId`}
                        label={`Insumo ${idx + 1}`}
                      >
                        <Controller
                          control={control}
                          name={`mixIngredients.${idx}.ingredientId`}
                          render={({ field: f }) => (
                            <SelectDropdown
                              disabled={!selectedType}
                              error={errors.mixIngredients?.[idx]?.ingredientId?.message}
                              options={getFilteredAgroOptions(idx)}
                              placeholder={selectedType ? 'Seleccionar' : 'Selecciona Tipo'}
                              value={f.value}
                              onChange={f.onChange}
                            />
                          )}
                        />
                      </FormField>
                    </div>

                    {fields.length > 2 && (
                      <ActionMenu
                        hoverOnly={false}
                        items={[
                          {
                            icon: <IoTrashOutline className="h-4 w-4" />,
                            label: 'Eliminar de la mezcla',
                            variant: 'destructive',
                            onClick: () => remove(idx),
                          },
                        ]}
                        triggerClassName="mt-6"
                      />
                    )}
                  </div>

                  {/* FILA 2: DOSIS Y UNIDAD AUTOCOMPLETADAS NO EDITABLES */}
                  <div className="grid grid-cols-1 gap-4 tds-xs:grid-cols-2">
                    <FormField htmlFor={`mixIngredients.${idx}.dosageValue`} label="Dosis">
                      <Input
                        disabled
                        readOnly
                        className="bg-surface/50 opacity-80 cursor-not-allowed"
                        id={`mixIngredients.${idx}.dosageValue`}
                        placeholder="-"
                        type="text"
                        value={dosageInfo.displayValue}
                      />
                    </FormField>

                    <FormField htmlFor={`mixIngredients.${idx}.dosageUnit`} label="Unidad">
                      <Input
                        disabled
                        readOnly
                        className="bg-surface/50 opacity-80 cursor-not-allowed"
                        id={`mixIngredients.${idx}.dosageUnit`}
                        placeholder="-"
                        type="text"
                        value={dosageInfo.displayUnit}
                      />
                    </FormField>
                  </div>
                </div>
              )
            })}

            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  append({
                    ingredientId: '',
                  })
                }
              >
                <IoAddOutline className="mr-1 h-4 w-4" /> Agregar Insumo
              </Button>
            </div>

            {errors.mixIngredients && (
              <span className="fade-in mt-1 text-center text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                {errors.mixIngredients.message}
              </span>
            )}
          </div>
        )}

        {/* 7. Notas (Solo para Insumos Simples) */}
        {!isMix && (
          <FormField
            error={errors.description?.message}
            htmlFor="description"
            label="Notas / Instrucciones"
          >
            <Textarea
              error={errors.description?.message}
              id="description"
              maxLength={VALIDATION_LIMITS.LONG_DESC_MAX}
              placeholder=""
              {...register('description')}
            />
          </FormField>
        )}

        {/* Botones de Acción Simples "Cancelar" y "Guardar" */}
        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-1 gap-3 border-t px-6 pt-4 tds-sm:grid-cols-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

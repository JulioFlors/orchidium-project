'use client'

import type { AgrochemicalWithMix } from './AgrochemicalCard'

import { AgrochemicalType, AgrochemicalPurpose } from '@package/database/enums'
import React, { useTransition, useEffect, useRef } from 'react'
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5'
import * as z from 'zod'

import { createAgrochemical, updateAgrochemical } from '@/actions'
import { FormField, Button, SelectDropdown, Input, Textarea, Modal, ActionMenu } from '@/components'
import { useFormDraftStore, useToastStore } from '@/store'
import { VALIDATION_LIMITS } from '@/config'

const mixIngredientSchema = z.object({
  ingredientId: z.string().min(1, 'Debes seleccionar un insumo'),
  dosageValue: z
    .string()
    .min(1, 'Ingresa cantidad')
    .regex(/^[1-9][0-9]?$/, 'Ingresa un entero válido del 1 al 99'),
  dosageUnit: z.enum(['ML_L', 'G_L'] as const, {
    message: 'Seleccionar',
  }),
})

const agrochemicalSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(
        VALIDATION_LIMITS.SUPPLY_NAME_MAX,
        `El nombre no puede exceder ${VALIDATION_LIMITS.SUPPLY_NAME_MAX} caracteres`,
      ),
    description: z
      .string()
      .trim()
      .min(5, 'La descripción es obligatoria (mínimo 5 caracteres)')
      .max(
        VALIDATION_LIMITS.LONG_DESC_MAX,
        `La descripción no puede exceder ${VALIDATION_LIMITS.LONG_DESC_MAX} caracteres`,
      ),
    type: z.nativeEnum(AgrochemicalType, { message: 'Debes seleccionar un tipo' }),
    purpose: z
      .nativeEnum(AgrochemicalPurpose, { message: 'Debes seleccionar un propósito' })
      .optional(),
    isMix: z.boolean(),
    dosageValue: z.string().optional(),
    dosageUnit: z.enum(['ML_L', 'G_L'] as const).optional(),
    mixIngredients: z.array(mixIngredientSchema).optional(),
  })

  .refine(
    (data) => {
      if (!data.isMix) {
        return !!data.purpose
      }

      return true
    },
    {
      message: 'Debes seleccionar un propósito',
      path: ['purpose'],
    },
  )
  .refine(
    (data) => {
      if (!data.isMix) {
        return !!data.dosageValue && /^[1-9][0-9]?$/.test(data.dosageValue)
      }

      return true
    },
    {
      message: 'Ingresa una cantidad entera válida del 1 al 99',
      path: ['dosageValue'],
    },
  )
  .refine(
    (data) => {
      if (!data.isMix) {
        return !!data.dosageUnit
      }

      return true
    },
    {
      message: 'Debes seleccionar la unidad',
      path: ['dosageUnit'],
    },
  )
  .refine(
    (data) => {
      if (data.isMix) {
        return !!data.mixIngredients && data.mixIngredients.length >= 2
      }

      return true
    },
    {
      message: 'Una mezcla compuesta debe incluir al menos 2 insumos',
      path: ['mixIngredients'],
    },
  )
  .refine(
    (data) => {
      if (data.isMix && data.mixIngredients && data.mixIngredients.length > 0) {
        const selectedIds = data.mixIngredients.map((i) => i.ingredientId).filter(Boolean)
        const uniqueIds = new Set(selectedIds)

        return uniqueIds.size === selectedIds.length
      }

      return true
    },
    {
      message: 'No puedes seleccionar el mismo insumo más de una vez en la mezcla',
      path: ['mixIngredients'],
    },
  )

type FormValues = z.infer<typeof agrochemicalSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: AgrochemicalWithMix | null
  availableAgrochemicals?: AgrochemicalWithMix[]
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
  const draftKey = 'agrochemical-form-draft'

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(agrochemicalSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '' as AgrochemicalType,
      purpose: '' as AgrochemicalPurpose,
      isMix: false,
      dosageValue: '',
      dosageUnit: undefined,
      mixIngredients: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mixIngredients',
  })

  const selectedType = useWatch({ control, name: 'type' })
  const isMix = useWatch({ control, name: 'isMix' })
  const watchedIngredients = useWatch({ control, name: 'mixIngredients' })
  const watchedName = useWatch({ control, name: 'name' })

  // Cargar borrador de Zustand al abrir (solo si es nuevo insumo) o cargar datos iniciales en edición
  useEffect(() => {
    if (isOpen) {
      isRestoringRef.current = true

      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description,
          type: initialData.type,
          purpose: initialData.purpose,
          isMix: initialData.isMix || false,
          dosageValue: initialData.dosageValue ? String(initialData.dosageValue) : '',
          dosageUnit: (initialData.dosageUnit as 'ML_L' | 'G_L') || undefined,
          mixIngredients: initialData.mixIngredients
            ? initialData.mixIngredients.map((m) => ({
                ingredientId: m.ingredientId,
                dosageValue: String(m.dosageValue),
                dosageUnit: m.dosageUnit,
              }))
            : [],
        })
      } else {
        const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

        reset(
          savedDraft ?? {
            name: '',
            description: '',
            type: '' as AgrochemicalType,
            purpose: '' as AgrochemicalPurpose,
            isMix: false,
            dosageValue: '',
            dosageUnit: undefined,
            mixIngredients: [
              { ingredientId: '', dosageValue: '', dosageUnit: 'ML_L' },
              { ingredientId: '', dosageValue: '', dosageUnit: 'ML_L' },
            ],
          },
        )
      }

      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, initialData, reset])

  // Persistir cambios en Zustand en tiempo real para mantener el estado del borrador
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)

  useEffect(() => {
    if (!isOpen || isRestoringRef.current || !!initialData) return

    const currentDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

    if (JSON.stringify(currentDraft) !== watchedString) {
      useFormDraftStore.getState().setDraft(draftKey, JSON.parse(watchedString) as FormValues)
    }
  }, [watchedString, isOpen, initialData])

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
            (!selectedType || a.type === selectedType) &&
            !selectedOtherIds.has(a.id),
        )
        .map((a) => ({ label: a.name, value: a.id }))
    },
    [availableAgrochemicals, initialData, selectedType, watchedIngredients],
  )

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let prepText = ''

      if (values.isMix && values.mixIngredients && values.mixIngredients.length > 0) {
        prepText = values.mixIngredients
          .map((item) => {
            const agro = availableAgrochemicals.find((a) => a.id === item.ingredientId)
            const unitLabel = item.dosageUnit === 'ML_L' ? 'mL/L' : 'g/L'

            return `${agro?.name || 'Insumo'} (${item.dosageValue} ${unitLabel})`
          })
          .join(' + ')
      } else {
        const unitLabel = values.dosageUnit === 'ML_L' ? 'mL/L' : 'g/L'

        prepText = `${values.dosageValue} ${unitLabel}`
      }

      const finalPurpose: AgrochemicalPurpose = values.isMix
        ? availableAgrochemicals.find((a) => a.id === values.mixIngredients?.[0]?.ingredientId)
            ?.purpose ||
          (values.type === AgrochemicalType.FERTILIZANTE
            ? AgrochemicalPurpose.DESARROLLO
            : AgrochemicalPurpose.FUNGICIDA)
        : values.purpose || AgrochemicalPurpose.DESARROLLO

      const payload = {
        name: values.name,
        description: values.description,
        type: values.type,
        purpose: finalPurpose,
        preparation: prepText,
        dosageValue: values.isMix ? null : Number(values.dosageValue),
        dosageUnit: values.isMix ? null : values.dosageUnit,
        isMix: values.isMix,
        mixIngredients: values.isMix
          ? values.mixIngredients?.map((i) => ({
              ingredientId: i.ingredientId,
              dosageValue: Number(i.dosageValue),
              dosageUnit: i.dosageUnit,
            }))
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
        <FormField required error={errors.type?.message} htmlFor="type" label="Tipo">
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
                }}
              />
            )}
          />
        </FormField>

        {/* 3. Propósito (Solo para Insumos Simples) */}
        {!isMix && (
          <FormField required error={errors.purpose?.message} htmlFor="purpose" label="Propósito">
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
          <FormField required error={errors.name?.message} htmlFor="name" label="Nombre">
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

        {/* 5. Dosificación ESTRUCTURADA para Producto Simple */}
        {!isMix ? (
          <div className="grid grid-cols-1 gap-4 tds-xs:grid-cols-2">
            <FormField
              required
              error={errors.dosageValue?.message}
              htmlFor="dosageValue"
              label="Cantidad"
            >
              <Input
                error={errors.dosageValue?.message}
                id="dosageValue"
                maxLength={2}
                placeholder=""
                type="text"
                {...register('dosageValue', {
                  onChange: (e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)

                    setValue('dosageValue', cleaned)
                  },
                })}
              />
            </FormField>

            <FormField
              required
              error={errors.dosageUnit?.message}
              htmlFor="dosageUnit"
              label="Unidad"
            >
              <Controller
                control={control}
                name="dosageUnit"
                render={({ field }) => (
                  <SelectDropdown
                    error={errors.dosageUnit?.message}
                    options={[
                      { label: 'mL/L', value: 'ML_L' },
                      { label: 'g/L', value: 'G_L' },
                    ]}
                    placeholder="Seleccionar"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
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
                {watchedName || 'Seleccione insumos...'}
              </span>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="border-input-outline/40 flex flex-col gap-3 border-b pb-4"
              >
                {/* FILA 1: DROPDOWN INSUMO W-FULL + ACTION MENU PARA ELIMINAR */}
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1">
                    <FormField
                      required
                      error={errors.mixIngredients?.[idx]?.ingredientId?.message}
                      htmlFor={`mixIngredients.${idx}.ingredientId`}
                      label={`Insumo ${idx + 1}`}
                    >
                      <Controller
                        control={control}
                        name={`mixIngredients.${idx}.ingredientId`}
                        render={({ field: f }) => (
                          <SelectDropdown
                            error={errors.mixIngredients?.[idx]?.ingredientId?.message}
                            options={getFilteredAgroOptions(idx)}
                            placeholder="Seleccionar"
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
                      triggerClassName="mb-1"
                    />
                  )}
                </div>

                {/* FILA 2: DOSIS Y UNIDAD (MISMO ANCHO 50/50 QUE COLAPSA SOLO EN <= tds-xs) */}
                <div className="grid grid-cols-1 gap-4 tds-xs:grid-cols-2">
                  <FormField
                    required
                    error={errors.mixIngredients?.[idx]?.dosageValue?.message}
                    htmlFor={`mixIngredients.${idx}.dosageValue`}
                    label="Dosis"
                  >
                    <Input
                      error={errors.mixIngredients?.[idx]?.dosageValue?.message}
                      maxLength={2}
                      placeholder=""
                      type="text"
                      {...register(`mixIngredients.${idx}.dosageValue` as const, {
                        onChange: (e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)

                          setValue(`mixIngredients.${idx}.dosageValue`, cleaned)
                        },
                      })}
                    />
                  </FormField>

                  <FormField
                    required
                    error={errors.mixIngredients?.[idx]?.dosageUnit?.message}
                    htmlFor={`mixIngredients.${idx}.dosageUnit`}
                    label="Unidad"
                  >
                    <Controller
                      control={control}
                      name={`mixIngredients.${idx}.dosageUnit`}
                      render={({ field: f }) => (
                        <SelectDropdown
                          error={errors.mixIngredients?.[idx]?.dosageUnit?.message}
                          options={[
                            { label: 'mL/L', value: 'ML_L' },
                            { label: 'g/L', value: 'G_L' },
                          ]}
                          placeholder="Seleccionar"
                          value={f.value}
                          onChange={f.onChange}
                        />
                      )}
                    />
                  </FormField>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  append({
                    ingredientId: '',
                    dosageValue: '',
                    dosageUnit: 'ML_L',
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

        {/* 7. Notas */}
        <FormField
          required
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

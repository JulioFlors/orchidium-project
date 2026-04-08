'use client'

import { type Agrochemical } from '@package/database'
import { AgrochemicalType, AgrochemicalPurpose } from '@package/database/enums'
import React, { useTransition } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { createAgrochemical, updateAgrochemical } from '@/actions'
import { FormField, Button, SelectDropdown } from '@/components/ui'

const agrochemicalSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(5, 'La descripción es obligatoria'),
  type: z.nativeEnum(AgrochemicalType),
  purpose: z.nativeEnum(AgrochemicalPurpose),
  preparation: z.string().min(2, 'La preparación es obligatoria (ej: 1g/L)'),
})

type FormValues = z.infer<typeof agrochemicalSchema>

interface Props {
  initialData?: Agrochemical | null
  onSuccess: () => void
  onCancel: () => void
}

export function AgrochemicalForm({ initialData, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(agrochemicalSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          type: initialData.type,
          purpose: initialData.purpose,
          preparation: initialData.preparation,
        }
      : {
          type: AgrochemicalType.FERTILIZANTE,
          purpose: AgrochemicalPurpose.DESARROLLO,
        },
  })

  const selectedType = useWatch({ control, name: 'type' })
  const currentPurpose = useWatch({ control, name: 'purpose' })

  // Opciones de propósito filtradas por tipo
  const purposeOptions = React.useMemo(() => {
    if (selectedType === AgrochemicalType.FERTILIZANTE) {
      return [
        { label: 'Desarrollo', value: AgrochemicalPurpose.DESARROLLO },
        { label: 'Floración', value: AgrochemicalPurpose.FLORACION },
        { label: 'Mantenimiento', value: AgrochemicalPurpose.MANTENIMIENTO },
      ]
    }

    return [
      { label: 'Acaricida', value: AgrochemicalPurpose.ACARICIDA },
      { label: 'Bactericida', value: AgrochemicalPurpose.BACTERICIDA },
      { label: 'Fungicida', value: AgrochemicalPurpose.FUNGICIDA },
      { label: 'Insecticida', value: AgrochemicalPurpose.INSECTICIDA },
    ]
  }, [selectedType])

  // Si el tipo cambia y el propósito actual no es válido para el nuevo tipo, lo reseteamos
  React.useEffect(() => {
    const isValid = purposeOptions.some((opt) => opt.value === currentPurpose)

    if (!isValid) {
      setValue('purpose', purposeOptions[0].value)
    }
  }, [selectedType, purposeOptions, setValue, currentPurpose])

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = initialData
        ? await updateAgrochemical(initialData.id, values)
        : await createAgrochemical(values)

      if (result.ok) {
        alert(initialData ? 'Insumo actualizado' : 'Insumo creado correctamente')
        onSuccess()
      } else {
        alert(result.message || 'Error al procesar la solicitud')
      }
    })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <FormField htmlFor="name" label="Nombre del Insumo">
        <input
          {...register('name')}
          className="bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          id="name"
          placeholder="Ej: Osmocote Plus"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField htmlFor="type" label="Tipo">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectDropdown
                options={[
                  { label: 'Fertilizante', value: AgrochemicalType.FERTILIZANTE },
                  { label: 'Fitosanitario', value: AgrochemicalType.FITOSANITARIO },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField htmlFor="purpose" label="Propósito">
          <Controller
            control={control}
            name="purpose"
            render={({ field }) => (
              <SelectDropdown
                options={purposeOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
      </div>

      <FormField htmlFor="preparation" label="Preparación / Dosis">
        <input
          {...register('preparation')}
          className="bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          id="preparation"
          placeholder="Ej: 1 gramo por litro de agua"
        />
        {errors.preparation && (
          <p className="mt-1 text-xs text-red-500">{errors.preparation.message}</p>
        )}
      </FormField>

      <FormField htmlFor="description" label="Descripción / Notas">
        <textarea
          {...register('description')}
          className="bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          id="description"
          placeholder="Indique los beneficios o advertencias de uso..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button isLoading={isPending} type="submit">
          {initialData ? 'Actualizar Insumo' : 'Guardar Insumo'}
        </Button>
      </div>
    </form>
  )
}

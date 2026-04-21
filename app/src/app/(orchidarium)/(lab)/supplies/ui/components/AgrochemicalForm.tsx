'use client'

import { type Agrochemical } from '@package/database'
import { AgrochemicalType, AgrochemicalPurpose } from '@package/database/enums'
import React, { useTransition } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { createAgrochemical, updateAgrochemical } from '@/actions'
import { FormField, Button, SelectDropdown, Input, Textarea, Modal } from '@/components/ui'

const agrochemicalSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(5, 'La descripción es obligatoria'),
  type: z.nativeEnum(AgrochemicalType),
  purpose: z.nativeEnum(AgrochemicalPurpose),
  preparation: z.string().min(2, 'La preparación es obligatoria (ej: 1g/L)'),
})

type FormValues = z.infer<typeof agrochemicalSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Agrochemical | null
}

export function AgrochemicalForm({ isOpen, onClose, onSuccess, initialData }: Props) {
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
        onSuccess()
        onClose()
      } else {
        alert(result.message || 'Error al procesar la solicitud')
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
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <FormField htmlFor="name" label="Nombre">
          <Input
            error={errors.name?.message}
            id="name"
            placeholder=""
            type="text"
            {...register('name')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
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

        <FormField htmlFor="preparation" label="Preparación">
          <Input
            error={errors.preparation?.message}
            id="preparation"
            placeholder="ml/L"
            type="text"
            {...register('preparation')}
          />
        </FormField>

        <FormField htmlFor="description" label="Notas">
          <Textarea
            error={errors.description?.message}
            id="description"
            placeholder="Beneficios y advertencias de uso."
            {...register('description')}
          />
        </FormField>

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

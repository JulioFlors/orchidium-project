'use client'

import { type Agrochemical } from '@package/database'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useTransition } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { IoAddOutline, IoTrashOutline, IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5'
import * as z from 'zod'

import { upsertFertilizationProgram, upsertPhytosanitaryProgram } from '@/actions'
import { FormField, Button, SelectDropdown } from '@/components/ui'

const cycleSchema = z.object({
  agrochemicalId: z.string().min(1, 'Debe seleccionar un insumo'),
  sequence: z.number(),
})

const programSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  frequency: z.number().min(1, 'La frecuencia debe ser al menos 1'),
  cycles: z.array(cycleSchema).min(1, 'Debe agregar al menos un paso al programa'),
})

type FormValues = z.infer<typeof programSchema>

// Interfaces locales para los programas con sus ciclos
interface ProgramWithCycles {
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
  type: 'fertilization' | 'phytosanitary'
  initialData?: ProgramWithCycles | null
  availableAgrochemicals: Agrochemical[]
  onSuccess: () => void
  onCancel: () => void
}

export function ProgramForm({
  type,
  initialData,
  availableAgrochemicals,
  onSuccess,
  onCancel,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          frequency:
            type === 'fertilization' ? initialData.weeklyFrequency : initialData.monthlyFrequency,
          cycles: initialData.productsCycle.map((pc) => ({
            agrochemicalId: pc.agrochemicalId,
            sequence: pc.sequence,
          })),
        }
      : {
          name: '',
          frequency: 1,
          cycles: [{ agrochemicalId: '', sequence: 1 }],
        },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'cycles',
  })

  const agroOptions = React.useMemo(() => {
    return availableAgrochemicals.map((a) => ({
      label: `${a.name} (${a.purpose})`,
      value: a.id,
    }))
  }, [availableAgrochemicals])

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const formattedCycles = values.cycles.map((c, index) => ({
        ...c,
        sequence: index + 1,
      }))

      const payload = {
        id: initialData?.id,
        name: values.name,
        [type === 'fertilization' ? 'weeklyFrequency' : 'monthlyFrequency']: values.frequency,
        cycles: formattedCycles,
      }

      const result =
        type === 'fertilization'
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
        alert('Programa guardado correctamente')
        onSuccess()
      } else {
        alert(result.message || 'Error al guardar el programa')
      }
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField htmlFor="name" label="Nombre del Programa">
          <input
            {...register('name')}
            className="bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            id="name"
            placeholder="Ej: Desarrollo Solucat"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </FormField>

        <FormField
          htmlFor="frequency"
          label={type === 'fertilization' ? 'Frecuencia Semanal' : 'Frecuencia Mensual'}
        >
          <input
            {...register('frequency', { valueAsNumber: true })}
            className="bg-canvas text-primary border-input-outline hover:border-input-outline-hover focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            id="frequency"
            min="1"
            type="number"
          />
          {errors.frequency && (
            <p className="mt-1 text-xs text-red-500">{errors.frequency.message}</p>
          )}
        </FormField>
      </div>

      <div className="space-y-4">
        <div className="border-divider flex items-center justify-between border-b pb-2">
          <h3 className="text-secondary text-sm font-semibold tracking-wider uppercase">
            Pasos / Ciclo de Productos
          </h3>
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => append({ agrochemicalId: '', sequence: fields.length + 1 })}
          >
            <IoAddOutline className="mr-1 h-4 w-4" />
            Agregar Paso
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border-divider flex items-end gap-3 rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-800/30"
          >
            <div className="bg-brand-primary/10 text-brand-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold">
              {index + 1}
            </div>

            <div className="flex-1">
              <FormField htmlFor={`cycles.${index}.agrochemicalId`} label="Insumo">
                <Controller
                  control={control}
                  name={`cycles.${index}.agrochemicalId`}
                  render={({ field: fieldProps }) => (
                    <SelectDropdown
                      options={agroOptions}
                      placeholder="Seleccione un insumo"
                      value={fieldProps.value}
                      onChange={fieldProps.onChange}
                    />
                  )}
                />
              </FormField>
            </div>

            <div className="flex gap-1 pb-1">
              <Button
                disabled={index === 0}
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => move(index, index - 1)}
              >
                <IoArrowUpOutline className="h-4 w-4" />
              </Button>

              <Button
                disabled={index === fields.length - 1}
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => move(index, index + 1)}
              >
                <IoArrowDownOutline className="h-4 w-4" />
              </Button>

              <Button
                className="text-red-500"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              >
                <IoTrashOutline className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {errors.cycles && (
          <p className="mt-2 text-center text-sm text-red-500">{errors.cycles.message}</p>
        )}
      </div>

      <div className="border-divider flex justify-end gap-3 border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button isLoading={isPending} type="submit">
          {initialData ? 'Actualizar Programa' : 'Crear Programa'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { type Agrochemical } from '@package/database'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useTransition } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { IoAddOutline, IoTrashOutline, IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5'
import * as z from 'zod'

import { upsertFertilizationProgram, upsertPhytosanitaryProgram } from '@/actions'
import { FormField, Button, SelectDropdown, Input, Modal } from '@/components/ui'
import { useFormDraftStore } from '@/store'

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
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'fertilization' | 'phytosanitary'
  initialData?: ProgramWithCycles | null
  availableAgrochemicals: Agrochemical[]
}

export function ProgramForm({
  isOpen,
  onClose,
  onSuccess,
  type,
  initialData,
  availableAgrochemicals,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const draftKey = `program-draft-${type}`
  const isRestoringRef = React.useRef(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
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

  // Cargar borrador al abrir el modal (solo para creación, es decir, cuando no hay initialData)
  React.useEffect(() => {
    if (isOpen && !initialData) {
      const savedDraft = useFormDraftStore.getState().getDraft(draftKey) as FormValues | undefined

      isRestoringRef.current = true
      reset(
        savedDraft ?? {
          name: '',
          frequency: 1,
          cycles: [{ agrochemicalId: '', sequence: 1 }],
        },
      )
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    } else if (isOpen && initialData) {
      // Si estamos editando, cargar los datos iniciales
      isRestoringRef.current = true
      reset({
        name: initialData.name,
        frequency:
          type === 'fertilization' ? initialData.weeklyFrequency : initialData.monthlyFrequency,
        cycles: initialData.productsCycle.map((pc) => ({
          agrochemicalId: pc.agrochemicalId,
          sequence: pc.sequence,
        })),
      })
      requestAnimationFrame(() => {
        isRestoringRef.current = false
      })
    }
  }, [isOpen, initialData, reset, draftKey, type])

  // Persistir cambios en tiempo real
  const watchedValues = useWatch({ control })
  const watchedString = JSON.stringify(watchedValues)

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

  const agroOptions = React.useMemo(() => {
    // Filtrar agroquímicos según el tipo de programa
    const filtered = availableAgrochemicals.filter((a) => {
      if (type === 'fertilization') {
        // Nutrición/Fertilización
        return (
          a.purpose === 'DESARROLLO' || a.purpose === 'FLORACION' || a.purpose === 'MANTENIMIENTO'
        )
      } else {
        // Protección Fitosanitaria
        return (
          a.purpose === 'ACARICIDA' ||
          a.purpose === 'BACTERICIDA' ||
          a.purpose === 'FUNGICIDA' ||
          a.purpose === 'INSECTICIDA'
        )
      }
    })

    return filtered.map((a) => ({
      label: `${a.name} (${a.purpose})`,
      value: a.id,
    }))
  }, [availableAgrochemicals, type])

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
        useFormDraftStore.getState().clearDraft(draftKey)
        onSuccess()
        onClose()
      } else {
        alert(result.message || 'Error al guardar el programa')
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={
        type === 'fertilization'
          ? `${initialData ? 'Editar' : 'Nueva'} Receta de Fertirriego`
          : `${initialData ? 'Editar' : 'Nuevo'} Plan Fitosanitario`
      }
      onClose={onClose}
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="name" label="Nombre del Programa">
            <Input
              error={errors.name?.message}
              id="name"
              placeholder="Ej: Desarrollo Solucat"
              type="text"
              {...register('name')}
            />
          </FormField>

          <FormField
            htmlFor="frequency"
            label={type === 'fertilization' ? 'Frecuencia Semanal' : 'Frecuencia Mensual'}
          >
            <Input
              error={errors.frequency?.message}
              id="frequency"
              min="1"
              type="number"
              {...register('frequency', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <div className="space-y-4">
          <div className="border-divider flex items-center justify-between border-b pb-2">
            <h3 className="text-secondary text-[11px] font-bold tracking-wider uppercase opacity-60">
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

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-surface/30 border-input-outline hover:border-action/20 group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-all"
              >
                <div className="flex items-center justify-between border-b border-dashed border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-action/10 text-action flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-secondary text-[11px] font-bold tracking-tight uppercase opacity-60">
                      Paso del Ciclo
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      className="size-7!"
                      disabled={index === 0}
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => move(index, index - 1)}
                    >
                      <IoArrowUpOutline className="size-3.5" />
                    </Button>
                    <Button
                      className="size-7!"
                      disabled={index === fields.length - 1}
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => move(index, index + 1)}
                    >
                      <IoArrowDownOutline className="size-3.5" />
                    </Button>
                    <Button
                      className="size-7! text-red-500/60 hover:text-red-500"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => remove(index)}
                    >
                      <IoTrashOutline className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField htmlFor={`cycles.${index}.agrochemicalId`} label="Insumo a aplicar">
                    <Controller
                      control={control}
                      name={`cycles.${index}.agrochemicalId`}
                      render={({ field: fieldProps }) => (
                        <SelectDropdown
                          options={agroOptions}
                          placeholder="Seleccione un insumo del inventario"
                          value={fieldProps.value}
                          onChange={fieldProps.onChange}
                        />
                      )}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          {errors.cycles && (
            <p className="mt-2 text-center text-sm text-red-500">{errors.cycles.message}</p>
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

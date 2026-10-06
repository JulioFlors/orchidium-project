'use client'

import { useState } from 'react'
import { MdLocalFlorist, MdEventAvailable, MdHistory, MdOutlineStickyNote2 } from 'react-icons/md'

import { Modal, FormField, Input, Textarea, Button, Badge } from '@/components'
import { VALIDATION_LIMITS } from '@/config'
import { getTodayCalendarString, toCalendarDateString, formatCalendarDate } from '@/utils'

export interface FloweringFormValues {
  eventId?: string
  startDate: string
  endDate?: string | null
  notes?: string
}

export interface TargetPlantFlowering {
  id: string
  FloweringEvent?: Array<{
    id: string
    startDate: Date | string
    endDate?: Date | string | null
    notes?: string | null
  }>
}

interface FloweringEventModalProps {
  isOpen: boolean
  isPending: boolean
  targetPlant?: TargetPlantFlowering | null
  onClose: () => void
  onSave: (values: FloweringFormValues) => void
}

export function FloweringEventModal({
  isOpen,
  isPending,
  targetPlant,
  onClose,
  onSave,
}: FloweringEventModalProps) {
  const activeFlowering = targetPlant?.FloweringEvent?.find((e) => !e.endDate)
  const isClosing = !!activeFlowering

  const todayStr = getTodayCalendarString()

  const [startDate, setStartDate] = useState<string>(todayStr)
  const [endDate, setEndDate] = useState<string>(todayStr)
  const [registrationType, setRegistrationType] = useState<'in_progress' | 'completed'>(
    'in_progress',
  )
  const [notes, setNotes] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [prevOpenState, setPrevOpenState] = useState<{
    open: boolean
    plantId?: string
    eventId?: string
  }>({
    open: false,
    plantId: undefined,
    eventId: undefined,
  })

  const currentEventId = activeFlowering?.id

  if (
    isOpen !== prevOpenState.open ||
    targetPlant?.id !== prevOpenState.plantId ||
    currentEventId !== prevOpenState.eventId
  ) {
    setPrevOpenState({
      open: isOpen,
      plantId: targetPlant?.id,
      eventId: currentEventId,
    })
    if (isOpen) {
      setErrorMsg(null)
      if (activeFlowering) {
        // Modo Cierre de Floración
        const activeStartStr = toCalendarDateString(activeFlowering.startDate)

        setStartDate(activeStartStr)
        setEndDate(todayStr)
        setNotes(activeFlowering.notes || '')
      } else {
        // Modo Registro Nuevo
        setStartDate(todayStr)
        setEndDate(todayStr)
        setRegistrationType('in_progress')
        setNotes('')
      }
    }
  }

  if (!targetPlant) return null

  // Cálculo de días transcurridos para la tarjeta resumen en modo Cierre
  let daysElapsed = 0
  let formattedStartDate = ''

  if (activeFlowering) {
    const startObj = new Date(activeFlowering.startDate)
    const nowObj = new Date()

    daysElapsed = Math.max(
      0,
      Math.floor((nowObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)),
    )
    formattedStartDate = formatCalendarDate(activeFlowering.startDate)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (isClosing && activeFlowering) {
      if (endDate < startDate) {
        setErrorMsg('La fecha de finalización no puede ser anterior a la fecha de inicio.')

        return
      }

      onSave({
        eventId: activeFlowering.id,
        startDate,
        endDate,
        notes: notes.trim() ? notes : undefined,
      })
    } else {
      if (registrationType === 'completed' && endDate < startDate) {
        setErrorMsg('La fecha de cierre no puede ser anterior a la fecha de inicio.')

        return
      }

      onSave({
        startDate,
        endDate: registrationType === 'completed' ? endDate : null,
        notes: notes.trim() ? notes : undefined,
      })
    }
  }

  const hasPreviousNotes = Boolean(
    activeFlowering?.notes && activeFlowering.notes.trim().length > 0,
  )

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle={`#${targetPlant.id.slice(-8).toUpperCase()}`}
      title={isClosing ? 'Finalizar Floración' : 'Registrar Floración'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Error inline si existe */}
        {errorMsg && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {isClosing && activeFlowering ? (
          /* MODO CIERRE: Resumen del evento activo + Input de Fecha de Finalización */
          <div className="flex flex-col gap-4">
            <div className="border-input-outline bg-surface/50 flex items-center justify-between gap-3 rounded-xl border p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                  <MdLocalFlorist className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-primary text-xs font-bold">Floración en Curso</span>
                  <span className="text-secondary text-[11px] opacity-70">
                    Iniciada el {formattedStartDate}
                  </span>
                </div>
              </div>
              <Badge className="border border-fuchsia-500/20 bg-fuchsia-500/10 font-mono text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                {daysElapsed} {daysElapsed === 1 ? 'día' : 'días'}
              </Badge>
            </div>

            {/* Visualización de notas registradas previamente si existen */}
            {hasPreviousNotes && (
              <div className="bg-surface/50 border-input-outline flex flex-col gap-1.5 rounded-xl border p-3">
                <div className="text-secondary flex items-center gap-1.5 text-[11px] font-semibold opacity-75">
                  <MdOutlineStickyNote2 className="size-3.5 opacity-70" />
                  <span>Notas registradas de este ciclo:</span>
                </div>
                <p className="text-secondary bg-surface/40 border-black-and-white/5 whitespace-pre-wrap rounded-lg border p-2.5 font-mono text-xs italic break-words">
                  &ldquo;{activeFlowering.notes}&rdquo;
                </p>
              </div>
            )}

            <FormField htmlFor="flowering-end-date" label="Fecha de Finalización">
              <Input
                required
                className="cursor-pointer dark:scheme-dark"
                id="flowering-end-date"
                min={startDate}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker()
                  } catch {
                    // Fallback
                  }
                }}
              />
            </FormField>

            <FormField
              htmlFor="flowering-notes"
              label={
                hasPreviousNotes
                  ? 'Notas de Floración (Editar o complementar)'
                  : 'Notas de Cierre (Opcional)'
              }
            >
              <Textarea
                className="min-h-24 resize-none text-xs"
                id="flowering-notes"
                maxLength={VALIDATION_LIMITS.OBSERVATION_MAX}
                placeholder="Ej. Abundante floración, 5 flores abiertas, fragancia intensa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {hasPreviousNotes && (
                <span className="text-secondary mt-1 block text-[11px] opacity-60">
                  El texto previo está precargado en el campo. Puedes modificarlo o agregar tus
                  observaciones finales.
                </span>
              )}
            </FormField>
          </div>
        ) : (
          /* MODO REGISTRO: Toggle Tipo de Registro + Formulario */
          <div className="flex flex-col gap-4">
            {/* Modalidad de Registro */}
            <div className="border-input-outline grid grid-cols-2 gap-2 rounded-xl border p-1 bg-surface/40">
              <button
                className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${
                  registrationType === 'in_progress'
                    ? 'bg-surface text-primary shadow-xs border border-input-outline'
                    : 'text-secondary hover:text-primary opacity-70'
                }`}
                type="button"
                onClick={() => setRegistrationType('in_progress')}
              >
                <MdEventAvailable className="size-4 text-fuchsia-500" />
                En Curso
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${
                  registrationType === 'completed'
                    ? 'bg-surface text-primary shadow-xs border border-input-outline'
                    : 'text-secondary hover:text-primary opacity-70'
                }`}
                type="button"
                onClick={() => setRegistrationType('completed')}
              >
                <MdHistory className="size-4 text-indigo-500" />
                Completa (Histórico)
              </button>
            </div>

            <div
              className={`grid gap-4 ${registrationType === 'completed' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
            >
              <FormField htmlFor="flowering-start-date" label="Fecha de Inicio">
                <Input
                  required
                  className="cursor-pointer dark:scheme-dark"
                  id="flowering-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker()
                    } catch {
                      // Fallback
                    }
                  }}
                />
              </FormField>

              {registrationType === 'completed' && (
                <FormField htmlFor="flowering-end-date" label="Fecha de Finalización">
                  <Input
                    required
                    className="cursor-pointer dark:scheme-dark"
                    id="flowering-end-date"
                    min={startDate}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker()
                      } catch {
                        // Fallback
                      }
                    }}
                  />
                </FormField>
              )}
            </div>

            <FormField htmlFor="flowering-notes" label="Notas Observacionales (Opcional)">
              <Textarea
                className="min-h-20 resize-none text-xs"
                id="flowering-notes"
                maxLength={VALIDATION_LIMITS.OBSERVATION_MAX}
                placeholder="Ej. Primera floración del ejemplar, botón floral abierto..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>
          </div>
        )}

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit" variant="primary">
            {isClosing ? 'Finalizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { MdLocalFlorist, MdEventAvailable, MdHistory, MdOutlineStickyNote2 } from 'react-icons/md'

import { Modal, FormField, Input, Textarea, Button, Badge } from '@/components'
import { useFormDraftStore } from '@/store'
import { VALIDATION_LIMITS } from '@/config'
import { getTodayCalendarString, toCalendarDateString, formatCalendarDate } from '@/utils'

export function getFloweringCloseDraftKey(eventId: string) {
  return `flowering-close-draft-${eventId}`
}

export function getFloweringCreateDraftKey(plantId: string) {
  return `flowering-create-draft-${plantId}`
}

export interface FloweringDraftData {
  notes?: string
  endDate?: string
  startDate?: string
  registrationType?: 'in_progress' | 'completed'
}

export interface FloweringFormValues {
  eventId?: string
  startDate: string
  endDate?: string | null
  notes?: string
}

export interface FloweringEventToClose {
  id: string
  plantId: string
  startDate: Date | string
  notes?: string | null
}

export interface FloweringTargetPlant {
  id: string
  FloweringEvent?: Array<{
    id: string
    startDate: Date | string
    endDate?: Date | string | null
    notes?: string | null
  }>
}

export type TargetPlantFlowering = FloweringTargetPlant

export interface FloweringEventModalProps {
  isOpen: boolean
  isPending: boolean
  eventToClose?: FloweringEventToClose | null
  targetPlant?: FloweringTargetPlant | null
  mode?: 'create' | 'close'
  onClose: () => void
  onSave: (values: FloweringFormValues) => void
}

interface FloweringEventFormProps {
  isClosing: boolean
  isPending: boolean
  eventId?: string
  draftKey: string
  initialStartDate: string
  initialEndDate: string
  initialNotes: string
  hasPreviousNotes: boolean
  formattedStartDate: string
  daysElapsed: number
  onClose: () => void
  onSave: (values: FloweringFormValues) => void
}

function FloweringEventForm({
  isClosing,
  isPending,
  eventId,
  draftKey,
  initialStartDate,
  initialEndDate,
  initialNotes,
  hasPreviousNotes,
  formattedStartDate,
  daysElapsed,
  onClose,
  onSave,
}: FloweringEventFormProps) {
  const { getDraft, setDraft } = useFormDraftStore()

  const [startDate, setStartDate] = useState(() => {
    const raw = getDraft(draftKey)
    const draft =
      typeof raw === 'string'
        ? { notes: raw }
        : raw && typeof raw === 'object'
          ? (raw as FloweringDraftData)
          : undefined

    return draft?.startDate ?? initialStartDate
  })

  const [endDate, setEndDate] = useState(() => {
    const raw = getDraft(draftKey)
    const draft =
      typeof raw === 'string'
        ? { notes: raw }
        : raw && typeof raw === 'object'
          ? (raw as FloweringDraftData)
          : undefined

    return draft?.endDate ?? initialEndDate
  })

  const [registrationType, setRegistrationType] = useState<'in_progress' | 'completed'>(() => {
    const raw = getDraft(draftKey)
    const draft =
      typeof raw === 'string'
        ? { notes: raw }
        : raw && typeof raw === 'object'
          ? (raw as FloweringDraftData)
          : undefined

    return draft?.registrationType ?? 'in_progress'
  })

  const [notes, setNotes] = useState(() => {
    const raw = getDraft(draftKey)
    const draft =
      typeof raw === 'string'
        ? { notes: raw }
        : raw && typeof raw === 'object'
          ? (raw as FloweringDraftData)
          : undefined

    return draft?.notes ?? initialNotes
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isDirtyRef = useRef(false)

  useEffect(() => {
    if (!isDirtyRef.current) return

    setDraft(draftKey, {
      notes,
      endDate,
      startDate,
      registrationType,
    })
  }, [draftKey, notes, endDate, startDate, registrationType, setDraft])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (isClosing) {
      if (endDate < startDate) {
        setErrorMsg('La fecha de finalización no puede ser anterior a la fecha de inicio.')

        return
      }

      onSave({
        eventId,
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

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {/* Error inline si existe */}
      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {isClosing ? (
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
              <p className="text-secondary bg-surface/40 border-black-and-white/5 whitespace-pre-wrap rounded-lg border p-2.5 font-mono text-xs italic wrap-break-word">
                &ldquo;{initialNotes}&rdquo;
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
              onChange={(e) => {
                isDirtyRef.current = true
                setEndDate(e.target.value)
              }}
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
              onChange={(e) => {
                isDirtyRef.current = true
                setNotes(e.target.value)
              }}
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
          <div className="border-input-outline grid grid-cols-2 gap-2 rounded-xl border p-1 bg-surface/40">
            <button
              className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all ${
                registrationType === 'in_progress'
                  ? 'bg-surface text-primary shadow-xs border border-input-outline'
                  : 'text-secondary hover:text-primary opacity-70'
              }`}
              type="button"
              onClick={() => {
                isDirtyRef.current = true
                setRegistrationType('in_progress')
              }}
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
              onClick={() => {
                isDirtyRef.current = true
                setRegistrationType('completed')
              }}
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
                onChange={(e) => {
                  isDirtyRef.current = true
                  setStartDate(e.target.value)
                }}
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
                  onChange={(e) => {
                    isDirtyRef.current = true
                    setEndDate(e.target.value)
                  }}
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
              onChange={(e) => {
                isDirtyRef.current = true
                setNotes(e.target.value)
              }}
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
  )
}

export function FloweringEventModal({
  isOpen,
  isPending,
  eventToClose,
  targetPlant,
  mode,
  onClose,
  onSave,
}: FloweringEventModalProps) {
  if (!isOpen) return null
  if (!eventToClose && !targetPlant) return null

  const todayStr = getTodayCalendarString()

  let isClosing = false
  let plantId = ''
  let eventId: string | undefined
  let initialStartDate = todayStr
  let initialEndDate = todayStr
  let initialNotes = ''
  let hasPreviousNotes = false
  let formattedStartDate = ''
  let daysElapsed = 0

  if (eventToClose) {
    isClosing = true
    plantId = eventToClose.plantId
    eventId = eventToClose.id
    initialStartDate = toCalendarDateString(eventToClose.startDate)
    initialEndDate = todayStr
    initialNotes = eventToClose.notes || ''
    hasPreviousNotes = Boolean(eventToClose.notes && eventToClose.notes.trim().length > 0)
    formattedStartDate = formatCalendarDate(eventToClose.startDate)

    const startObj = new Date(eventToClose.startDate)

    daysElapsed = Math.max(0, Math.floor((Date.now() - startObj.getTime()) / (1000 * 60 * 60 * 24)))
  } else if (targetPlant) {
    plantId = targetPlant.id

    if (mode === 'create') {
      isClosing = false
      initialStartDate = todayStr
      initialEndDate = todayStr
      initialNotes = ''
      hasPreviousNotes = false
    } else {
      const active = targetPlant.FloweringEvent?.find((e) => !e.endDate)

      if (active) {
        isClosing = true
        eventId = active.id
        initialStartDate = toCalendarDateString(active.startDate)
        initialEndDate = todayStr
        initialNotes = active.notes || ''
        hasPreviousNotes = Boolean(active.notes && active.notes.trim().length > 0)
        formattedStartDate = formatCalendarDate(active.startDate)

        const startObj = new Date(active.startDate)

        daysElapsed = Math.max(
          0,
          Math.floor((Date.now() - startObj.getTime()) / (1000 * 60 * 60 * 24)),
        )
      } else {
        isClosing = false
        initialStartDate = todayStr
        initialEndDate = todayStr
        initialNotes = ''
        hasPreviousNotes = false
      }
    }
  }

  const formKey = eventToClose ? `event-${eventToClose.id}` : `plant-${plantId}-${mode || 'auto'}`
  const draftKey = isClosing
    ? eventId
      ? getFloweringCloseDraftKey(eventId)
      : 'flowering-close-draft'
    : plantId
      ? getFloweringCreateDraftKey(plantId)
      : 'flowering-create-draft'

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle={plantId ? `#${plantId.slice(-8).toUpperCase()}` : undefined}
      title={isClosing ? 'Finalizar Floración' : 'Registrar Floración'}
      onClose={onClose}
    >
      <FloweringEventForm
        key={formKey}
        daysElapsed={daysElapsed}
        draftKey={draftKey}
        eventId={eventId}
        formattedStartDate={formattedStartDate}
        hasPreviousNotes={hasPreviousNotes}
        initialEndDate={initialEndDate}
        initialNotes={initialNotes}
        initialStartDate={initialStartDate}
        isClosing={isClosing}
        isPending={isPending}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  )
}

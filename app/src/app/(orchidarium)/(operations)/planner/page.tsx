'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { IoWaterOutline, IoFlaskOutline, IoCloseOutline, IoEllipsisVertical } from 'react-icons/io5'
import { PiSprayBottle } from 'react-icons/pi'
import { MdDewPoint, MdOutlineHistoryToggleOff } from 'react-icons/md'
import { LuRadioTower } from 'react-icons/lu'
import { HiOutlineCog } from 'react-icons/hi'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'
import * as z from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { SelectDropdown } from '@/components'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  // Si la API devuelve un error (ej: BD inalcanzable), lanzamos para que SWR lo maneje como error
  if (!Array.isArray(json)) throw new Error(json.error || 'Respuesta inesperada')

  return json
}

type TaskPurpose = 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
type ZoneType = 'ZONA_A' | 'ZONA_B' | 'ZONA_C' | 'ZONA_D'

// ---- Configuración Zod ----
const plannerSchema = z.object({
  purpose: z.enum([
    'IRRIGATION',
    'FERTIGATION',
    'FUMIGATION',
    'HUMIDIFICATION',
    'SOIL_WETTING',
  ] as const),
  zone: z.literal('ZONA_A', {
    errorMap: () => ({ message: 'La única zona habilitada es la ZONA A' }),
  }),
  duration: z.coerce
    .number({ invalid_type_error: 'Debe ser un número válido' })
    .min(5, 'Mínimo 5 minutos')
    .max(20, 'Máximo 20 minutos'),
  scheduledAt: z
    .string()
    .min(1, 'Debes seleccionar fecha y hora')
    .refine(
      (val) => {
        const selectedDate = new Date(val).getTime()
        const now = new Date().getTime()

        return selectedDate > now
      },
      {
        message: 'No puedes programar tareas en el pasado',
      },
    ),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

type PlannerFormInputs = z.infer<typeof plannerSchema>

interface PendingTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  status: string
  isRoutine?: boolean
  routineName?: string
}

const ACTION_MAP: Record<TaskPurpose, { label: string; icon: React.ReactNode; color: string }> = {
  IRRIGATION: {
    label: 'Regar',
    icon: <IoWaterOutline className="h-5 w-5" />,
    color: 'text-blue-500',
  },
  HUMIDIFICATION: {
    label: 'Nebulizar',
    icon: <PiSprayBottle className="h-5 w-5" />,
    color: 'text-cyan-500',
  },
  SOIL_WETTING: {
    label: 'Humedecer Suelo',
    icon: <MdDewPoint className="h-5 w-5" />,
    color: 'text-emerald-500',
  },
  FERTIGATION: {
    label: 'Fertirriego',
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-purple-500',
  },
  FUMIGATION: {
    label: 'Fumigación',
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-orange-500',
  },
}

// Badge visual dinámico por estado real de la tarea
function TaskStatusBadge({ status, isPast }: { status: string; isPast: boolean }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-500">
        <HiOutlineCog className="h-3 w-3 animate-spin" />
        Ejecutando
      </span>
    )
  }
  if (status === 'CONFIRMED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-500">
        <LuRadioTower className="h-3 w-3" />
        Confirmado
      </span>
    )
  }
  if (isPast && status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-yellow-600 dark:text-yellow-400">
        En espera
      </span>
    )
  }

  return null
}

export default function PlannerPage() {
  // 1. Fetch Pendientes con SWR (Polling Inteligente cada 5 segundos)
  const {
    data: tasks = [],
    isLoading,
    mutate,
  } = useSWR<PendingTask[]>('/api/planner/queue', fetcher, {
    refreshInterval: 5000,
  })

  // Form State via Zod + RHF
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<PlannerFormInputs>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      purpose: 'IRRIGATION',
      zone: 'ZONA_A',
      duration: 10,
      scheduledAt: '',
      notes: '',
    },
  })

  // 2. Submit Nueva Tarea
  const onSubmit = async (data: PlannerFormInputs) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: data.purpose,
          zones: [data.zone],
          durationMinutes: data.duration,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          notes: data.notes || undefined,
        }),
      })

      if (res.ok) {
        reset() // Limpia el form entero a los valores por defecto
        mutate() // SWR revalidación instantánea
      } else {
        alert('Error al agendar la tarea')
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  // 3. Cancelar Tarea con motivo
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !cancelReason.trim()) return

    try {
      const res = await fetch(`/api/tasks/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      })

      if (res.ok) {
        mutate()
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setCancelTarget(null)
      setCancelReason('')
    }
  }

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      {/* HEADER */}
      <div>
        <h1 className="text-primary text-2xl font-bold tracking-tight antialiased">
          Planificador de Tareas
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Programa riegos, fertilizaciones y otros eventos futuros automatizados
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* COLUMNA 1: FORMULARIO (sticky) */}
        <div className="lg:col-span-1">
          <div className="border-input-outline bg-surface sticky top-24 rounded-xl border p-6 shadow-sm">
            <h2 className="text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
              <MdOutlineHistoryToggleOff className="h-5 w-5" /> Nueva Tarea
            </h2>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1.5">
                <label className="text-secondary text-sm font-medium" htmlFor="purpose">
                  Acción
                </label>
                <Controller
                  control={control}
                  name="purpose"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <SelectDropdown
                      {...rest}
                      id="purpose"
                      options={Object.entries(ACTION_MAP).map(([val, act]) => ({
                        value: val,
                        label: act.label,
                      }))}
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
                {errors.purpose && (
                  <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                    {errors.purpose.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-secondary text-sm font-medium" htmlFor="zone">
                  Zonas
                </label>
                <Controller
                  control={control}
                  name="zone"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <SelectDropdown
                      {...rest}
                      id="zone"
                      options={[{ label: 'ZONA A', value: 'ZONA_A' }]}
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
                {errors.zone && (
                  <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                    {errors.zone.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-secondary text-sm font-medium" htmlFor="duration">
                  Duración (Minutos)
                </label>
                <input
                  className={clsx(
                    'focus-input border text-sm',
                    errors.duration
                      ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75'
                      : 'border-input-outline',
                  )}
                  id="duration"
                  type="text"
                  {...register('duration')}
                />
                {errors.duration && (
                  <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                    {errors.duration.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-secondary text-sm font-medium" htmlFor="scheduledAt">
                  Fecha y Hora
                </label>
                <input
                  className={clsx(
                    'focus-input border text-sm',
                    errors.scheduledAt
                      ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75'
                      : 'border-input-outline',
                  )}
                  id="scheduledAt"
                  type="datetime-local"
                  {...register('scheduledAt')}
                />
                {errors.scheduledAt && (
                  <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                    {errors.scheduledAt.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-secondary text-sm font-medium" htmlFor="notes">
                  Notas (opcional)
                </label>
                <textarea
                  className="focus-input border-input-outline resize-none border text-sm"
                  id="notes"
                  placeholder="Ej: Riego extra por altas temperaturas"
                  rows={2}
                  {...register('notes')}
                />
                {errors.notes && (
                  <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
                    {errors.notes.message}
                  </span>
                )}
              </div>

              <button
                className="bg-action hover:bg-action/90 focus-visible:ring-accessibility mt-2 w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                type="submit"
              >
                Agendar Tarea
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA 2: LISTA DE PENDIENTES */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-primary mb-2 flex items-center gap-2 text-lg font-semibold">
            Cola de Ejecución ({tasks.length})
          </h2>

          {isLoading && tasks.length === 0 ? (
            <div className="border-input-outline flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8">
              <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-primary animate-pulse text-sm font-medium tracking-wide">
                Cargando tareas
              </span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-8">
              <MdOutlineHistoryToggleOff className="text-secondary/30 mb-2 h-10 w-10" />
              <p className="text-secondary text-sm">No hay tareas programadas para el futuro.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => {
                const action = ACTION_MAP[task.purpose] || ACTION_MAP.IRRIGATION
                const dateObj = new Date(task.scheduledAt)
                const isPast = dateObj < new Date()
                const isCancellable = task.status === 'PENDING' && !task.isRoutine

                return (
                  <div
                    key={task.id}
                    className={clsx(
                      'bg-surface border-input-outline flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all sm:flex-row sm:items-center',
                      task.status === 'IN_PROGRESS' && 'border-amber-500/30 bg-amber-500/5',
                      task.status === 'CONFIRMED' && 'border-blue-500/30 bg-blue-500/5',
                      task.status === 'PENDING' &&
                        isPast &&
                        !task.isRoutine &&
                        'border-yellow-500/20 bg-yellow-500/5',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={clsx(
                          'bg-hover-overlay flex h-10 w-10 items-center justify-center rounded-full',
                          action.color,
                        )}
                      >
                        {action.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary flex items-center gap-2 text-sm font-medium">
                          {action.label}
                          <span className="text-secondary rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase dark:bg-white/10">
                            {task.zones.join(', ')}
                          </span>
                          <TaskStatusBadge isPast={isPast} status={task.status} />
                        </span>
                        <div className="text-secondary mt-1 flex items-center gap-2 text-xs">
                          <span>Duración: {task.duration} min</span>
                          <span>•</span>
                          <span>
                            {dateObj.toLocaleString('es-VE', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {task.isRoutine && (
                      <div className="text-secondary flex items-center gap-2 rounded-md bg-black/5 px-3 py-1.5 text-xs font-semibold dark:bg-white/5">
                        <MdOutlineHistoryToggleOff className="h-4 w-4" />
                        {task.routineName}
                      </div>
                    )}

                    {isCancellable && (
                      <TaskOptionsMenu
                        onCancel={() =>
                          setCancelTarget({
                            id: task.id,
                            label: action.label,
                          })
                        }
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Cancelación */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            key="cancel-overlay"
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setCancelTarget(null)}
          >
            <motion.div
              key="cancel-modal"
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-surface border-input-outline mx-4 w-full max-w-md rounded-xl border p-6 shadow-xl"
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-primary text-base font-semibold">Cancelar tarea</h3>
              <p className="text-secondary mt-1 text-sm">
                Estás a punto de cancelar la tarea de{' '}
                <span className="text-primary font-medium">{cancelTarget.label}</span>.
              </p>

              <label
                className="text-secondary mt-4 block text-sm font-medium"
                htmlFor="cancel-reason"
              >
                Motivo de cancelación
              </label>
              <textarea
                className="focus-input border-input-outline mt-1.5 w-full resize-none border text-sm"
                id="cancel-reason"
                placeholder="Ej: Cambio de prioridades, clima adverso..."
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  className="focus-visible:ring-accessibility rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
                  type="button"
                  onClick={() => {
                    setCancelTarget(null)
                    setCancelReason('')
                  }}
                >
                  Volver
                </button>
                <button
                  className="focus-visible:ring-accessibility rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                  disabled={!cancelReason.trim()}
                  type="button"
                  onClick={handleCancelConfirm}
                >
                  Confirmar cancelación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Dropdown de Opciones por Tarea ----
function TaskOptionsMenu({ onCancel }: { onCancel: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  return (
    <div ref={menuRef} className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Opciones de tarea"
        className="focus-visible:ring-accessibility text-secondary hover:text-primary flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/10"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <IoEllipsisVertical className="h-4 w-4" />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="task-options-dropdown"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="border-input-outline bg-surface absolute top-9 right-0 z-10 w-44 rounded-lg border py-1 shadow-lg"
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            role="menu"
          >
            <button
              className="hover:bg-hover-overlay flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors"
              role="menuitem"
              type="button"
              onClick={() => {
                close()
                onCancel()
              }}
            >
              <IoCloseOutline className="h-4 w-4" />
              Cancelar tarea
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

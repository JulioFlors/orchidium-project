import { Controller, Control, UseFormRegister, FieldValues, Path, useWatch } from 'react-hook-form'
import clsx from 'clsx'
import { TaskPurpose } from '@package/database/enums'

import { SelectDropdown, Input } from '@/components'
import { TaskPurposeLabels, ZoneTypeLabels, ZoneCapabilities } from '@/config/mappings'

const ACTION_MAP = {
  IRRIGATION: { label: TaskPurposeLabels.IRRIGATION },
  HUMIDIFICATION: { label: TaskPurposeLabels.HUMIDIFICATION },
  SOIL_WETTING: { label: TaskPurposeLabels.SOIL_WETTING },
  FERTIGATION: { label: TaskPurposeLabels.FERTIGATION },
  FUMIGATION: { label: TaskPurposeLabels.FUMIGATION },
}

interface InputProps<T extends FieldValues> {
  control?: Control<T>
  register?: UseFormRegister<T>
  name: Path<T>
  label?: string
  error?: string
}

// ----------------------------------------------------------------------
// COMPONENTE: Selector de Circuitos
// ----------------------------------------------------------------------
export function PlannerCircuitSelect<T extends FieldValues>({
  control,
  name,
  error,
}: Omit<InputProps<T>, 'register'>) {
  if (!control) return null

  return (
    <div className="flex flex-col gap-1.5">
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, ...rest } }) => (
          <SelectDropdown
            error={error}
            id={name}
            options={[
              ...Object.entries(ACTION_MAP).map(([val, act]) => ({
                value: val,
                label: act.label,
              })),
            ]}
            value={value}
            onChange={onChange}
            {...rest}
          />
        )}
      />
      {error && (
        <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
          {error}
        </span>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// COMPONENTE: Selector de Zonas
// ----------------------------------------------------------------------
export function PlannerZoneSelect<T extends FieldValues>({
  control,
  name,
  error,
}: Omit<InputProps<T>, 'register'>) {
  // Observamos el propósito seleccionado para obtener las zonas compatibles
  const currentPurpose = useWatch({
    control,
    name: 'purpose' as Path<T>,
  }) as TaskPurpose | undefined

  if (!control) return null

  const validZones = currentPurpose ? ZoneCapabilities[currentPurpose] || [] : []

  return (
    <div className="flex flex-col gap-1.5">
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, ...rest } }) => {
          // Si el valor actual no está en la lista de zonas válidas, idealmente podríamos
          // hacer un reset parcial, pero react-hook-form se maneja a nivel superior.
          return (
            <SelectDropdown
              emptyMessage="Selecciona un Circuito de Riego"
              error={error}
              id={name}
              options={validZones.map((zone) => ({
                label: ZoneTypeLabels[zone],
                value: zone,
              }))}
              placeholder="Seleccionar"
              value={value}
              onChange={onChange}
              {...rest}
            />
          )
        }}
      />
      {error && (
        <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
          {error}
        </span>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// COMPONENTE: Input de Duración Interactivo
// ----------------------------------------------------------------------
export function PlannerDurationInput<T extends FieldValues>({
  control,
  register,
  name,
  error,
}: InputProps<T>) {
  // Observamos el valor reactivamente evadiendo colisiones de re-renders no memoizados.
  const durationValue = useWatch({ control, name })

  if (!control || !register) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex w-full items-center">
        <Input
          autoComplete="off"
          className="peer w-full"
          error={!!error}
          id={name}
          inputMode="numeric"
          max="25"
          maxLength={2}
          min="1"
          pattern="[0-9]*"
          type="text"
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
          }}
          {...register(name)}
        />

        {/* Etiqueta dinámica "min" adyacente */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3">
          {/* Espaciador invisible que simula el ancho del texto ingresado */}
          <span className="invisible text-sm">{durationValue}</span>
          {/* El texto real visible */}
          {durationValue ? (
            <span className="text-secondary ml-1 text-sm font-medium transition-colors select-none">
              min
            </span>
          ) : null}
        </div>
      </div>
      {error && (
        <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
          {error}
        </span>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// COMPONENTE: Selector de Programas (Ferti/Fito)
// ----------------------------------------------------------------------
export function PlannerProgramSelect<T extends FieldValues>({
  control,
  name,
  error,
  options = [],
}: Omit<InputProps<T>, 'register'> & {
  options: { label: string; value: string }[]
}) {
  if (!control) return null

  return (
    <div className="fade-in relative z-20 flex flex-col gap-1.5 duration-300">
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, ...rest } }) => (
          <SelectDropdown
            error={error}
            id={name}
            options={options}
            placeholder="Seleccionar programa..."
            value={value}
            onChange={onChange}
            {...rest}
          />
        )}
      />
      {error && (
        <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75">
          {error}
        </span>
      )}
    </div>
  )
}
// ----------------------------------------------------------------------
// COMPONENTE: Selector de Días de la Semana
// ----------------------------------------------------------------------
const DAYS = [
  { label: 'L', value: 1, full: 'Lunes' },
  { label: 'M', value: 2, full: 'Martes' },
  { label: 'X', value: 3, full: 'Miércoles' },
  { label: 'J', value: 4, full: 'Jueves' },
  { label: 'V', value: 5, full: 'Viernes' },
  { label: 'S', value: 6, full: 'Sábado' },
  { label: 'D', value: 0, full: 'Domingo' },
]

export function PlannerDaysSelector<T extends FieldValues>({
  control,
  name,
  error,
}: Omit<InputProps<T>, 'register'>) {
  if (!control) return null

  return (
    <div className="flex flex-col gap-2">
      <Controller
        control={control}
        name={name}
        render={({ field: { value = [], onChange } }) => (
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const isSelected = (value as number[]).includes(day.value)

              return (
                <button
                  key={day.value}
                  className={clsx(
                    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-xs font-bold transition-all duration-300',
                    'focus:border-primary focus:z-10 focus:outline-none',
                    isSelected
                      ? 'bg-action border-action hover:bg-action-hover dark:hover:bg-action-hover-dark text-white shadow-sm'
                      : 'bg-surface border-input-outline text-secondary hover:border-primary/30 hover:bg-hover-overlay',
                  )}
                  title={day.full}
                  type="button"
                  onClick={() => {
                    const newValue = isSelected
                      ? (value as number[]).filter((v) => v !== day.value)
                      : [...(value as number[]), day.value]

                    onChange(newValue)
                  }}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        )}
      />
      {error && (
        <span className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}

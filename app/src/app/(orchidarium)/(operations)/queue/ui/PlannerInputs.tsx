import { Controller, Control, UseFormRegister, FieldValues, Path, useWatch } from 'react-hook-form'
import clsx from 'clsx'

import { SelectDropdown } from '@/components'
import { TaskPurposeLabels } from '@/config/mappings'

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
  label = 'Circuito',
  error,
}: Omit<InputProps<T>, 'register'>) {
  if (!control) return null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-secondary text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, ...rest } }) => (
          <SelectDropdown
            {...rest}
            id={name}
            options={[
              ...Object.entries(ACTION_MAP).map(([val, act]) => ({
                value: val,
                label: act.label,
              })),
            ]}
            value={value}
            onChange={onChange}
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
  label = 'Zona',
  error,
}: Omit<InputProps<T>, 'register'>) {
  if (!control) return null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-secondary text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, ...rest } }) => (
          <SelectDropdown
            {...rest}
            id={name}
            options={[{ label: 'ZONA A', value: 'ZONA_A' }]}
            value={value}
            onChange={onChange}
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
// COMPONENTE: Input de Duración Interactivo
// ----------------------------------------------------------------------
export function PlannerDurationInput<T extends FieldValues>({
  control,
  register,
  name,
  label = 'Duración',
  error,
}: InputProps<T>) {
  // Observamos el valor reactivamente evadiendo colisiones de re-renders no memoizados.
  const durationValue = useWatch({ control, name })

  if (!control || !register) return null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-secondary text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <div className="relative isolate flex w-full items-center">
        <div className="relative flex w-full items-center">
          <input
            autoComplete="off"
            className={clsx(
              'focus-input peer w-full border text-sm',
              error
                ? 'border-transparent outline -outline-offset-1 outline-red-800/75 dark:outline-red-400/75'
                : 'border-input-outline',
            )}
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
        </div>

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

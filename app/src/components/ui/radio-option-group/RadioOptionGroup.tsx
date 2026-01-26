'use client'

import clsx from 'clsx'
import { ReactNode } from 'react'

// Definimos el tipo para cada opción que pasaremos al componente.
// Usamos un tipo genérico 'T' para el 'value' para que sea flexible.
export interface RadioOption<T extends string> {
  value: T // Un valor único para la opción (ej. 'mrw', 'zelle')
  label: ReactNode // El texto principal, puede ser string o un componente
  rightContent?: ReactNode // Contenido opcional para la derecha (precio, iconos, etc.)
}

// Props del componente principal
interface RadioOptionGroupProps<T extends string> {
  options: RadioOption<T>[] // Array de opciones a mostrar
  selectedValue: T // El valor de la opción actualmente seleccionada
  onValueChange: (value: T) => void // Función para notificar cambios
  name: string // El 'name' del grupo de radio buttons (importante para accesibilidad)
}

// todo: "Las props (propiedades) deben ser serializables para los componentes en el archivo de entrada del 'use client'. 'onValueChange' es una función que no es una Server Action. Renombra 'onValueChange' a 'action' o haz que su nombre termine en 'Action', por ejemplo, 'onValueChangeAction', para indicar que es una Server Action."

export function RadioOptionGroup<T extends string>({
  options,
  selectedValue,
  onValueChange,
  name,
}: RadioOptionGroupProps<T>) {
  return (
    <div className="rounded-md border border-gray-300">
      {' '}
      {/* Contenedor principal con borde */}
      <div role="radiogroup">
        {options.map((option, optionIdx) => (
          <label
            key={option.value}
            className={clsx(
              'flex cursor-pointer items-center justify-between p-4 transition-colors duration-300',
              // Añade un borde inferior a todos menos al último
              optionIdx < options.length - 1 && 'border-b border-gray-300',
              // Estilos cuando la opción está seleccionada
              {
                'border-l-4 border-l-red-600 bg-red-50/70': selectedValue === option.value,
                'hover:bg-gray-50': selectedValue !== option.value,
              },
            )}
            htmlFor={`${name}-${option.value}`}
          >
            {/* Contenedor para el radio button y la etiqueta principal */}
            <div className="flex items-center">
              <input
                checked={selectedValue === option.value}
                className="h-4 w-4 border-gray-400 text-red-600 focus:ring-red-500" // El color del check nativo
                id={`${name}-${option.value}`}
                name={name}
                type="radio"
                value={option.value}
                onChange={() => onValueChange(option.value)}
              />
              <span className="ml-3 text-sm font-medium text-gray-800">{option.label}</span>
            </div>

            {/* Contenido Opcional a la Derecha */}
            {option.rightContent && (
              <div className="ml-4 text-sm font-medium text-gray-700">{option.rightContent}</div>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

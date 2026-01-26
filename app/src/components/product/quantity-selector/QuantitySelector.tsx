import { IoAddSharp, IoRemoveSharp } from 'react-icons/io5'

interface Props {
  quantity: number

  // Función para notificar el cambio al padre
  onQuantityChanged: (value: number) => void
}

const MIN_QUANTITY = 1
const MAX_QUANTITY = 5

export function QuantitySelector({ quantity, onQuantityChanged }: Props) {
  // ---- Se Sujeta/Limita/Acota la cantidad inicial a un rango predefinido ----
  const ClampQuantity = (initialQuantity: number) => {
    return Math.max(MIN_QUANTITY, Math.min(initialQuantity, MAX_QUANTITY))
  }

  const displayQuantity = ClampQuantity(quantity)

  const canDecrement = displayQuantity > MIN_QUANTITY
  const canIncrement = displayQuantity < MAX_QUANTITY

  const onValueChanged = (value: number) => {
    const newCount = displayQuantity + value

    // Validar que quantity no exceda los límites
    if (newCount < MIN_QUANTITY || newCount > MAX_QUANTITY) {
      return
    }

    // Llamar a la función del padre para actualizar la cantidad
    onQuantityChanged(newCount)
  }

  return (
    <div className="mb-4.5">
      <h3 className="text-primary mb-2 font-semibold tracking-wide">Cantidad</h3>

      {/* alineamos los botones respecto al input */}
      <div className="flex items-center">
        <button
          aria-label="Disminuir cantidad"
          className="focus-dashed cursor-pointer p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canDecrement}
          type="button"
          onClick={() => onValueChanged(-1)}
        >
          <IoRemoveSharp className="text-primary font-bold" size={16} />
        </button>

        <span className="bg-input mx-4 flex h-10 w-20 items-center justify-center rounded px-4 font-bold select-none">
          {displayQuantity}
        </span>

        <button
          className="focus-dashed cursor-pointer p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canIncrement}
          type="button"
          onClick={() => onValueChanged(+1)}
        >
          <IoAddSharp className="text-primary font-bold" size={16} />
        </button>
      </div>
    </div>
  )
}

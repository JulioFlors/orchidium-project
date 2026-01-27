import clsx from 'clsx'

import { ProductVariant } from '@/interfaces'
import { PotSizeLabels, PotSizeDimensions } from '@/config/mappings'

interface Props {
  selectedVariant?: ProductVariant
  variants: ProductVariant[]
  onVariantChanged: (variant: ProductVariant) => void
}

export function SizeSelector({ selectedVariant, variants, onVariantChanged }: Props) {
  return (
    <div className="mb-6 tracking-wide">
      {/* Cambios de Layout:
         1. justify-start: Alinea todo a la izquierda (antes estaban separados a los extremos).
         2. items-baseline: Alinea el texto base del título y la descripción para que se lean en la misma línea visual.
      */}
      <div className="mb-2 flex items-baseline justify-start">
        <h3 className="text-primary font-semibold">Maceta</h3>

        {selectedVariant && (
          <span className="text-secondary fade-in ml-4 font-semibold transition-all">
            {PotSizeDimensions[selectedVariant.size]}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5.5 gap-y-3">
        {variants.map((variant) => {
          const hasStock = variant.available && variant.quantity > 0
          const isSelected = selectedVariant?.id === variant.id

          return (
            <button
              key={variant.id}
              className={clsx('pot-size-btn', {
                'pot-size-available': hasStock,
                'pot-size-disabled': !hasStock,
                'is-selected': isSelected,
              })}
              type="button"
              onClick={() => onVariantChanged(variant)}
            >
              {PotSizeLabels[variant.size]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

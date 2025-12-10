import type { PotSize } from '@/interfaces'
import { PotSizeLabels } from '@/config/mappings'
import clsx from 'clsx'

interface Props {
  selectedSize: PotSize
  availableSizes: PotSize[] // ['NRO_5', 'NRO_7', 'NRO_10', 'NRO_14']
}

export function SizeSelector({ selectedSize, availableSizes }: Props) {
  return (
    <div className="my-5">
      <h3 className="mb-4 font-bold">Tamaño</h3>

      <div className="flex">
        {availableSizes.map((size) => (
          <button
            key={size}
            className={clsx('mx-2 text-lg hover:underline', {
              underline: size === selectedSize,
            })}
            type="button"
          >
            {PotSizeLabels[size]}
          </button>
        ))}
      </div>
    </div>
  )
}

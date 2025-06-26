import type { PotSize } from '@/interfaces'

import clsx from 'clsx'

interface Props {
  selectedSize: PotSize
  availableSizes: PotSize[] // ['Nro 5', 'Nro 7', 'Nro 10', 'Nro 14']
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
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

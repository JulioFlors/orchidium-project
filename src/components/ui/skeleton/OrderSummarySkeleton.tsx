export function OrderSummarySkeleton() {
  return (
    <div className="animate-pulse">
      {/* Contenedor principal con animación de pulso */}
      <div className="grid grid-cols-2 gap-2">
        {/* Línea 1: No. Productos */}
        <div>
          <div className="h-4 w-3/5 rounded bg-neutral-200" /> {/* Texto "No. Productos" */}
        </div>
        <div className="flex justify-end">
          <div className="h-4 w-2/5 rounded bg-neutral-200" /> {/* Texto "X artículos" */}
        </div>

        {/* Línea 2: Subtotal */}
        <div>
          <div className="h-4 w-1/2 rounded bg-neutral-200" /> {/* Texto "Subtotal" */}
        </div>
        <div className="flex justify-end">
          <div className="h-4 w-1/3 rounded bg-neutral-200" /> {/* Precio del subtotal */}
        </div>

        {/* Línea 3: Impuestos */}
        <div>
          <div className="h-4 w-2/5 rounded bg-neutral-200" /> {/* Texto "Impuestos" */}
        </div>
        <div className="flex justify-end">
          <div className="h-4 w-1/4 rounded bg-neutral-200" /> {/* Precio de impuestos */}
        </div>

        {/* Línea 4: Total */}
        <div className="mt-5">
          <div className="h-6 w-1/3 rounded bg-neutral-200" /> {/* Texto "Total" */}
        </div>
        <div className="mt-5 flex justify-end">
          <div className="h-6 w-2/5 rounded bg-neutral-200" /> {/* Precio total */}
        </div>
      </div>
    </div>
  )
}

import { useCallback } from 'react'

import { useCurrencyStore } from '@/store'

/**
 * Formatea un valor numérico a USD o VES aplicando las reglas:
 * - 2 decimales si tiene decimales.
 * - Sin decimales si es un entero exacto.
 */
export function formatCurrency(
  value: number,
  currency: 'USD' | 'VES',
  rate: number | null,
): string {
  let finalValue = value
  let finalCurrency = currency

  if (currency === 'VES' && rate !== null) {
    finalValue = value * rate
  } else {
    finalCurrency = 'USD' // Fallback forzado
  }

  const hasDecimals = finalValue % 1 !== 0
  const locale = finalCurrency === 'VES' ? 'es-VE' : 'en-US'

  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(finalValue)

  return finalCurrency === 'USD' ? `$${formatted}` : `Bs. ${formatted}`
}

/**
 * Hook para formatear rangos o precios individuales de variantes de forma reactiva.
 */
export function useFormatPrice() {
  const currency = useCurrencyStore((state) => state.currency)
  const rate = useCurrencyStore((state) => state.rate)

  const format = useCallback(
    (value: number) => {
      return formatCurrency(value, currency, rate)
    },
    [currency, rate],
  )

  const formatRange = useCallback(
    (min: number, max: number) => {
      if (min === max) return format(min)

      return `${format(min)} - ${format(max)}`
    },
    [format],
  )

  return { format, formatRange, currency, rate }
}

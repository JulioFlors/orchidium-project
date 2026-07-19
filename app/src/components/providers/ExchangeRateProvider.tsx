'use client'

import React, { useEffect } from 'react'

import { useCurrencyStore } from '@/store'
import { getLatestExchangeRate } from '@/actions'

interface Props {
  children: React.ReactNode
}

export function ExchangeRateProvider({ children }: Props) {
  const setRate = useCurrencyStore((state) => state.setRate)

  useEffect(() => {
    async function loadRate() {
      try {
        const rate = await getLatestExchangeRate()

        setRate(rate)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error cargando tasa en ExchangeRateProvider:', error)
        setRate(null) // Forzar fallback a USD
      }
    }

    loadRate()
  }, [setRate])

  return <>{children}</>
}

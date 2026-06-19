'use client'

import React from 'react'
import { AiOutlineDollar } from 'react-icons/ai'

import { ToggleSwitch } from '@/components'
import { useCurrencyStore } from '@/store'

interface Props {
  className?: string
  isSidebar?: boolean
}

export function CurrencyToggle({ className, isSidebar = false }: Props) {
  const currency = useCurrencyStore((state) => state.currency)
  const rate = useCurrencyStore((state) => state.rate)
  const setCurrency = useCurrencyStore((state) => state.setCurrency)

  const isRateAvailable = rate !== null

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as 'USD' | 'VES')
  }

  const optionA = {
    label: 'USD',
    icon: <AiOutlineDollar className="text-primary h-5 w-5" />,
    value: 'USD',
  }

  const optionB = {
    label: 'VES',
    icon: (
      <span className="text-primary flex h-5 w-5 items-center justify-center font-mono text-xs font-bold">
        Bs
      </span>
    ),
    value: 'VES',
  }

  return (
    <ToggleSwitch
      activeValue={currency}
      ariaLabel="Alternar moneda USD/VES"
      className={className}
      disabled={!isRateAvailable}
      isSidebar={isSidebar}
      optionA={optionA}
      optionB={optionB}
      onChange={handleCurrencyChange}
    />
  )
}

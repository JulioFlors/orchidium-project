'use client'

import { ThemeProvider } from 'next-themes'
// pending verification

import { MqttProvider, ExchangeRateProvider } from '@/components'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme="system">
      <ExchangeRateProvider>
        <MqttProvider>{children}</MqttProvider>
      </ExchangeRateProvider>
    </ThemeProvider>
  )
}

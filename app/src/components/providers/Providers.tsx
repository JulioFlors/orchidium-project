'use client'

import { ThemeProvider } from 'next-themes'
// pending verification

import { MqttProvider } from '@/components'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme="system">
      <MqttProvider>{children}</MqttProvider>
    </ThemeProvider>
  )
}

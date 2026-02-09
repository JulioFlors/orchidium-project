'use client'

import { ThemeProvider } from 'next-themes'
// pending verification

import { MqttProvider } from '@/components'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MqttProvider>
      <ThemeProvider enableSystem attribute="class" defaultTheme="system">
        {children}
      </ThemeProvider>
    </MqttProvider>
  )
}

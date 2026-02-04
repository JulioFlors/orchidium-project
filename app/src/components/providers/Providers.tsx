'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'

import { MqttProvider } from '@/components'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MqttProvider>
        <ThemeProvider enableSystem attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </MqttProvider>
    </SessionProvider>
  )
}

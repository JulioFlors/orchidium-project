'use client'

import { useEffect } from 'react'

import { useMqttStore } from '@/store'

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const { connect, disconnect } = useMqttStore()

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return <>{children}</>
}

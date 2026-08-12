'use client'

import { useEffect } from 'react'

export interface EventStreamMessage {
  type: string
  zone?: string
  metrics?: string[]
  timestamp: number
}

/**
 * Hook para escuchar eventos del servidor a través de Server-Sent Events (SSE) /api/events/stream.
 * Permite revalidar cache SWR o actualizar la UI instantáneamente ante nuevos lotes o cambios de cola.
 */
export function useEventStream(onEvent: (event: EventStreamMessage) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const eventSource = new EventSource('/api/events/stream')

    eventSource.onmessage = (e) => {
      try {
        const data: EventStreamMessage = JSON.parse(e.data)

        if (data.type !== 'HEARTBEAT' && data.type !== 'CONNECTED') {
          onEvent(data)
        }
      } catch {
        // Fallback silencioso
      }
    }

    return () => {
      eventSource.close()
    }
  }, [onEvent])
}

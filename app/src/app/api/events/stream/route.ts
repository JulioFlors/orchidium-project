import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de Server-Sent Events (SSE) para notificar invalidaciones reactivas al frontend
 * cuando la ingesta o los servicios procesan nuevos datos.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // 1. Mensaje de conexión inicial
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`),
      )

      // 2. Ping periódico cada 15s para mantener el socket HTTP vivo a través de proxies
      const intervalId = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() })}\n\n`,
            ),
          )
        } catch {
          clearInterval(intervalId)
        }
      }, 15000)

      // 3. Limpieza al desconectar cliente
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        try {
          controller.close()
        } catch {
          // Ignorar si ya está cerrado
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

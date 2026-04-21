import { InfluxDBClient } from '@influxdata/influxdb3-client'

import { Logger } from './logger'

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

if (!INFLUX_TOKEN) {
  Logger.error('FALTA INFLUX_TOKEN en las variables de entorno.')
}

// ---- Corrección TLS para entornos locales/Docker ----
const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost =
  url.hostname === 'influxdb' ||
  url.hostname === 'localhost' ||
  url.hostname === 'vps.sisparrow.com'

// El SDK v3 usa fetch/gRPC que reaccionan a NODE_TLS_REJECT_UNAUTHORIZED
if (!isPublicCloud && (isInternalHost || url.protocol === 'https:')) {
  Logger.warn(`[ INFLUX ] Desactivando verificación TLS para host interno: ${url.hostname}`)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

export const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN!,
  database: INFLUX_BUCKET,
})

/**
 * Espera a que InfluxDB esté listo respondiendo a una query simple.
 */
export async function waitForInflux(retries = 10): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      // Intentamos una query mínima para verificar salud y TLS
      const stream = influxClient.query('SELECT 1')

      // Consumimos el primer resultado para validar la conexión sin asignar variables no usadas
      const reader = stream[Symbol.asyncIterator]()

      await reader.next()

      return true
    } catch {
      if (i === 0) Logger.warn(`Esperando a InfluxDB (${INFLUX_URL})...`)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  return false
}

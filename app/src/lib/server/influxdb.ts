import { InfluxDBClient } from '@influxdata/influxdb3-client'

const INFLUX_URL = process.env.INFLUX_URL
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

if (!INFLUX_URL) {
  throw new Error('❌ FATAL: INFLUX_URL no está definida en las variables de entorno.')
}

if (!INFLUX_TOKEN) {
  throw new Error('❌ FATAL: INFLUX_TOKEN no está definida en las variables de entorno.')
}

// Cliente singleton para evitar múltiples conexiones en hot-reload
const globalForInflux = global as unknown as { influxClient: InfluxDBClient }

const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

export const influxClient =
  globalForInflux.influxClient ||
  new InfluxDBClient({
    host: INFLUX_URL,
    token: INFLUX_TOKEN,
    database: INFLUX_BUCKET,
    transportOptions: {
      // Si no es la nube pública, relajamos la verificación de SSL para evitar bloqueos
      rejectUnauthorized: isPublicCloud ? true : !isInternalHost,
    },
  })

if (process.env.NODE_ENV !== 'production') globalForInflux.influxClient = influxClient

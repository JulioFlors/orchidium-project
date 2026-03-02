import { InfluxDBClient } from '@influxdata/influxdb3-client'

const INFLUX_URL =
  process.env.INFLUX_URL_CLOUD ||
  process.env.INFLUX_URL ||
  'https://us-east-1-1.aws.cloud2.influxdata.com'
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

// Cliente singleton lazy: no se crea en build time (evita crash en Vercel cuando INFLUX_TOKEN no existe)
const globalForInflux = global as unknown as { influxClient: InfluxDBClient }

export function getInfluxClient(): InfluxDBClient {
  if (globalForInflux.influxClient) return globalForInflux.influxClient

  const token = process.env.INFLUX_TOKEN
  if (!token) {
    throw new Error('INFLUX_TOKEN is not defined in environment variables')
  }

  const client = new InfluxDBClient({
    host: INFLUX_URL,
    token,
    database: INFLUX_BUCKET,
  })

  if (process.env.NODE_ENV !== 'production') globalForInflux.influxClient = client

  return client
}

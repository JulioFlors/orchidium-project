import { InfluxDBClient } from '@influxdata/influxdb3-client'

const INFLUX_URL =
  process.env.INFLUX_URL_CLOUD ||
  process.env.INFLUX_URL ||
  'https://us-east-1-1.aws.cloud2.influxdata.com'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

if (!INFLUX_TOKEN) {
  throw new Error('INFLUX_TOKEN is not defined in environment variables')
}

// Cliente singleton para evitar múltiples conexiones en hot-reload
const globalForInflux = global as unknown as { influxClient: InfluxDBClient }

export const influxClient =
  globalForInflux.influxClient ||
  new InfluxDBClient({
    host: INFLUX_URL,
    token: INFLUX_TOKEN,
    database: INFLUX_BUCKET,
  })

if (process.env.NODE_ENV !== 'production') globalForInflux.influxClient = influxClient

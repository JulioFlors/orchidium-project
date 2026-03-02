import { InfluxDBClient } from '@influxdata/influxdb3-client'

// El código SOLO busca la variable genérica. Nada de _CLOUD o _LOCAL.
const INFLUX_URL = process.env.INFLUX_URL
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

// Falla Rápido (Fail Fast). Si falta la URL o el Token, crashea la app.
// Es mejor que la app no inicie, a que escriba datos en el lugar equivocado.
if (!INFLUX_URL) {
  throw new Error('❌ FATAL: INFLUX_URL no está definida en las variables de entorno.')
}

if (!INFLUX_TOKEN) {
  throw new Error('❌ FATAL: INFLUX_TOKEN no está definida en las variables de entorno.')
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

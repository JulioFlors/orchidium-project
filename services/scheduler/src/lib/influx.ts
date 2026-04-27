import { InfluxDBClient } from '@influxdata/influxdb3-client'

import { Logger } from './logger'

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

if (!INFLUX_TOKEN) {
  Logger.error('FALTA INFLUX_TOKEN en las variables de entorno.')
}

const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost =
  url.hostname.includes('influxdb') ||
  url.hostname === 'localhost' ||
  url.hostname === '127.0.0.1' ||
  url.hostname === 'vps.sisparrow.com' ||
  url.hostname === 'mqtt.sisparrow.com'

// ---- Deshabilitamos TLS para entornos locales/Docker ----
// El SDK v3 usa fetch/gRPC que reaccionan a NODE_TLS_REJECT_UNAUTHORIZED
if (!isPublicCloud && isInternalHost) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

export const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN!,
  database: INFLUX_BUCKET,
  transportOptions: {
    rejectUnauthorized: isPublicCloud ? true : !isInternalHost,
  },
})

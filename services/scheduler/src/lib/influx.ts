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
const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

export const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN!,
  database: INFLUX_BUCKET,
  transportOptions: {
    rejectUnauthorized: isPublicCloud ? true : !isInternalHost,
  },
})

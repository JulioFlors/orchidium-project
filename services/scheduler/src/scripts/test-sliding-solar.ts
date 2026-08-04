import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

const START_DATE = new Date('2026-07-24T16:00:00.000Z') // 12:00 PM Caracas (UTC-4)
const END_DATE = new Date('2026-07-24T19:00:00.000Z') // 3:00 PM Caracas (UTC-4)

interface Sample {
  value: number
  timestamp: number
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info('  ANÁLISIS DE RECUPERACIÓN SOLAR: ACTUAL VS DESLIZANTE (10M EN 20M)')
  Logger.info('════════════════════════════════════════════════════════')

  const query = `
    SELECT time, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${START_DATE.toISOString()}'
      AND time <= '${END_DATE.toISOString()}'
    ORDER BY time ASC
  `

  const luxSamples: Sample[] = []
  const stream = influxClient.query(query)

  for await (const row of stream) {
    const tDate = rowTimeToDate(row.time)
    const tMs = tDate.getTime()

    if (row.illuminance != null) {
      const v = Number(row.illuminance)

      if (v >= 0) luxSamples.push({ value: v, timestamp: tMs })
    }
  }

  Logger.info(`Muestras de luz leídas: ${luxSamples.length}`)

  // Evaluar en cada instante si existe un bloque continuo de 10 min con Lux >= 26k
  // Método Actual: lote B0 rígido de 10 min
  // Método Deslizante: sub-ventana de 10 min continua en los últimos 20 min
}

main().catch((err) => {
  Logger.error('Error fatal:', err)
})

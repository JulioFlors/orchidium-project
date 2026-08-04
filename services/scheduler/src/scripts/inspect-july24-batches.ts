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
  Logger.info('  INSPECCIÓN DE TELEMETRÍA POR LOTES DE 10 MIN (12:00 PM - 3:00 PM VET)')
  Logger.info('════════════════════════════════════════════════════════')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${START_DATE.toISOString()}'
      AND time <= '${END_DATE.toISOString()}'
    ORDER BY time ASC
  `

  const allTemp: Sample[] = []
  const allHum: Sample[] = []
  const allLux: Sample[] = []

  const stream = influxClient.query(query)

  for await (const row of stream) {
    const tDate = rowTimeToDate(row.time)
    const tMs = tDate.getTime()

    if (row.temperature != null) {
      const v = Number(row.temperature)

      if (v > 5.0 && v < 55.0) allTemp.push({ value: v, timestamp: tMs })
    }
    if (row.humidity != null) {
      const v = Number(row.humidity)

      if (v > 10.0 && v <= 100.0) allHum.push({ value: v, timestamp: tMs })
    }
    if (row.illuminance != null) {
      const v = Number(row.illuminance)

      if (v >= 0) allLux.push({ value: v, timestamp: tMs })
    }
  }

  // Generar bloques de 10 minutos
  const startMs = START_DATE.getTime()
  const endMs = END_DATE.getTime()
  const stepMs = 10 * 60 * 1000

  const tableData: Record<string, unknown>[] = []

  for (let bStart = startMs; bStart < endMs; bStart += stepMs) {
    const bEnd = bStart + stepMs

    const tSub = allTemp.filter((s) => s.timestamp >= bStart && s.timestamp < bEnd)
    const hSub = allHum.filter((s) => s.timestamp >= bStart && s.timestamp < bEnd)
    const lSub = allLux.filter((s) => s.timestamp >= bStart && s.timestamp < bEnd)

    const labelStart = new Date(bStart).toLocaleTimeString('es-VE', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
    })
    const labelEnd = new Date(bEnd).toLocaleTimeString('es-VE', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
    })
    const labelRange = `${labelStart} - ${labelEnd}`

    if (tSub.length === 0 || hSub.length === 0) {
      tableData.push({
        'Bloque Horario': labelRange,
        'Temp Inicio': '-',
        'Temp Fin': '-',
        'Variación Temp': '-',
        'Caída Temp (Net)': '-',
        'Hum Inicio': '-',
        'Hum Fin': '-',
        'Variación Hum': '-',
        'Lux (Avg)': '-',
        Muestras: 0,
      })
      continue
    }

    tSub.sort((a, b) => a.timestamp - b.timestamp)
    hSub.sort((a, b) => a.timestamp - b.timestamp)

    const firstTemp = tSub[0].value
    const lastTemp = tSub[tSub.length - 1].value
    const netTempVar = lastTemp - firstTemp
    const netTempDrop = firstTemp - lastTemp

    const firstHum = hSub[0].value
    const lastHum = hSub[hSub.length - 1].value
    const netHumVar = lastHum - firstHum

    const minTemp = Math.min(...tSub.map((s) => s.value))
    const maxTemp = Math.max(...tSub.map((s) => s.value))

    const minHum = Math.min(...hSub.map((s) => s.value))
    const maxHum = Math.max(...hSub.map((s) => s.value))

    const avgLux = lSub.length
      ? Math.round(lSub.reduce((sum, s) => sum + s.value, 0) / lSub.length)
      : 0

    tableData.push({
      'Bloque (10m)': labelRange,
      'T. Inicio': `${firstTemp.toFixed(1)}°C`,
      'T. Fin': `${lastTemp.toFixed(1)}°C`,
      'T. Min/Max': `${minTemp.toFixed(1)} / ${maxTemp.toFixed(1)}°C`,
      'Δ Temp (Fin - Ini)': `${netTempVar >= 0 ? '+' : ''}${netTempVar.toFixed(2)}°C`,
      'Caída Temp (Ini - Fin)': `${netTempDrop.toFixed(2)}°C`,
      'H. Inicio': `${firstHum.toFixed(1)}%`,
      'H. Fin': `${lastHum.toFixed(1)}%`,
      'H. Min/Max': `${minHum.toFixed(1)} / ${maxHum.toFixed(1)}%`,
      'Δ Hum (Fin - Ini)': `${netHumVar >= 0 ? '+' : ''}${netHumVar.toFixed(2)}%`,
      'Lux Prom': `${avgLux.toLocaleString()} lx`,
      Pts: tSub.length,
    })
  }

  console.table(tableData)
}

main().catch((err) => {
  Logger.error('Error fatal:', err)
})

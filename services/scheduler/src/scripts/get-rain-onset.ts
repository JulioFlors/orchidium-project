import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  const startTime = '2026-06-04T19:00:00Z' // 3:00 PM Caracas
  const endTime = '2026-06-04T20:20:00Z' // 4:20 PM Caracas

  console.log('==================================================')
  console.log(`ANALIZANDO INICIO DE LLUVIA DESDE 3:00 PM HASTA 4:20 PM`)
  console.log('==================================================')

  try {
    const query = `
      SELECT time, temperature, humidity, illuminance, rain_intensity
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
      ORDER BY time ASC
    `
    const stream = influxClient.query(query)

    // Agrupar muestras por minuto para tener una vista limpia
    const minutes: Record<string, { temp?: number; hum?: number; lux?: number; rainInt?: number }> =
      {}

    for await (const row of stream) {
      const dbTime = rowTimeToDate(row.time)
      const timeStr = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(dbTime) // Formato "HH:MM"

      if (!minutes[timeStr]) {
        minutes[timeStr] = {}
      }

      if (row.temperature != null) minutes[timeStr].temp = Number(row.temperature)
      if (row.humidity != null) minutes[timeStr].hum = Number(row.humidity)
      if (row.illuminance != null) minutes[timeStr].lux = Number(row.illuminance)
      if (row.rain_intensity != null) minutes[timeStr].rainInt = Number(row.rain_intensity)
    }

    const sortedMinutes = Object.keys(minutes).sort()

    for (const min of sortedMinutes) {
      const data = minutes[min]

      console.log(
        `Hora: ${min} -> Temp: ${data.temp !== undefined ? data.temp.toFixed(1) + '°C' : '   -  '} | ` +
          `Hum: ${data.hum !== undefined ? data.hum.toFixed(1) + '%' : '  -  '} | ` +
          `Lux: ${data.lux !== undefined ? data.lux.toFixed(0).padStart(5) : '  -  '} | ` +
          `RainInt: ${data.rainInt !== undefined ? data.rainInt : '-'}`,
      )
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()

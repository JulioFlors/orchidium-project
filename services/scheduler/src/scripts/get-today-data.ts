import { prisma } from '@package/database'

import { influxClient } from '../lib/influx'

interface InfluxRow {
  time?: string
  temperature?: number
  humidity?: number
  illuminance?: number
  rain_intensity?: number
}

async function main() {
  const startTime = '2026-06-04T00:00:00Z'
  const endTime = '2026-06-04T23:59:59Z'

  console.log('==================================================')
  console.log(`CONSULTANDO TELEMETRÍA INFLUXDB DESDE ${startTime} HASTA ${endTime}`)
  console.log('==================================================')

  try {
    // 1. Telemetría de la zona EXTERIOR
    console.log('\n--- METRICAS: EXTERIOR ---')
    const queryExt = `
      SELECT time, temperature, humidity, illuminance, rain_intensity
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
      ORDER BY time ASC
    `
    const streamExt = influxClient.query(queryExt)
    let countExt = 0
    const lastRowsExt: InfluxRow[] = []

    for await (const row of streamExt) {
      lastRowsExt.push(row)
      countExt++
    }

    console.log(`Total registros EXTERIOR: ${countExt}`)
    // Imprimir los últimos 30 registros para ver el comportamiento reciente (tarde)
    console.log('Últimas muestras de la tarde (EXTERIOR):')
    const startIdx = Math.max(0, lastRowsExt.length - 40)

    for (let i = startIdx; i < lastRowsExt.length; i++) {
      const r = lastRowsExt[i]

      console.log(
        `[${r.time}] Temp: ${r.temperature?.toFixed(1)}°C | Hum: ${r.humidity?.toFixed(1)}% | Lux: ${r.illuminance?.toFixed(0)} | RainInt: ${r.rain_intensity}`,
      )
    }

    // 2. Telemetría de la zona INTERIOR (ZONA_A)
    console.log('\n--- METRICAS: INTERIOR (ZONA_A) ---')
    const queryInt = `
      SELECT time, temperature, humidity, illuminance
      FROM "environment_metrics"
      WHERE "zone" = 'ZONA_A'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
      ORDER BY time ASC
    `
    const streamInt = influxClient.query(queryInt)
    let countInt = 0
    const lastRowsInt: InfluxRow[] = []

    for await (const row of streamInt) {
      lastRowsInt.push(row)
      countInt++
    }

    console.log(`Total registros INTERIOR (ZONA_A): ${countInt}`)
    console.log('Últimas muestras de la tarde (INTERIOR):')
    const startIdxInt = Math.max(0, lastRowsInt.length - 40)

    for (let i = startIdxInt; i < lastRowsInt.length; i++) {
      const r = lastRowsInt[i]

      console.log(
        `[${r.time}] Temp: ${r.temperature?.toFixed(1)}°C | Hum: ${r.humidity?.toFixed(1)}% | Lux: ${r.illuminance?.toFixed(0)}`,
      )
    }

    // 3. Eventos de lluvia en PostgreSQL
    console.log('\n--- EVENTOS DE LLUVIA EN POSTGRESQL (HOY) ---')
    const startDb = new Date('2026-06-04T00:00:00Z')
    const endDb = new Date('2026-06-04T23:59:59Z')

    const rainEvents = await prisma.rainEvent.findMany({
      where: {
        startedAt: { gte: startDb, lte: endDb },
      },
      orderBy: { startedAt: 'asc' },
    })

    console.log(`Total eventos de lluvia registrados: ${rainEvents.length}`)
    for (const event of rainEvents) {
      console.log(
        `ID: ${event.id.slice(0, 8)} | Inicio: ${event.startedAt.toISOString()} | Fin: ${event.endedAt?.toISOString() ?? 'ACTIVO'} | Duración: ${event.durationSeconds}s`,
      )
    }
  } catch (err) {
    console.error('Fallo en la ejecución del diagnóstico:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

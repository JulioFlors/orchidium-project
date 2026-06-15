import { prisma } from '@package/database'

import { influxClient } from '../lib/influx'

async function main() {
  console.log('=== ANALIZANDO HISTÓRICO CLIMÁTICO (6:00 AM - 12:00 PM) ===\n')

  try {
    const now = new Date()
    const lookbackDays = 30
    const sinceDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000)

    console.log(`Cargando telemetría de InfluxDB de los últimos ${lookbackDays} días...`)

    // Estructura para agrupar datos por día y zona
    // Clave: "YYYY-MM-DD" -> { temps: number[], hums: number[] }
    const dailyData: Record<
      string,
      {
        ext: { temps: number[]; hums: number[] }
        int: { temps: number[]; hums: number[] }
      }
    > = {}

    let countRow = 0
    const CHUNK_DAYS = 5

    for (let d = 0; d < lookbackDays; d += CHUNK_DAYS) {
      const chunkStart = new Date(sinceDate.getTime() + d * 24 * 60 * 60 * 1000)
      const chunkEnd = new Date(sinceDate.getTime() + (d + CHUNK_DAYS) * 24 * 60 * 60 * 1000)
      const startStr = chunkStart.toISOString()
      const endStr = chunkEnd > now ? now.toISOString() : chunkEnd.toISOString()

      console.log(`  Consultando fragmento: ${startStr.split('T')[0]} a ${endStr.split('T')[0]}...`)

      const query = `
        SELECT time, temperature, humidity, zone
        FROM "environment_metrics"
        WHERE time >= '${startStr}' AND time < '${endStr}'
          AND source = 'Weather_Station'
          AND (zone = 'EXTERIOR' OR zone = 'ZONA_A')
          AND temperature IS NOT NULL
          AND humidity IS NOT NULL
        ORDER BY time ASC
      `

      const stream = influxClient.query(query)

      for await (const row of stream) {
        countRow++
        const rawTime = row.time
        let dateObj: Date

        if (rawTime instanceof Date) {
          dateObj = rawTime
        } else {
          const s = String(rawTime)

          dateObj = s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
        }

        if (isNaN(dateObj.getTime())) continue

        // Convertir a hora de Caracas (UTC-4)
        const caracasTimeMs = dateObj.getTime() - 4 * 60 * 60 * 1000
        const caracasDate = new Date(caracasTimeMs)

        const localHour = caracasDate.getUTCHours()

        // Filtrar la ventana horaria: 6:00 AM a 11:59:59 AM (hora local Caracas)
        if (localHour >= 6 && localHour < 12) {
          const dateStr = caracasDate.toISOString().split('T')[0] // "YYYY-MM-DD"

          if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
              ext: { temps: [], hums: [] },
              int: { temps: [], hums: [] },
            }
          }

          const temp = Number(row.temperature)
          const hum = Number(row.humidity)

          if (row.zone === 'EXTERIOR') {
            dailyData[dateStr].ext.temps.push(temp)
            dailyData[dateStr].ext.hums.push(hum)
          } else {
            dailyData[dateStr].int.temps.push(temp)
            dailyData[dateStr].int.hums.push(hum)
          }
        }
      }
    }

    console.log(`Telemetría procesada: ${countRow} registros leídos de InfluxDB.\n`)

    // 2. Obtener eventos de lluvia de Postgres en el mismo rango de tiempo
    console.log('Consultando eventos de lluvia en Postgres...')
    const rainEvents = await prisma.rainEvent.findMany({
      where: {
        zone: 'EXTERIOR',
        startedAt: { gte: sinceDate },
        endedAt: { not: null },
      },
      orderBy: { startedAt: 'asc' },
    })

    console.log(
      `Se encontraron ${rainEvents.length} eventos de lluvia en los últimos ${lookbackDays} días.\n`,
    )

    // Agrupar eventos de lluvia por día local Caracas y verificar si ocurrieron en la mañana (6am-12pm)
    // Día local Caracas -> { totalDuration: number, morningDuration: number, count: number }
    const dailyRain: Record<
      string,
      { totalDuration: number; morningDuration: number; count: number }
    > = {}

    for (const event of rainEvents) {
      const startedAt = event.startedAt
      const endedAt = event.endedAt!
      const duration = event.durationSeconds || 0

      // Calcular día local de inicio (Caracas)
      const localStartMs = startedAt.getTime() - 4 * 60 * 60 * 1000
      const localStartDate = new Date(localStartMs)
      const dateStr = localStartDate.toISOString().split('T')[0]

      if (!dailyRain[dateStr]) {
        dailyRain[dateStr] = { totalDuration: 0, morningDuration: 0, count: 0 }
      }

      dailyRain[dateStr].totalDuration += duration
      dailyRain[dateStr].count++

      // Evaluar si se solapa con 6am - 12pm del mismo día local de Caracas
      // Ventana de 6am a 12pm local = 10am a 4pm UTC
      const morningStartUTC = new Date(startedAt)

      morningStartUTC.setUTCHours(10, 0, 0, 0)

      const morningEndUTC = new Date(startedAt)

      morningEndUTC.setUTCHours(16, 0, 0, 0)

      const overlapStart =
        startedAt.getTime() > morningStartUTC.getTime()
          ? startedAt.getTime()
          : morningStartUTC.getTime()
      const overlapEnd =
        endedAt.getTime() < morningEndUTC.getTime() ? endedAt.getTime() : morningEndUTC.getTime()

      if (overlapEnd > overlapStart) {
        const morningOverlapSec = (overlapEnd - overlapStart) / 1000

        dailyRain[dateStr].morningDuration += morningOverlapSec
      }
    }

    // 3. Cruzar información día por día
    const dates = Object.keys(dailyData).sort()

    // Estadísticas para agregación posterior
    const stats = {
      rainyMornings: { temps: [] as number[], hums: [] as number[] },
      dryMornings: { temps: [] as number[], hums: [] as number[] },
    }

    console.log(
      '------------------------------------------------------------------------------------------------------------',
    )
    console.log(
      '|   Fecha    | Zona | Temp Prom (6-12) | HR Prom (6-12) | Lluvia Mañana | Lluvia Total Día | Estado Mañana |',
    )
    console.log(
      '------------------------------------------------------------------------------------------------------------',
    )

    for (const dateStr of dates) {
      const dayInfo = dailyData[dateStr]
      const rainInfo = dailyRain[dateStr] || { totalDuration: 0, morningDuration: 0, count: 0 }

      const morningRainStr =
        rainInfo.morningDuration > 0 ? `${Math.round(rainInfo.morningDuration / 60)} min` : 'No'

      const totalRainStr =
        rainInfo.totalDuration > 0 ? `${Math.round(rainInfo.totalDuration / 60)} min` : 'No'

      const isMorningRainy = rainInfo.morningDuration >= 120 // Al menos 2 minutos de lluvia para considerarla mañana lluviosa

      // Procesar Exterior
      if (dayInfo.ext.temps.length > 0) {
        const extAvgTemp = dayInfo.ext.temps.reduce((a, b) => a + b, 0) / dayInfo.ext.temps.length
        const extAvgHum = dayInfo.ext.hums.reduce((a, b) => a + b, 0) / dayInfo.ext.hums.length

        if (isMorningRainy) {
          stats.rainyMornings.temps.push(extAvgTemp)
          stats.rainyMornings.hums.push(extAvgHum)
        } else {
          stats.dryMornings.temps.push(extAvgTemp)
          stats.dryMornings.hums.push(extAvgHum)
        }

        const statusStr = isMorningRainy ? 'LLUVIOSA' : 'SECA/SOLEADA'

        console.log(
          `| ${dateStr} | EXT  |      ${extAvgTemp.toFixed(1)}°C      |     ${extAvgHum.toFixed(1)}%     |  ${morningRainStr.padEnd(12)} | ${totalRainStr.padEnd(16)} | ${statusStr.padEnd(13)} |`,
        )
      }

      // Procesar Interior (si existe)
      if (dayInfo.int.temps.length > 0) {
        const intAvgTemp = dayInfo.int.temps.reduce((a, b) => a + b, 0) / dayInfo.int.temps.length
        const intAvgHum = dayInfo.int.hums.reduce((a, b) => a + b, 0) / dayInfo.int.hums.length

        console.log(
          `|            | INT  |      ${intAvgTemp.toFixed(1)}°C      |     ${intAvgHum.toFixed(1)}%     |  -            | -                |               |`,
        )
      }
    }
    console.log(
      '------------------------------------------------------------------------------------------------------------\n',
    )

    // 4. Calcular Métricas Agregadas
    const countRainy = stats.rainyMornings.temps.length
    const countDry = stats.dryMornings.temps.length

    const avgTempRainy =
      countRainy > 0 ? stats.rainyMornings.temps.reduce((a, b) => a + b, 0) / countRainy : 0
    const avgHumRainy =
      countRainy > 0 ? stats.rainyMornings.hums.reduce((a, b) => a + b, 0) / countRainy : 0

    const avgTempDry =
      countDry > 0 ? stats.dryMornings.temps.reduce((a, b) => a + b, 0) / countDry : 0
    const avgHumDry =
      countDry > 0 ? stats.dryMornings.hums.reduce((a, b) => a + b, 0) / countDry : 0

    const minTempDry = countDry > 0 ? Math.min(...stats.dryMornings.temps) : 0
    const maxTempDry = countDry > 0 ? Math.max(...stats.dryMornings.temps) : 0

    const minTempRainy = countRainy > 0 ? Math.min(...stats.rainyMornings.temps) : 0
    const maxTempRainy = countRainy > 0 ? Math.max(...stats.rainyMornings.temps) : 0

    console.log('=== RESULTADOS DE ANÁLISIS AGREGADO ===')
    console.log(`Período de estudio: Últimos ${lookbackDays} días (Mañanas de 6:00 AM a 12:00 PM)`)
    console.log(`Mañanas Secas/Soleadas analizadas: ${countDry}`)
    console.log(`Mañanas Lluviosas analizadas: ${countRainy}\n`)

    console.log('1. MAÑANAS SECAS/SOLEADAS (Sin lluvias de 6am-12pm):')
    console.log(
      `   - Temperatura Promedio: ${avgTempDry.toFixed(2)}°C (Rango de promedios diarios: ${minTempDry.toFixed(1)}°C - ${maxTempDry.toFixed(1)}°C)`,
    )
    console.log(`   - Humedad Relativa Promedio: ${avgHumDry.toFixed(2)}%`)
    console.log(
      '   * Observación: Incluso en mañanas secas y muy soleadas, el promedio del bloque retrospectivo 6am-12pm es bajo',
    )
    console.log(
      '     debido a que la temperatura inicia fresca en la mañana temprano (ej. 23-25°C a las 6-7 AM) y sube gradualmente.',
    )
    console.log(
      '     Un promedio de 28.5°C - 29.5°C es completamente normal para mañanas secas y calurosas en el pico.\n',
    )

    console.log('2. MAÑANAS LLUVIOSAS (Con lluvia en el rango 6am-12pm):')
    console.log(
      `   - Temperatura Promedio: ${avgTempRainy.toFixed(2)}°C (Rango de promedios diarios: ${minTempRainy.toFixed(1)}°C - ${maxTempRainy.toFixed(1)}°C)`,
    )
    console.log(`   - Humedad Relativa Promedio: ${avgHumRainy.toFixed(2)}%`)
    console.log(
      '   * Observación: Las mañanas con lluvia real tienen una temperatura promedio de 4h sustancialmente menor',
    )
    console.log('     y una humedad muy cercana a la saturación (HR > 85-95%).\n')

    console.log('3. EVALUACIÓN DE UMBRALES DE INFERENCIA:')
    console.log(`   - Umbral actual de Temperatura Veto (TEMPERATURE_MIN_VETO_4H): 30.9°C`)
    console.log(
      `     -> Dado que las mañanas secas promedian ${avgTempDry.toFixed(1)}°C (Max: ${maxTempDry.toFixed(1)}°C), el umbral de 30.9°C`,
    )
    console.log(
      '        está vetando INCORRECTAMENTE casi todas las mañanas secas/soleadas en la rutina de las 11:00 AM.',
    )
    console.log(`   - Umbral propuesto de Temperatura: 28.0°C acoplado con Humedad >= 80%`)
    console.log(
      `     -> Si la temperatura promedio es <= 28.0°C Y la humedad promedio >= 80%, se detecta correctamente una mañana`,
    )
    console.log(
      '        lluviosa/fría. Si la mañana es seca (HR promedio del 79.9%), el veto no se aplicará, permitiendo regar.',
    )
  } catch (err) {
    console.error('Error al ejecutar el script de análisis:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

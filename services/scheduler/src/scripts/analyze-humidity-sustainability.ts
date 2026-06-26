import * as fs from 'fs'
import * as path from 'path'

import { prisma } from '@package/database'

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info('   AUDITORÍA CLIMÁTICA SIN SESGOS DE HUMEDAD DIURNA     ')
  Logger.info('════════════════════════════════════════════════════════')

  const now = new Date()
  const BACKFILL_DAYS = 30
  const startTime = new Date(now)

  startTime.setDate(startTime.getDate() - BACKFILL_DAYS)
  startTime.setHours(0, 0, 0, 0)

  Logger.info(
    `Analizando los últimos ${BACKFILL_DAYS} días a partir de: ${startTime.toISOString()}`,
  )

  // 1. Obtener eventos de lluvia registrados en Postgres para cruzar datos
  const rainEvents = await prisma.rainEvent.findMany({
    where: {
      zone: 'EXTERIOR',
      startedAt: { gte: startTime },
    },
    orderBy: { startedAt: 'asc' },
  })

  Logger.info(`Encontrados ${rainEvents.length} eventos de lluvia en Postgres para el período.`)

  // 2. Traer métricas de InfluxDB en bloques de 5 días para evitar timeouts
  const BLOCK_MS = 5 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = now.getTime()

  interface MetricRow {
    time: number
    humidity: number
    temperature: number
    zone: string
  }

  const metrics: MetricRow[] = []

  while (startMs < endMs) {
    const blockStart = new Date(startMs)
    let nextMs = startMs + BLOCK_MS

    if (nextMs > endMs) nextMs = endMs
    const blockEnd = new Date(nextMs)

    const query = `
      SELECT time, humidity, temperature, zone
      FROM "environment_metrics"
      WHERE time >= '${blockStart.toISOString()}'
        AND time < '${blockEnd.toISOString()}'
        AND source = 'Weather_Station'
        AND humidity IS NOT NULL
        AND humidity >= 10.0 AND humidity <= 100.0
      ORDER BY time ASC
    `

    try {
      const stream = influxClient.query(query)

      for await (const row of stream) {
        if (row.time && row.humidity != null && row.temperature != null) {
          const rDate = new Date(row.time)

          metrics.push({
            time: rDate.getTime(),
            humidity: Number(row.humidity),
            temperature: Number(row.temperature),
            zone: String(row.zone),
          })
        }
      }
    } catch (err) {
      Logger.error(`Error consultando bloque de InfluxDB:`, err)
    }

    startMs = nextMs
  }

  Logger.info(`Muestras cargadas desde InfluxDB: ${metrics.length}`)

  // Estructuras de resultados agregados por categoría
  type CategoryKey = 'SECO' | 'LLUVIA_ANTES' | 'LLUVIA_DESPUES' | 'DURANTE_LLUVIA' | 'LLUVIA_MIXTO'

  interface WindowStat {
    humValues: number[]
    tempValues: number[]
    dayDates: string[]
  }

  const initWindowStats = (): Record<CategoryKey, WindowStat> => ({
    SECO: { humValues: [], tempValues: [], dayDates: [] },
    LLUVIA_ANTES: { humValues: [], tempValues: [], dayDates: [] },
    LLUVIA_DESPUES: { humValues: [], tempValues: [], dayDates: [] },
    DURANTE_LLUVIA: { humValues: [], tempValues: [], dayDates: [] },
    LLUVIA_MIXTO: { humValues: [], tempValues: [], dayDates: [] },
  })

  const results = {
    v1: initWindowStats(), // 7:00 AM - 11:00 AM
    v2: initWindowStats(), // 11:00 AM - 3:00 PM
    v3: initWindowStats(), // 12:00 PM - 4:00 PM
  }

  interface DailyDetail {
    dateStr: string
    rainEventsCount: number
    windows: {
      v1: { avgHum: number; avgTemp: number; cat: CategoryKey; samples: number }
      v2: { avgHum: number; avgTemp: number; cat: CategoryKey; samples: number }
      v3: { avgHum: number; avgTemp: number; cat: CategoryKey; samples: number }
    }
  }

  const dailyDetails: DailyDetail[] = []

  // 3. Procesar día por día
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(startTime)

    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]

    // Límites del día en Caracas (UTC-4)
    // 00:00:00 Caracas = UTC + 4h
    // 23:59:59 Caracas = UTC + 28h (excluido)
    const baseUTC = new Date(`${dateStr}T00:00:00.000Z`)
    const dayStartMs = baseUTC.getTime() + 4 * 60 * 60 * 1000
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000

    // Eventos de lluvia del día
    const rainInDay = rainEvents.filter((re) => {
      const rStart = re.startedAt.getTime()
      const rEnd = (re.endedAt || new Date()).getTime()

      return rStart < dayEndMs && rEnd > dayStartMs
    })

    const processWindow = (
      startHourCaracas: number,
      endHourCaracas: number,
      windowKey: 'v1' | 'v2' | 'v3',
    ) => {
      const wStartMs = dayStartMs + startHourCaracas * 60 * 60 * 1000
      const wEndMs = dayStartMs + endHourCaracas * 60 * 60 * 1000

      // Métricas en la ventana
      const windowMetrics = metrics.filter(
        (m) => m.time >= wStartMs && m.time < wEndMs && m.zone === 'EXTERIOR',
      )

      if (windowMetrics.length === 0) {
        return { avgHum: 0, avgTemp: 0, cat: 'SECO' as CategoryKey, samples: 0 }
      }

      const sumHum = windowMetrics.reduce((acc, m) => acc + m.humidity, 0)
      const sumTemp = windowMetrics.reduce((acc, m) => acc + m.temperature, 0)
      const avgHum = sumHum / windowMetrics.length
      const avgTemp = sumTemp / windowMetrics.length

      // Determinar si llovió en la ventana
      const rainInWindow = rainInDay.filter((re) => {
        const rStart = re.startedAt.getTime()
        const rEnd = (re.endedAt || new Date()).getTime()

        return rStart < wEndMs && rEnd > wStartMs
      })

      let cat: CategoryKey = 'SECO'

      if (rainInDay.length === 0) {
        cat = 'SECO'
      } else if (rainInWindow.length > 0) {
        cat = 'DURANTE_LLUVIA'
      } else {
        // Llovió en el día pero no en la ventana
        const todosLluviaDespues = rainInDay.every((re) => re.startedAt.getTime() >= wEndMs)
        const todosLluviaAntes = rainInDay.every(
          (re) => (re.endedAt || new Date()).getTime() <= wStartMs,
        )

        if (todosLluviaDespues) {
          cat = 'LLUVIA_ANTES' // Lluvia ocurre después, así que la ventana es "antes" de la lluvia
        } else if (todosLluviaAntes) {
          cat = 'LLUVIA_DESPUES' // Lluvia ocurre antes, así que la ventana es "después" de la lluvia
        } else {
          cat = 'LLUVIA_MIXTO'
        }
      }

      // Guardar en agregado
      results[windowKey][cat].humValues.push(avgHum)
      results[windowKey][cat].tempValues.push(avgTemp)
      results[windowKey][cat].dayDates.push(dateStr)

      return { avgHum, avgTemp, cat, samples: windowMetrics.length }
    }

    const v1Res = processWindow(7, 11, 'v1')
    const v2Res = processWindow(11, 15, 'v2')
    const v3Res = processWindow(12, 16, 'v3')

    dailyDetails.push({
      dateStr,
      rainEventsCount: rainInDay.length,
      windows: {
        v1: v1Res,
        v2: v2Res,
        v3: v3Res,
      },
    })
  }

  // 4. Formatear y guardar el reporte en Markdown
  const artifactDir =
    'C:\\Users\\Julio\\.gemini\\antigravity\\brain\\b1d5745b-10a2-4a52-9a21-f76d66498382'
  const reportPath = path.join(artifactDir, 'auditoria_humedad_sin_sesgo.md')

  let mdContent = `# Reporte de Auditoría: Saturación de Humedad Diurna Sin Sesgos\n\n`

  mdContent += `* **Periodo de Análisis**: Últimos ${BACKFILL_DAYS} días (${startTime.toISOString().split('T')[0]} al ${now.toISOString().split('T')[0]})\n`
  mdContent += `* **Área Evaluada**: Sensor Meteorológico Exterior (Weather Station)\n`
  mdContent += `* **Zona Horaria**: Caracas (UTC-4)\n`
  mdContent += `* **Objetivo**: Evaluar los perfiles de humedad relativa y temperatura promedio en las ventanas de riego antes, durante y después de lluvias para identificar un umbral de saturación hídrica diurna real sin sesgo de corte previo.\n\n`

  mdContent += `## Resumen Agregado por Ventana y Categoría Climática\n\n`

  const categoriesDesc: Record<CategoryKey, string> = {
    SECO: 'Día Seco (Sin lluvia en todo el día)',
    LLUVIA_ANTES: 'Día Lluvioso - Ventana antes de la lluvia',
    LLUVIA_DESPUES: 'Día Lluvioso - Ventana después de la lluvia',
    DURANTE_LLUVIA: 'Durante el Evento de Lluvia (Solapado)',
    LLUVIA_MIXTO: 'Día Lluvioso - Mixto / Fuera de ventana',
  }

  const renderTableForWindow = (windowTitle: string, windowKey: 'v1' | 'v2' | 'v3') => {
    let t = `### ${windowTitle}\n\n`

    t += `| Categoría Climática | Días | Humedad Relativa Media (Min - Max) | Temperatura Media (Min - Max) |\n`
    t += `| :--- | :---: | :--- | :--- |\n`

    const cats: CategoryKey[] = [
      'SECO',
      'LLUVIA_ANTES',
      'LLUVIA_DESPUES',
      'DURANTE_LLUVIA',
      'LLUVIA_MIXTO',
    ]

    for (const cat of cats) {
      const stat = results[windowKey][cat]
      const count = stat.humValues.length

      if (count === 0) {
        t += `| ${categoriesDesc[cat]} | 0 | *Sin datos* | *Sin datos* |\n`
      } else {
        const avgHum = stat.humValues.reduce((a, b) => a + b, 0) / count
        const minHum = Math.min(...stat.humValues)
        const maxHum = Math.max(...stat.humValues)
        const avgTemp = stat.tempValues.reduce((a, b) => a + b, 0) / count
        const minTemp = Math.min(...stat.tempValues)
        const maxTemp = Math.max(...stat.tempValues)

        t += `| ${categoriesDesc[cat]} | ${count} | **${avgHum.toFixed(1)}%** (${minHum.toFixed(1)}% - ${maxHum.toFixed(1)}%) | **${avgTemp.toFixed(1)}°C** (${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C) |\n`
      }
    }
    t += `\n`

    return t
  }

  mdContent += renderTableForWindow(
    'Ventana 1: 7:00 AM - 11:00 AM (Previo a la Humectación de las 11:00 AM)',
    'v1',
  )
  mdContent += renderTableForWindow(
    'Ventana 2: 11:00 AM - 3:00 PM (Previo a la Humectación de las 3:00 PM)',
    'v2',
  )
  mdContent += renderTableForWindow(
    'Ventana 3: 12:00 PM - 4:00 PM (Previo a la Humidificación de las 4:00 PM)',
    'v3',
  )

  mdContent += `## Conclusiones Clave de la Auditoría\n\n`
  mdContent += `Tras analizar los promedios reales, podemos concluir:\n`

  // Calcular promedios para conclusiones dinámicas
  const getAggSummary = (wk: 'v1' | 'v2' | 'v3', cat: CategoryKey) => {
    const vals = results[wk][cat].humValues

    if (vals.length === 0) return 'N/A'

    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + '%'
  }

  mdContent += `1. **Humedad Relativa en Días Secos**:\n`
  mdContent += `   - Ventana 7:00 AM - 11:00 AM: ${getAggSummary('v1', 'SECO')}\n`
  mdContent += `   - Ventana 11:00 AM - 3:00 PM: ${getAggSummary('v2', 'SECO')}\n`
  mdContent += `   - Ventana 12:00 PM - 4:00 PM: ${getAggSummary('v3', 'SECO')}\n`
  mdContent += `2. **Efecto de Lluvias Recientes (Después de Lluvia)**:\n`
  mdContent += `   - Ventana 7:00 AM - 11:00 AM: ${getAggSummary('v1', 'LLUVIA_DESPUES')} (Días: ${results.v1.LLUVIA_DESPUES.humValues.length})\n`
  mdContent += `   - Ventana 11:00 AM - 3:00 PM: ${getAggSummary('v2', 'LLUVIA_DESPUES')} (Días: ${results.v2.LLUVIA_DESPUES.humValues.length})\n`
  mdContent += `   - Ventana 12:00 PM - 4:00 PM: ${getAggSummary('v3', 'LLUVIA_DESPUES')} (Días: ${results.v3.LLUVIA_DESPUES.humValues.length})\n`
  mdContent += `3. **Comportamiento Durante la Lluvia**:\n`
  mdContent += `   - Ventana 7:00 AM - 11:00 AM: ${getAggSummary('v1', 'DURANTE_LLUVIA')}\n`
  mdContent += `   - Ventana 11:00 AM - 3:00 PM: ${getAggSummary('v2', 'DURANTE_LLUVIA')}\n`
  mdContent += `   - Ventana 12:00 PM - 4:00 PM: ${getAggSummary('v3', 'DURANTE_LLUVIA')}\n\n`

  mdContent += `## Detalle Diario del Análisis\n\n`
  mdContent += `A continuación se listan los resultados diarios para cada ventana evaluada:\n\n`
  mdContent += `| Fecha | Lluvias | Ventana 1 (7-11 AM) HR/Temp/Cat | Ventana 2 (11 AM-3 PM) HR/Temp/Cat | Ventana 3 (12-4 PM) HR/Temp/Cat |\n`
  mdContent += `| :--- | :---: | :--- | :--- | :--- |\n`

  for (const d of dailyDetails) {
    const v1Str =
      d.windows.v1.samples > 0
        ? `${d.windows.v1.avgHum.toFixed(1)}% / ${d.windows.v1.avgTemp.toFixed(1)}°C (${d.windows.v1.cat})`
        : 'N/A'
    const v2Str =
      d.windows.v2.samples > 0
        ? `${d.windows.v2.avgHum.toFixed(1)}% / ${d.windows.v2.avgTemp.toFixed(1)}°C (${d.windows.v2.cat})`
        : 'N/A'
    const v3Str =
      d.windows.v3.samples > 0
        ? `${d.windows.v3.avgHum.toFixed(1)}% / ${d.windows.v3.avgTemp.toFixed(1)}°C (${d.windows.v3.cat})`
        : 'N/A'

    mdContent += `| ${d.dateStr} | ${d.rainEventsCount} | ${v1Str} | ${v2Str} | ${v3Str} |\n`
  }

  fs.writeFileSync(reportPath, mdContent, 'utf-8')
  Logger.info(`Reporte markdown generado exitosamente en: ${reportPath}`)

  await prisma.$disconnect()
  await influxClient.close()
}

main().catch((err) => {
  Logger.error('Fallo en el script de auditoría:', err)
})

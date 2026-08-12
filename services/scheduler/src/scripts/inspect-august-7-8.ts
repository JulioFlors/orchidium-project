import { prisma, ZoneType } from '@package/database'

import { influxClient } from '../lib/influx'
import { Sample } from '../lib/rain-manager'

async function main() {
  const startTs = new Date('2026-08-07T00:00:00-04:00').getTime()
  const endTs = new Date('2026-08-08T23:59:59-04:00').getTime()

  console.log('================================================================')
  console.log('  INSPECCIÓN DE TELEMETRÍA Y MOTOR DE INFERENCIA: 7 Y 8 DE AGOSTO')
  console.log('================================================================')

  // 1. Obtener eventos inferidos guardados en Postgres para este rango
  const postgresEvents = await prisma.rainEvent.findMany({
    where: {
      zone: ZoneType.EXTERIOR,
      startedAt: {
        gte: new Date(startTs),
        lte: new Date(endTs),
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  console.log(`\n--- [POSTGRES] Eventos registrados: ${postgresEvents.length} ---`)

  for (const ev of postgresEvents) {
    console.log(
      `  ID: ${ev.id} | Tipo: ${ev.triggerType || 'N/A'} | Inferido: ${ev.isInfered} | Inicio: ${ev.startedAt.toISOString()} | Fin: ${ev.endedAt?.toISOString() || 'ABIERTO'}`,
    )
  }

  // 2. Extraer muestras de InfluxDB para ver los lotes de 10 min minuciosamente
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${new Date(startTs).toISOString()}' AND time <= '${new Date(endTs).toISOString()}'
    ORDER BY time ASC
  `
  const tempSamples: Sample[] = []
  const humSamples: Sample[] = []
  const luxSamples: Sample[] = []

  type InfluxRow = {
    time: string
    temperature?: number | null
    humidity?: number | null
    illuminance?: number | null
  }

  for await (const r of influxClient.query(query) as AsyncIterable<InfluxRow>) {
    const tMs = new Date(r.time).getTime()

    if (isNaN(tMs)) continue

    if (r.temperature !== undefined && r.temperature !== null) {
      tempSamples.push({ value: Number(r.temperature), timestamp: tMs })
    }
    if (r.humidity !== undefined && r.humidity !== null) {
      humSamples.push({ value: Number(r.humidity), timestamp: tMs })
    }
    if (r.illuminance !== undefined && r.illuminance !== null) {
      luxSamples.push({ value: Number(r.illuminance), timestamp: tMs })
    }
  }

  console.log(
    `\nMuestras leídas de Influx: Temp=${tempSamples.length}, Hum=${humSamples.length}, Lux=${luxSamples.length}`,
  )

  // 3. Inspeccionar minutero o por lotes de 10 min las ventanas clave
  console.log('\n--- 📊 TELEMETRÍA POR LOTES DE 10m (7 de Agosto 12:00pm - 3:00pm) ---')
  printBatchBreakdown(
    tempSamples,
    humSamples,
    luxSamples,
    '2026-08-07T12:00:00-04:00',
    '2026-08-07T15:00:00-04:00',
  )

  console.log('\n--- 📊 TELEMETRÍA POR LOTES DE 10m (8 de Agosto 11:00am - 2:00pm) ---')
  printBatchBreakdown(
    tempSamples,
    humSamples,
    luxSamples,
    '2026-08-08T11:00:00-04:00',
    '2026-08-08T14:00:00-04:00',
  )
}

function printBatchBreakdown(
  tempSamples: Sample[],
  humSamples: Sample[],
  luxSamples: Sample[],
  fromIsoStr: string,
  toIsoStr: string,
) {
  const fromMs = new Date(fromIsoStr).getTime()
  const toMs = new Date(toIsoStr).getTime()

  let curr = fromMs

  while (curr < toMs) {
    const next = curr + 10 * 60 * 1000

    const tSub = tempSamples.filter((s) => s.timestamp >= curr && s.timestamp < next)
    const hSub = humSamples.filter((s) => s.timestamp >= curr && s.timestamp < next)
    const lSub = luxSamples.filter((s) => s.timestamp >= curr && s.timestamp < next)

    const label = new Date(curr).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })

    if (tSub.length > 0 && hSub.length > 0) {
      const minT = Math.min(...tSub.map((s) => s.value))
      const maxT = Math.max(...tSub.map((s) => s.value))
      const deltaT = tSub[tSub.length - 1].value - tSub[0].value

      const minH = Math.min(...hSub.map((s) => s.value))
      const maxH = Math.max(...hSub.map((s) => s.value))
      const deltaH = hSub[hSub.length - 1].value - hSub[0].value

      const minL = lSub.length > 0 ? Math.min(...lSub.map((s) => s.value)) : 0
      const maxL = lSub.length > 0 ? Math.max(...lSub.map((s) => s.value)) : 0

      console.log(
        `[${label} - ${new Date(next).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas' })}]: Temp: ${tSub[0].value.toFixed(1)}→${tSub[tSub.length - 1].value.toFixed(1)}°C (min:${minT.toFixed(1)}, max:${maxT.toFixed(1)}, Δ:${deltaT >= 0 ? '+' : ''}${deltaT.toFixed(1)}) | Hum: ${hSub[0].value.toFixed(1)}→${hSub[hSub.length - 1].value.toFixed(1)}% (min:${minH.toFixed(1)}, max:${maxH.toFixed(1)}, Δ:${deltaH >= 0 ? '+' : ''}${deltaH.toFixed(1)}) | Lux: ${minL.toFixed(0)} - ${maxL.toFixed(0)} lx`,
      )
    } else {
      console.log(`[${label}]: (Sin muestras suficientes)`)
    }

    curr = next
  }
}

main().catch(console.error)

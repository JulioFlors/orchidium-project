import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'
import { isDaytime } from '../lib/rain-manager'

const START_DATE = new Date('2026-07-24T16:00:00.000Z') // 12:00 PM Caracas
const END_DATE = new Date('2026-07-24T19:00:00.000Z') // 3:00 PM Caracas

interface Sample {
  value: number
  timestamp: number
}

interface BatchSummary {
  min: number
  max: number
  timestamp: number
  samples: Sample[]
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info('  EVALUACIÓN DE ESTANCAMIENTO DESLIZANTE DE 10M EN VENTANA DE 20M')
  Logger.info('════════════════════════════════════════════════════════')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${START_DATE.toISOString()}'
      AND time <= '${END_DATE.toISOString()}'
    ORDER BY time ASC
  `

  const allSamples: { temp: Sample[]; hum: Sample[]; lux: Sample[] } = {
    temp: [],
    hum: [],
    lux: [],
  }

  const stream = influxClient.query(query)

  for await (const row of stream) {
    const tDate = rowTimeToDate(row.time)
    const tMs = tDate.getTime()

    if (row.temperature != null) {
      const v = Number(row.temperature)

      if (v > 5.0 && v < 55.0) allSamples.temp.push({ value: v, timestamp: tMs })
    }
    if (row.humidity != null) {
      const v = Number(row.humidity)

      if (v > 10.0 && v <= 100.0) allSamples.hum.push({ value: v, timestamp: tMs })
    }
    if (row.illuminance != null) {
      const v = Number(row.illuminance)

      if (v >= 0) allSamples.lux.push({ value: v, timestamp: tMs })
    }
  }

  const timestamps = Array.from(
    new Set([
      ...allSamples.temp.map((s) => s.timestamp),
      ...allSamples.hum.map((s) => s.timestamp),
      ...allSamples.lux.map((s) => s.timestamp),
    ]),
  ).sort((a, b) => a - b)

  // 1. Simulación Método ACTUAL (Ventana Rígida de 20 min en Batches B0+B1)
  Logger.info('\n----------------------------------------------------')
  Logger.info('MÉTODO A: Ventana Rígida B0+B1 (Código Actual)')
  runSimulationRigid(allSamples, timestamps)

  // 2. Simulación Método PROPUESTO (Ventana Deslizante de 10m Muestra a Muestra en 20m)
  Logger.info('\n----------------------------------------------------')
  Logger.info('MÉTODO B: Ventana Deslizante Muestra a Muestra (Propuesta del Usuario)')
  runSimulationSliding(allSamples, timestamps)
}

function runSimulationRigid(allSamples: Record<string, unknown>, timestamps: number[]) {
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []
  let isActive = false
  let rainStartedAt: number | null = null

  for (const tMs of timestamps) {
    const buildBatch = (samples: Sample[], startMin: number, endMin: number): Sample[] => {
      const start = tMs - startMin * 60 * 1000
      const end = tMs - endMin * 60 * 1000

      return samples.filter((s) => s.timestamp >= start && s.timestamp < end)
    }

    const tS0 = buildBatch(allSamples.temp, 10, 0)
    const hS0 = buildBatch(allSamples.hum, 10, 0)
    const lS0 = buildBatch(allSamples.lux, 10, 0)

    const tS1 = buildBatch(allSamples.temp, 20, 10)
    const hS1 = buildBatch(allSamples.hum, 20, 10)
    const lS1 = buildBatch(allSamples.lux, 20, 10)

    if (tS0.length < 3 || hS0.length < 3 || tS1.length < 3 || hS1.length < 3) continue

    tempBatches[0] = {
      min: Math.min(...tS0.map((s) => s.value)),
      max: Math.max(...tS0.map((s) => s.value)),
      timestamp: tMs,
      samples: tS0,
    }
    tempBatches[1] = {
      min: Math.min(...tS1.map((s) => s.value)),
      max: Math.max(...tS1.map((s) => s.value)),
      timestamp: tMs - 10000,
      samples: tS1,
    }

    humBatches[0] = {
      min: Math.min(...hS0.map((s) => s.value)),
      max: Math.max(...hS0.map((s) => s.value)),
      timestamp: tMs,
      samples: hS0,
    }
    humBatches[1] = {
      min: Math.min(...hS1.map((s) => s.value)),
      max: Math.max(...hS1.map((s) => s.value)),
      timestamp: tMs - 10000,
      samples: hS1,
    }

    luxBatches[0] = {
      min: lS0.length ? Math.min(...lS0.map((s) => s.value)) : 0,
      max: lS0.length ? Math.max(...lS0.map((s) => s.value)) : 0,
      timestamp: tMs,
      samples: lS0,
    }
    luxBatches[1] = {
      min: lS1.length ? Math.min(...lS1.map((s) => s.value)) : 0,
      max: lS1.length ? Math.max(...lS1.map((s) => s.value)) : 0,
      timestamp: tMs - 10000,
      samples: lS1,
    }

    const isDay = isDaytime(tMs)

    if (!isActive) {
      const dTemp1 = tempBatches[0].min - tempBatches[1].max
      const dHum1 = humBatches[0].max - humBatches[1].min

      if (isDay && dTemp1 <= -2.5 && dHum1 >= 6.0) {
        isActive = true
        rainStartedAt = tMs
        Logger.success(`🌧️ [INICIO] ${new Date(tMs).toLocaleTimeString('es-VE')}`)
      }
    } else {
      const durMin = (tMs - rainStartedAt!) / 60000

      if (durMin >= 10) {
        const firstTemp = tS0[0]?.value ?? tempBatches[0].min
        const lastTemp = tS0[tS0.length - 1]?.value ?? tempBatches[0].min
        const netTempDrop = firstTemp - lastTemp

        const firstHum = hS0[0]?.value ?? humBatches[0].min
        const lastHum = hS0[hS0.length - 1]?.value ?? humBatches[0].max
        const netHumRise = lastHum - firstHum

        const isSaturated = humBatches[0].max >= 100.0
        const isHumStagnant = isSaturated ? true : netHumRise <= 1.0
        const isTempStagnant = netTempDrop <= 0.4

        const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
        const caidaNeta20 = maxTemp20 - tempBatches[0].min
        const allowStagnantClose = caidaNeta20 <= 0.4

        if (isHumStagnant && isTempStagnant && allowStagnantClose) {
          isActive = false
          Logger.success(
            `☁️ [CESE CERRADO - RIGIDO] ${new Date(tMs).toLocaleTimeString('es-VE')} (Duración: ${durMin.toFixed(1)} min)`,
          )
        }
      }
    }
  }
}

function runSimulationSliding(allSamples: Record<string, unknown>, timestamps: number[]) {
  let isActive = false
  let rainStartedAt: number | null = null

  for (const tMs of timestamps) {
    // Tomar muestras de los últimos 20 min
    const samples20Temp = allSamples.temp.filter(
      (s: Sample) => s.timestamp >= tMs - 20 * 60 * 1000 && s.timestamp <= tMs,
    )
    const samples20Hum = allSamples.hum.filter(
      (s: Sample) => s.timestamp >= tMs - 20 * 60 * 1000 && s.timestamp <= tMs,
    )

    if (samples20Temp.length < 5 || samples20Hum.length < 5) continue

    const isDay = isDaytime(tMs)

    if (!isActive) {
      // Misma lógica de inicio
      const tS0 = samples20Temp.filter((s: Sample) => s.timestamp >= tMs - 10 * 60 * 1000)
      const tS1 = samples20Temp.filter(
        (s: Sample) => s.timestamp >= tMs - 20 * 60 * 1000 && s.timestamp < tMs - 10 * 60 * 1000,
      )
      const hS0 = samples20Hum.filter((s: Sample) => s.timestamp >= tMs - 10 * 60 * 1000)
      const hS1 = samples20Hum.filter(
        (s: Sample) => s.timestamp >= tMs - 20 * 60 * 1000 && s.timestamp < tMs - 10 * 60 * 1000,
      )

      if (tS0.length >= 3 && tS1.length >= 3 && hS0.length >= 3 && hS1.length >= 3) {
        const minTemp0 = Math.min(...tS0.map((s: Sample) => s.value))
        const maxTemp1 = Math.max(...tS1.map((s: Sample) => s.value))
        const maxHum0 = Math.max(...hS0.map((s: Sample) => s.value))
        const minHum1 = Math.min(...hS1.map((s: Sample) => s.value))

        const dTemp = minTemp0 - maxTemp1
        const dHum = maxHum0 - minHum1

        if (isDay && dTemp <= -2.5 && dHum >= 6.0) {
          isActive = true
          rainStartedAt = tMs
          Logger.success(`🌧️ [INICIO] ${new Date(tMs).toLocaleTimeString('es-VE')}`)
        }
      }
    } else {
      const durMin = (tMs - rainStartedAt!) / 60000

      if (durMin >= 10) {
        // PROPUESTA DEL USUARIO:
        // Evaluar deslizantemente cualquier sub-ventana de 10 min dentro de los últimos 20 min
        let foundStagnantSubWindow = false
        let stagnantEndMs = tMs

        // Evaluar sub-ventanas con desfase k (0 min, 2 min, 4 min, 6 min, 8 min, 10 min)
        for (let offsetMin = 0; offsetMin <= 10; offsetMin += 1) {
          const winEnd = tMs - offsetMin * 60 * 1000
          const winStart = winEnd - 10 * 60 * 1000

          const subT = samples20Temp.filter(
            (s: Sample) => s.timestamp >= winStart && s.timestamp <= winEnd,
          )
          const subH = samples20Hum.filter(
            (s: Sample) => s.timestamp >= winStart && s.timestamp <= winEnd,
          )

          if (subT.length >= 3 && subH.length >= 3) {
            subT.sort((a: Sample, b: Sample) => a.timestamp - b.timestamp)
            subH.sort((a: Sample, b: Sample) => a.timestamp - b.timestamp)

            const firstTemp = subT[0].value
            const lastTemp = subT[subT.length - 1].value
            const netTempDrop = firstTemp - lastTemp // caída neta en esos 10 min

            const firstHum = subH[0].value
            const lastHum = subH[subH.length - 1].value
            const netHumRise = lastHum - firstHum // aumento neto de humedad en esos 10 min

            const maxHum = Math.max(...subH.map((s: Sample) => s.value))
            const isSaturated = maxHum >= 100.0

            const isHumStag = isSaturated ? true : netHumRise <= 1.0
            const isTempStag = netTempDrop <= 0.4

            // Evaluación de estancamiento en esta sub-ventana
            if (isHumStag && isTempStag) {
              foundStagnantSubWindow = true
              stagnantEndMs = winEnd
              break
            }
          }
        }

        if (foundStagnantSubWindow) {
          isActive = false
          const endStr = new Date(stagnantEndMs).toLocaleTimeString('es-VE')
          const realDurMin = (stagnantEndMs - rainStartedAt!) / 60000

          Logger.success(
            `☁️ [CESE CERRADO - DESLIZANTE] ${endStr} (Duración real: ${realDurMin.toFixed(1)} min)`,
          )
        }
      }
    }
  }
}

main().catch((err) => {
  Logger.error('Error fatal:', err)
})

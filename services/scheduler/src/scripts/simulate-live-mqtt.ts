import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

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

const tempBatches: BatchSummary[] = []
const humBatches: BatchSummary[] = []
const luxBatches: BatchSummary[] = []

const inferedRainActive = false
const lastInferedRainClosedAt: number | null = null

function pushBatchMetrics(queue: BatchSummary[], values: number[], now: number, isLux = false) {
  if (values.length === 0) return

  const samples = values.map((val, idx) => ({
    value: val,
    timestamp: now - (values.length - 1 - idx) * 60000,
  }))

  if (queue.length > 0 && now - queue[0].timestamp < 5 * 60 * 1000) {
    queue[0].samples.push(...samples)
    queue[0].timestamp = now

    const allValues = queue[0].samples.map((s) => s.value)

    if (isLux) {
      const sortedAsc = [...allValues].sort((a, b) => a - b)
      const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

      queue[0].min = low5.reduce((sum, val) => sum + val, 0) / low5.length
      queue[0].max = allValues.reduce((sum, val) => sum + val, 0) / allValues.length
    } else {
      queue[0].min = Math.min(...allValues)
      queue[0].max = Math.max(...allValues)
    }
  } else {
    let min = Math.min(...values)
    let max = Math.max(...values)

    if (isLux && values.length > 0) {
      const sortedAsc = [...values].sort((a, b) => a - b)
      const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

      min = low5.reduce((sum, val) => sum + val, 0) / low5.length
      max = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    queue.unshift({ min, max, timestamp: now, samples })
    if (queue.length > 6) queue.pop()
  }
}

function evaluateClimateInference(nowMs: number): boolean {
  if (tempBatches.length < 3 || humBatches.length < 3 || luxBatches.length < 3) {
    return false
  }

  const currentMinTemp = tempBatches[0].min
  const currentMaxHum = humBatches[0].max
  const currentMinLux = luxBatches[0].min

  const caracasHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      hour12: false,
    }).format(new Date(tempBatches[0].timestamp)),
  )
  const isDay = caracasHour >= 7 && caracasHour < 18

  if (!inferedRainActive) {
    if (lastInferedRainClosedAt !== null && nowMs - lastInferedRainClosedAt < 10 * 60 * 1000) {
      return false
    }

    if (currentMinLux >= 26000) {
      return false
    }

    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    if (isDay) {
      // Reglas de día...
      return false
    } else {
      // Reglas de noche
      if (tempBatches.length >= 4 && humBatches.length >= 4) {
        const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPre - minTempPre

        const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const varHumPre = maxHumPre - minHumPre

        const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
        const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
        const varTempCur = maxTempCur - minTempCur

        const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
        const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
        const varHumCur = maxHumCur - minHumCur

        const tempDropThreshold = Math.max(0.7, varTempPre * 1.8)
        const humRiseThreshold = Math.max(3.0, varHumPre * 1.6)

        const trendTemp = tempBatches[0].min - tempBatches[2].max
        const isTempFalling = trendTemp < -0.1

        const trendHum = humBatches[0].max - humBatches[2].min
        const isHumRising = trendHum > 0.5

        const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
        const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
          return true
        }
      }
    }
  }

  return false
}

async function main() {
  console.log('Querying InfluxDB for the event of July 10 (7:23pm VET)...')

  // Query from 6:30pm (22:30 UTC) to 8:00pm (00:00 UTC July 11)
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T22:30:00Z'
      AND time <= '2026-07-11T00:00:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)

  for await (const row of stream) {
    rows.push(row)
  }

  // Pre-cargar datos del historial para simular el estado hidratado
  const preQuery = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T21:30:00Z'
      AND time < '2026-07-10T22:30:00Z'
    ORDER BY time ASC
  `
  const preRows: any[] = []
  const preStream = influxClient.query(preQuery)

  for await (const row of preStream) {
    preRows.push(row)
  }

  // Hydrate batches
  const BATCH_MS = 10 * 60 * 1000
  const bins: { [binStartMs: number]: { temp: number[]; hum: number[]; lux: number[] } } = {}

  for (const row of preRows) {
    const tMs = rowTimeToDate(row.time).getTime()
    const binStartMs = Math.floor(tMs / BATCH_MS) * BATCH_MS

    if (!bins[binStartMs]) bins[binStartMs] = { temp: [], hum: [], lux: [] }
    if (row.temperature != null) bins[binStartMs].temp.push(Number(row.temperature))
    if (row.humidity != null) bins[binStartMs].hum.push(Number(row.humidity))
    if (row.illuminance != null) bins[binStartMs].lux.push(Number(row.illuminance))
  }

  const sortedBins = Object.keys(bins)
    .map(Number)
    .sort((a, b) => b - a)

  for (const binStartMs of sortedBins) {
    const b = bins[binStartMs]

    if (b.temp.length > 0) pushBatchMetrics(tempBatches, b.temp, binStartMs)
    if (b.hum.length > 0) pushBatchMetrics(humBatches, b.hum, binStartMs)
    if (b.lux.length > 0) pushBatchMetrics(luxBatches, b.lux, binStartMs, true)
  }

  console.log(
    `State hydrated. tempBatches: ${tempBatches.length}, humBatches: ${humBatches.length}, luxBatches: ${luxBatches.length}`,
  )

  // Ahora simulamos la llegada de los mensajes MQTT de las 7:23 PM (23:23 UTC)
  // Agrupamos las lecturas reales de InfluxDB en ventanas de 10 min
  let currentStartMs = 0
  let tempValues: number[] = []
  let humValues: number[] = []
  let luxValues: number[] = []

  for (const row of rows) {
    const tMs = rowTimeToDate(row.time).getTime()

    if (currentStartMs === 0) currentStartMs = tMs

    if (tMs - currentStartMs >= BATCH_MS) {
      const localTime = new Date(currentStartMs).toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        hour: '2-digit',
        minute: '2-digit',
      })

      console.log(`\n--- Simulación de llegada de MQTT a las ${localTime} ---`)

      // En el live scheduler, llegan 3 mensajes MQTT separados:

      // 1. Llega lote de temperatura
      console.log(`[MQTT] Recibido batch de temperatura (${tempValues.length} muestras)`)
      pushBatchMetrics(tempBatches, tempValues, currentStartMs)
      let trig = evaluateClimateInference(currentStartMs)

      console.log(`  -> Evaluación 1 (sólo Temp actualizada): Trigger = ${trig ? 'SÍ' : 'NO'}`)
      console.log(
        `     tempBatches[0] timestamp: ${new Date(tempBatches[0].timestamp).toLocaleTimeString()}`,
      )
      console.log(
        `     humBatches[0] timestamp: ${new Date(humBatches[0].timestamp).toLocaleTimeString()}`,
      )

      // 2. Llega lote de humedad (10ms después)
      console.log(`[MQTT] Recibido batch de humedad (${humValues.length} muestras)`)
      pushBatchMetrics(humBatches, humValues, currentStartMs)
      trig = evaluateClimateInference(currentStartMs)
      console.log(`  -> Evaluación 2 (Temp + Hum actualizadas): Trigger = ${trig ? 'SÍ' : 'NO'}`)

      // 3. Llega lote de lux (20ms después)
      console.log(`[MQTT] Recibido batch de lux (${luxValues.length} muestras)`)
      pushBatchMetrics(luxBatches, luxValues, currentStartMs, true)
      trig = evaluateClimateInference(currentStartMs)
      console.log(
        `  -> Evaluación 3 (Temp + Hum + Lux actualizadas): Trigger = ${trig ? 'SÍ' : 'NO'}`,
      )

      if (trig) {
        console.log(`🎉 ¡EVENTO DETECTADO CORRECTAMENTE EN LA EVALUACIÓN 3!`)
        break
      }

      tempValues = []
      humValues = []
      luxValues = []
      currentStartMs = tMs
    }

    if (row.temperature != null) tempValues.push(Number(row.temperature))
    if (row.humidity != null) humValues.push(Number(row.humidity))
    if (row.illuminance != null) luxValues.push(Number(row.illuminance))
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })

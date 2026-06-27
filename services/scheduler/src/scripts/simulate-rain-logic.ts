import { influxClient } from '../lib/influx'

interface BatchSummary {
  min: number
  max: number
  timestamp: number
}

async function main() {
  const dateStr = process.argv[2] || '2026-06-26'

  // 12:00 AM del día local de Caracas es 04:00 AM UTC del mismo día
  const startTime = `${dateStr}T04:00:00Z`

  // Calcular el final del día local (11:59:59 PM de Caracas es 03:59:59 AM UTC del día siguiente)
  const parts = dateStr.split('-').map(Number)
  const localDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  const nextLocalDate = new Date(localDate.getTime() + 24 * 3600 * 1000)
  const nextDayStr = nextLocalDate.toISOString().split('T')[0]
  const endTime = `${nextDayStr}T03:59:59Z`

  console.log(`=== SIMULANDO DÍA LOCAL DE CARACAS: ${dateStr} ===`)
  console.log(`Rango UTC Consulta: Desde ${startTime} hasta ${endTime}`)

  const query = `
    SELECT 
      date_bin(interval '10 minutes', time) as time_bin,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp,
      MIN(humidity) as min_hum,
      MAX(humidity) as max_hum,
      MIN(illuminance) as min_lux,
      MAX(illuminance) as max_lux
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime}'
      AND time <= '${endTime}'
    GROUP BY time_bin
    ORDER BY time_bin ASC
  `

  try {
    const stream = influxClient.query(query)
    const rows: Record<string, unknown>[] = []

    for await (const row of stream) {
      rows.push(row as Record<string, unknown>)
    }

    const tempBatches: BatchSummary[] = []
    const humBatches: BatchSummary[] = []
    const luxBatches: BatchSummary[] = []

    console.log(`\n--- DETALLE DE CALMA PREVIA Y DETECCIONES (6:00 PM a 11:59 PM local) ---`)

    for (const row of rows) {
      const timeBin = new Date(row.time_bin)
      const minTemp = Number(row.min_temp)
      const maxTemp = Number(row.max_temp)
      const minHum = Number(row.min_hum)
      const maxHum = Number(row.max_hum)
      const minLux = Number(row.min_lux)
      const maxLux = Number(row.max_lux)

      if (isNaN(minTemp) || isNaN(minHum)) continue

      const timestampMs = timeBin.getTime()

      tempBatches.unshift({ min: minTemp, max: maxTemp, timestamp: timestampMs })
      if (tempBatches.length > 6) tempBatches.pop()

      humBatches.unshift({ min: minHum, max: maxHum, timestamp: timestampMs })
      if (humBatches.length > 6) humBatches.pop()

      luxBatches.unshift({ min: minLux, max: maxLux, timestamp: timestampMs })
      if (luxBatches.length > 6) luxBatches.pop()

      if (tempBatches.length < 4 || humBatches.length < 4) continue

      const caracasHour = (timeBin.getUTCHours() - 4 + 24) % 24
      const timeStr = timeBin.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })

      // Solo mostrar desde las 6:00 PM (18:00) hasta las 11:59 PM (23:59) del día local
      const isNightEval = caracasHour >= 18 && caracasHour <= 23

      if (isNightEval) {
        // 1. Ruido de referencia natural de los 3 lotes anteriores (B1, B2, B3)
        const varTemp1 = tempBatches[1].max - tempBatches[1].min
        const varTemp2 = tempBatches[2].max - tempBatches[2].min
        const varTemp3 = tempBatches[3].max - tempBatches[3].min
        const refVarTemp = Math.max(varTemp1, varTemp2, varTemp3, 0.15)

        const varHum1 = humBatches[1].max - humBatches[1].min
        const varHum2 = humBatches[2].max - humBatches[2].min
        const varHum3 = humBatches[3].max - humBatches[3].min
        const refVarHum = Math.max(varHum1, varHum2, varHum3, 0.5)

        // 2. Estabilidad de calma previa
        const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPreAll = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPreAll - minTempPreAll

        const maxHumPreAll = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const varHumPre = maxHumPreAll - minHumPreAll

        // 3. Deltas de choque en B0
        const currentMinTemp = tempBatches[0].min
        const currentMaxHum = humBatches[0].max

        const currentTempDrop = maxTempPreAll - currentMinTemp
        const currentHumRise = currentMaxHum - minHumPreAll

        // --- FORMULACIÓN A (De ayer, fallida) ---
        const isTempDropAbruptA = currentTempDrop >= refVarTemp * 2.5
        const isHumRiseAbruptA = currentHumRise >= refVarHum * 2.0
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0
        const triggerA =
          varTempPre <= 0.6 && isTempDropAbruptA && (isHumRiseAbruptA || isPreSaturated)

        // --- FORMULACIÓN B (Comparación contra variación acumulada previa) ---
        const tempDropThresholdB = Math.max(0.4, varTempPre * 2.0)
        const humRiseThresholdB = Math.max(1.5, varHumPre * 1.8)

        const isTempDropAbruptB = currentTempDrop >= tempDropThresholdB
        const isHumRiseAbruptB = currentHumRise >= humRiseThresholdB
        const triggerB =
          varTempPre <= 0.6 && isTempDropAbruptB && (isHumRiseAbruptB || isPreSaturated)

        console.log(
          `Hora Local: ${timeStr} | ` +
            `Temp=[${minTemp.toFixed(1)}-${maxTemp.toFixed(1)}] Hum=[${minHum.toFixed(1)}-${maxHum.toFixed(1)}] | ` +
            `vTPre=${varTempPre.toFixed(2)} dT=${currentTempDrop.toFixed(2)} | ` +
            `A=${triggerA ? '🌧️ SI' : '☀️ NO'} | ` +
            `B=${triggerB ? '🌧️ SI' : '☀️ NO'} (ThT=${tempDropThresholdB.toFixed(2)}, ThH=${humRiseThresholdB.toFixed(1)})`,
        )
      }
    }
  } catch (err) {
    console.error('Error running detailed simulation:', err)
  }
}

main()

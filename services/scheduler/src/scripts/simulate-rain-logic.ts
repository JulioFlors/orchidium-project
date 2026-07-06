import { influxClient } from '../lib/influx'

interface BatchSummary {
  min: number
  max: number
  timestamp: number
}

async function main() {
  const dateStr = process.argv[2] || '2026-06-27'
  const algoMode = (process.argv[3] || 'FORMULA_B').toUpperCase()

  // Rango UTC para el día local de Caracas (UTC-4)
  const startTime = `${dateStr}T04:00:00Z`
  const parts = dateStr.split('-').map(Number)
  const localDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  const nextLocalDate = new Date(localDate.getTime() + 24 * 3600 * 1000)
  const nextDayStr = nextLocalDate.toISOString().split('T')[0]
  const endTime = `${nextDayStr}T03:59:59Z`

  console.log(`=== SIMULANDO MODO: ${algoMode} ===`)
  console.log(`Día local de Caracas: ${dateStr}`)
  console.log(`Rango UTC: Desde ${startTime} hasta ${endTime}`)

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
    const rows: any[] = []

    for await (const row of stream) {
      rows.push(row)
    }

    console.log(`Total bins recuperados: ${rows.length}`)

    let inferedRainActive = false
    let inferedRainStartedAt: number | null = null
    let inferedBaselineTemp: number | null = null
    let inferedBaselineHum: number | null = null
    let inferedBaselineLux: number | null = null
    let minLuxInRain: number | null = null
    let minTempInRain: number | null = null
    let maxHumInRain: number | null = null
    let lastInferedRainClosedAt: number | null = null

    // Colas deslizantes
    const tempBatches: BatchSummary[] = []
    const humBatches: BatchSummary[] = []
    const luxBatches: BatchSummary[] = []

    for (const row of rows) {
      const timeBin = new Date(row.time_bin)
      const minTemp = Number(row.min_temp)
      const maxTemp = Number(row.max_temp)
      const minHum = Number(row.min_hum)
      const maxHum = Number(row.max_hum)
      const minLux = Number(row.min_lux)
      const maxLux = Number(row.max_lux)

      if (isNaN(minTemp) || isNaN(minHum) || isNaN(minLux)) continue

      const timestampMs = timeBin.getTime()

      // Empujar a las colas deslizantes
      tempBatches.unshift({ min: minTemp, max: maxTemp, timestamp: timestampMs })
      if (tempBatches.length > 6) tempBatches.pop()

      humBatches.unshift({ min: minHum, max: maxHum, timestamp: timestampMs })
      if (humBatches.length > 6) humBatches.pop()

      luxBatches.unshift({ min: minLux, max: maxLux, timestamp: timestampMs })
      if (luxBatches.length > 6) luxBatches.pop()

      if (tempBatches.length < 4 || humBatches.length < 4 || luxBatches.length < 4) continue

      const caracasHour = (timeBin.getUTCHours() - 4 + 24) % 24
      const timeStr = timeBin.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })
      const isDay = caracasHour >= 8 && caracasHour < 16

      const currentMinTemp = tempBatches[0].min
      const currentMaxHum = humBatches[0].max
      const currentMinLux = luxBatches[0].min
      const currentMaxLux = luxBatches[0].max

      if (!inferedRainActive) {
        // Cooldown de 15 minutos tras el cese
        if (
          lastInferedRainClosedAt !== null &&
          timestampMs - lastInferedRainClosedAt < 15 * 60 * 1000
        ) {
          continue
        }

        let triggered = false
        let triggerReason = ''

        if (isDay) {
          // --- INFERENCIA DIURNA ---
          const baseTemp1 = tempBatches[1].max
          const baseHum1 = humBatches[1].min
          const baseLux1 = luxBatches[1].max
          const dTemp1 = currentMinTemp - baseTemp1
          const dHum1 = currentMaxHum - baseHum1

          let luxCondition = true
          let tempDropThreshold = -3.0
          let humRiseThreshold = 10.0

          if (baseLux1 <= 10000) {
            luxCondition = true
            tempDropThreshold = -1.2
            humRiseThreshold = 4.0
          } else {
            luxCondition = currentMinLux < baseLux1 * 0.4
          }

          const humCondition =
            dHum1 >= humRiseThreshold ||
            (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
            triggered = true
            triggerReason = `Día 20m (baseLux=${baseLux1.toFixed(0)}lx, dT=${dTemp1.toFixed(1)}°C, dH=+${dHum1.toFixed(1)}%)`
          }

          if (!triggered) {
            const baseTemp2 = tempBatches[2].max
            const baseHum2 = humBatches[2].min
            const baseLux2 = luxBatches[2].max
            const dTemp2 = currentMinTemp - baseTemp2
            const dHum2 = currentMaxHum - baseHum2

            let luxCondition2 = true
            let tempDropThreshold2 = -3.0
            let humRiseThreshold2 = 12.0

            if (baseLux2 <= 10000) {
              luxCondition2 = true
              tempDropThreshold2 = -1.2
              humRiseThreshold2 = 4.0
            } else {
              luxCondition2 = currentMinLux < baseLux2 * 0.4
            }

            const humCondition2 =
              dHum2 >= humRiseThreshold2 ||
              (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

            if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
              triggered = true
              triggerReason = `Día 30m (baseLux=${baseLux2.toFixed(0)}lx, dT=${dTemp2.toFixed(1)}°C, dH=+${dHum2.toFixed(1)}%)`
            }
          }
        } else {
          // --- EVALUACIÓN NOCTURNA SEGÚN MODO ---

          if (algoMode === 'FORMULA_B' || algoMode === 'GARUA_EXTENSION') {
            // Propuestas A y D: Fórmula B de Choque Adaptativa
            const maxTempPreAll = Math.max(
              tempBatches[1].max,
              tempBatches[2].max,
              tempBatches[3].max,
            )
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
            const varTempPre =
              maxTempPreAll - Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
            const varHumPre =
              Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max) - minHumPreAll

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            const tempDropThreshold = Math.max(0.4, varTempPre * 2.0)
            const humRiseThreshold = Math.max(1.5, varHumPre * 1.8)

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
              triggered = true
              triggerReason = `Fórmula B Nocturna (vTPre=${varTempPre.toFixed(2)}°C, dT=${currentTempDrop.toFixed(2)}°C, dH=+${currentHumRise.toFixed(1)}%)`
            }
          } else if (algoMode === 'FORMULA_A_REFINED') {
            const varTemp1 = tempBatches[1].max - tempBatches[1].min
            const varTemp2 = tempBatches[2].max - tempBatches[2].min
            const varTemp3 = tempBatches[3].max - tempBatches[3].min
            const refVarTemp = Math.max(varTemp1, varTemp2, varTemp3, 0.15)

            const varHum1 = humBatches[1].max - humBatches[1].min
            const varHum2 = humBatches[2].max - humBatches[2].min
            const varHum3 = humBatches[3].max - humBatches[3].min
            const refVarHum = Math.max(varHum1, varHum2, varHum3, 0.5)

            const maxTempPreAll = Math.max(
              tempBatches[1].max,
              tempBatches[2].max,
              tempBatches[3].max,
            )
            const minTempPreAll = Math.min(
              tempBatches[1].min,
              tempBatches[2].min,
              tempBatches[3].min,
            )
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            const tempDropThreshold = Math.max(0.4, refVarTemp * 2.5)
            const humRiseThreshold = Math.max(1.5, refVarHum * 2.0)

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            const preTempDrop = maxTempPreAll - minTempPreAll
            const isAccelerating = currentTempDrop >= preTempDrop * 1.6

            if (
              minTempPreAll - maxTempPreAll <= 0.6 &&
              isTempDropAbrupt &&
              (isHumRiseAbrupt || isPreSaturated) &&
              isAccelerating
            ) {
              triggered = true
              triggerReason = `Fórmula A Refinada (refVarT=${refVarTemp.toFixed(2)}°C, dT=${currentTempDrop.toFixed(2)}°C, dH=+${currentHumRise.toFixed(1)}%, acel=SI)`
            }
          } else if (algoMode === 'GARUA_PERSISTENT') {
            const maxTempPreAll = Math.max(
              tempBatches[1].max,
              tempBatches[2].max,
              tempBatches[3].max,
            )
            const minTempPreAll = Math.min(
              tempBatches[1].min,
              tempBatches[2].min,
              tempBatches[3].min,
            )
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
            const maxHumPreAll = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
            const varTempPre = maxTempPreAll - minTempPreAll
            const varHumPre = maxHumPreAll - minHumPreAll

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            const tempDropThreshold = Math.max(0.4, varTempPre * 2.0)
            const humRiseThreshold = Math.max(1.5, varHumPre * 1.8)

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
              triggered = true
              triggerReason = `Fórmula B (Choque) (vTPre=${varTempPre.toFixed(2)}°C, dT=${currentTempDrop.toFixed(2)}°C)`
            }

            if (!triggered) {
              const isPreExtremelySaturated = minHumPreAll >= 96.0
              const isTempPlat = varTempPre <= 0.3
              const isDark = currentMinLux <= 500
              const isCurrentSaturated = currentMaxHum >= 97.0

              if (isPreExtremelySaturated && isTempPlat && isDark && isCurrentSaturated) {
                triggered = true
                triggerReason = `Garúa Persistente (Estancamiento Húmedo: HumPreMin=${minHumPreAll.toFixed(1)}%, varTPre=${varTempPre.toFixed(2)}°C)`
              }
            }
          }
        }

        if (triggered) {
          inferedRainActive = true
          inferedRainStartedAt = timestampMs
          inferedBaselineTemp = tempBatches[0].max
          inferedBaselineHum = humBatches[0].min
          inferedBaselineLux = luxBatches[0].max
          minLuxInRain = currentMinLux
          minTempInRain = currentMinTemp
          maxHumInRain = currentMaxHum

          console.log(
            `🌧️ [INICIO LLUVIA INFERIDA] A las ${timeStr} | Motivo: ${triggerReason} | Clima: ${minTemp.toFixed(1)}°C / ${maxHum.toFixed(1)}% HR / ${minLux.toFixed(0)} lx`,
          )
        }
      } else {
        // --- EVALUACIÓN DE CESE ---
        const durationMin = (timestampMs - (inferedRainStartedAt || 0)) / 60000
        let closed = false
        let closeReason = ''

        if (durationMin >= 15) {
          const diffHum = humBatches[0].max - humBatches[0].min
          const diffTemp = tempBatches[0].max - tempBatches[0].min
          const tempCeseThreshold = 0.4
          const humCeseThreshold = 1.0

          let isVetoed = false

          if (algoMode === 'GARUA_EXTENSION') {
            // Veto de cese: No cerrar si sigue extremadamente húmedo y sin sol (garúa persistente)
            const isExtremelySaturated = currentMaxHum >= 96.0
            const isDark = currentMinLux <= 500

            if (isExtremelySaturated && isDark) {
              isVetoed = true
            }
          }

          if (diffHum <= humCeseThreshold && diffTemp <= tempCeseThreshold && !isVetoed) {
            closed = true
            closeReason = `STAGNANT (dT=${diffTemp.toFixed(1)}°C <= ${tempCeseThreshold}, dH=${diffHum.toFixed(1)}% <= ${humCeseThreshold})`
          }
        }

        if (!closed && isDay) {
          if (
            inferedBaselineTemp !== null &&
            inferedBaselineHum !== null &&
            minTempInRain !== null &&
            maxHumInRain !== null
          ) {
            const currentTemp = tempBatches[0].max
            const currentHum = humBatches[0].min
            const tempDrop = inferedBaselineTemp - minTempInRain
            const humRise = maxHumInRain - inferedBaselineHum

            const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
            const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

            if (currentTemp >= tempThreshold && currentHum <= humThreshold) {
              closed = true
              closeReason = `BASELINE_RECOVERY (Temp=${currentTemp.toFixed(1)}°C >= ${tempThreshold.toFixed(1)}, Hum=${currentHum.toFixed(1)}% <= ${humThreshold.toFixed(1)})`
            }
          }

          if (!closed && inferedBaselineLux !== null && minLuxInRain !== null) {
            const preLux = inferedBaselineLux
            const minLux = minLuxInRain
            const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
            const alpha = 1.0 - 0.65 * relativeDrop
            const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

            const lastTempDrop = tempBatches[1].max - tempBatches[0].max
            const isTempStableOrRising = lastTempDrop >= -0.2

            if (currentMaxLux >= luxRecoveryThreshold && isTempStableOrRising) {
              closed = true
              closeReason = `SOLAR_RECOVERY (Lux=${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)}, temp estable)`
            }
          }
        }

        minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
        minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
        maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

        if (closed) {
          inferedRainActive = false
          lastInferedRainClosedAt = timestampMs
          console.log(
            `☀️ [CESE LLUVIA INFERIDA] A las ${timeStr} | Motivo: ${closeReason} | Duración: ${durationMin.toFixed(0)} min`,
          )
        }
      }
    }
  } catch (err) {
    console.error('Error running simulation:', err)
  }
}

main()

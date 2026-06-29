import * as fs from 'fs'
import * as path from 'path'
import { influxClient } from '../lib/influx'

interface BatchSummary {
  min: number
  max: number
  timestamp: number
}

interface RainEvent {
  start: string
  end: string
  duration: number
  reason: string
}

const DAYS = ['2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28']
const ALGOS = ['FORMULA_B', 'FORMULA_B_SENSITIVE', 'FORMULA_A_REFINED']

async function runSim(dateStr: string, algoMode: string): Promise<RainEvent[]> {
  const startTime = `${dateStr}T04:00:00Z`
  const parts = dateStr.split('-').map(Number)
  const localDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  const nextLocalDate = new Date(localDate.getTime() + 24 * 3600 * 1000)
  const nextDayStr = nextLocalDate.toISOString().split('T')[0]
  const endTime = `${nextDayStr}T03:59:59Z`

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

  const events: RainEvent[] = []
  
  try {
    const stream = influxClient.query(query)
    const rows: any[] = []
    for await (const row of stream) {
      rows.push(row)
    }

    let inferedRainActive = false
    let inferedRainStartedAt: number | null = null
    let inferedBaselineTemp: number | null = null
    let inferedBaselineHum: number | null = null
    let inferedBaselineLux: number | null = null
    let minLuxInRain: number | null = null
    let minTempInRain: number | null = null
    let maxHumInRain: number | null = null
    let lastInferedRainClosedAt: number | null = null
    let activeTriggerReason = ''

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

      tempBatches.unshift({ min: minTemp, max: maxTemp, timestamp: timestampMs })
      if (tempBatches.length > 6) tempBatches.pop()

      humBatches.unshift({ min: minHum, max: maxHum, timestamp: timestampMs })
      if (humBatches.length > 6) humBatches.pop()

      luxBatches.unshift({ min: minLux, max: maxLux, timestamp: timestampMs })
      if (luxBatches.length > 6) luxBatches.pop()

      if (tempBatches.length < 4 || humBatches.length < 4 || luxBatches.length < 4) continue

      const caracasHour = (timeBin.getUTCHours() - 4 + 24) % 24
      const timeStr = timeBin.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit' })
      const isDay = caracasHour >= 8 && caracasHour < 16

      const currentMinTemp = tempBatches[0].min
      const currentMaxHum = humBatches[0].max
      const currentMinLux = luxBatches[0].min
      const currentMaxLux = luxBatches[0].max

      if (!inferedRainActive) {
        if (lastInferedRainClosedAt !== null && timestampMs - lastInferedRainClosedAt < 15 * 60 * 1000) {
          continue
        }

        let triggered = false
        let triggerReason = ''

        if (isDay) {
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
            dHum1 >= humRiseThreshold || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
            triggered = true
            triggerReason = `Día 20m`
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
              dHum2 >= humRiseThreshold2 || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

            if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
              triggered = true
              triggerReason = `Día 30m`
            }
          }
        } else {
          // --- NOCHE ---
          if (algoMode === 'FORMULA_B') {
            // Baseline Original
            const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
            const varTempPre = maxTempPreAll - Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
            const varHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max) - minHumPreAll

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            const tempDropThreshold = Math.max(0.4, varTempPre * 2.0)
            const humRiseThreshold = Math.max(1.5, varHumPre * 1.8)

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
              triggered = true
              triggerReason = `Fórmula B`
            }
          } 
          
          else if (algoMode === 'FORMULA_B_SENSITIVE') {
            // Calibración Fina Sensibilizada con Bloqueo de Rocío Nocturno
            const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
            const varTempPre = maxTempPreAll - Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
            const varHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max) - minHumPreAll

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            // Bloqueo de Rocío: Si la calma previa ya venía muy saturada (>= 98.0%), elevamos el piso térmico a 0.50°C
            const tempFloor = minHumPreAll >= 98.0 ? 0.50 : 0.35

            const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8)
            const humRiseThreshold = Math.max(1.5, varHumPre * 1.6)

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
              triggered = true
              triggerReason = `Fórmula B Calibrada`
            }
          }
          
          else if (algoMode === 'FORMULA_A_REFINED') {
            // Fórmula A Refinada Calibrada con bloqueo de calma y aceleración
            const varTemp1 = tempBatches[1].max - tempBatches[1].min
            const varTemp2 = tempBatches[2].max - tempBatches[2].min
            const varTemp3 = tempBatches[3].max - tempBatches[3].min
            const refVarTemp = Math.max(varTemp1, varTemp2, varTemp3, 0.20)

            const varHum1 = humBatches[1].max - humBatches[1].min
            const varHum2 = humBatches[2].max - humBatches[2].min
            const varHum3 = humBatches[3].max - humBatches[3].min
            const refVarHum = Math.max(varHum1, varHum2, varHum3, 1.0)

            const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
            const minTempPreAll = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
            const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
            const varTempPre = maxTempPreAll - minTempPreAll

            const currentTempDrop = maxTempPreAll - currentMinTemp
            const currentHumRise = currentMaxHum - minHumPreAll

            // Calibramos para reducir sensibilidad de la Fórmula A
            const tempDropThreshold = Math.max(0.4, refVarTemp * 2.8) // Rebajado de 3.0 a 2.8
            const humRiseThreshold = Math.max(1.5, refVarHum * 2.2) // Rebajado de 2.5 a 2.2

            const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
            const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
            const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

            const preTempDrop = maxTempPreAll - minTempPreAll
            const isAccelerating = currentTempDrop >= preTempDrop * 1.8 // Ajustado de 2.0 a 1.8

            if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated) && isAccelerating) {
              triggered = true
              triggerReason = `A Refinada Calibrada`
            }
          }
        }

        if (triggered) {
          inferedRainActive = true
          inferedRainStartedAt = timestampMs
          activeTriggerReason = triggerReason
          inferedBaselineTemp = tempBatches[0].max
          inferedBaselineHum = humBatches[0].min
          inferedBaselineLux = luxBatches[0].max
          minLuxInRain = currentMinLux
          minTempInRain = currentMinTemp
          maxHumInRain = currentMaxHum
        }
      } else {
        const durationMin = (timestampMs - (inferedRainStartedAt || 0)) / 60000
        let closed = false
        let closeReason = ''

        if (durationMin >= 15) {
          const diffHum = humBatches[0].max - humBatches[0].min
          const diffTemp = tempBatches[0].max - tempBatches[0].min
          const tempCeseThreshold = 0.4
          const humCeseThreshold = 1.0

          if (diffHum <= humCeseThreshold && diffTemp <= tempCeseThreshold) {
            closed = true
            closeReason = `STAGNANT`
          }
        }

        if (!closed && isDay) {
          if (inferedBaselineTemp !== null && inferedBaselineHum !== null && minTempInRain !== null && maxHumInRain !== null) {
            const currentTemp = tempBatches[0].max
            const currentHum = humBatches[0].min
            const tempDrop = inferedBaselineTemp - minTempInRain
            const humRise = maxHumInRain - inferedBaselineHum

            const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
            const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

            if (currentTemp >= tempThreshold && currentHum <= humThreshold) {
              closed = true
              closeReason = `BASELINE_RECOVERY`
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
              closeReason = `SOLAR_RECOVERY`
            }
          }
        }

        minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
        minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
        maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

        if (closed) {
          inferedRainActive = false
          lastInferedRainClosedAt = timestampMs
          const startStr = new Date(inferedRainStartedAt || 0).toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit' })
          
          events.push({
            start: startStr,
            end: timeStr,
            duration: Math.round(durationMin),
            reason: activeTriggerReason + ' -> ' + closeReason
          })
          
          inferedRainStartedAt = null
        }
      }
    }
  } catch (err) {
    console.error(err)
  }

  return events
}

async function runMatrix() {
  console.log('Iniciando matriz de calibración fina (24 al 28 de Junio)...')
  
  const results: Record<string, Record<string, RainEvent[]>> = {}

  for (const date of DAYS) {
    results[date] = {}
    for (const algo of ALGOS) {
      results[date][algo] = await runSim(date, algo)
    }
  }

  // Generar reporte en Markdown
  let md = `# Reporte de Calibración Fina: Matriz de Simulación de Inferencia de Lluvia\n\n`
  md += `Este reporte presenta la comparación del algoritmo base (**FORMULA_B**) contra las dos variantes calibradas para buscar el punto óptimo de **cero falsos positivos** y máxima sensibilidad ante lloviznas.\n\n`

  md += `## 1. Tabla Comparativa de Eventos Detectados\n\n`
  md += `| Fecha | FORMULA_B (Base actual) | FORMULA_B_SENSITIVE (Ajustada) | FORMULA_A_REFINED (Robustecida) |\n`
  md += `| :--- | :--- | :--- | :--- |\n`

  for (const date of DAYS) {
    md += `| **${date}** `
    for (const algo of ALGOS) {
      const evs = results[date][algo]
      if (evs.length === 0) {
        md += `| *Ninguno* `
      } else {
        const summaries = evs.map(e => `🌧️ **${e.start}-${e.end}** (${e.duration} min)`).join('<br>')
        md += `| ${summaries} `
      }
    }
    md += `|\n`
  }

  md += `\n---\n\n## 2. Parámetros de Calibración Aplicados\n\n`

  md += `### ⚙️ FORMULA_B (Base actual)\n`
  md += `* Multiplicador térmico: \`2.0\`\n`
  md += `* Multiplicador hídrico: \`1.8\`\n`
  md += `* Pisos mínimos: \`0.4°C / 1.5%\`\n`
  md += `* Calma previa máxima: \`varTempPre <= 0.6°C\`\n\n`

  md += `### ⚙️ FORMULA_B_SENSITIVE (Ajuste Fino Calibrado con Filtro de Rocío)\n`
  md += `* Multiplicador térmico: \`1.8\` (Sensibilizado)\n`
  md += `* Multiplicador hídrico: \`1.6\` (Sensibilizado)\n`
  md += `* Pisos mínimos: \`0.35°C / 1.5%\` (Elevado si hay rocío previo de madrugada para evitar falsas alarmas)\n`
  md += `* Calma previa máxima: \`varTempPre <= 0.6°C\`\n\n`

  md += `### 🧪 FORMULA_A_REFINED (Fórmula A Robustecida Calibrada)\n`
  md += `* Multiplicador térmico: \`2.8\`\n`
  md += `* Multiplicador hídrico: \`2.2\`\n`
  md += `* Pisos mínimos de ruido: \`0.20°C / 1.0%\`\n`
  md += `* Aceleración térmica mínima: \`1.8x\`\n`
  md += `* Calma previa máxima: \`varTempPre <= 0.6°C\`\n`

  const reportPath = path.join('C:', 'Users', 'Julio', '.gemini', 'antigravity', 'brain', 'b1d5745b-10a2-4a52-9a21-f76d66498382', 'reporte_matriz_lluvia.md')
  
  // Asegurar que la carpeta exista
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, md, 'utf-8')
  
  console.log(`\n🎉 Matriz de calibración completada!`)
  console.log(`Reporte guardado en: file:///${reportPath.replace(/\\/g, '/')}`)
  console.log(`\n=== TABLA COMPARATIVA ===\n`)
  console.log(md)
}

runMatrix()

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

// Helper para convertir timestamps de InfluxDB a milisegundos
function rowTimeToMs(rawTime: unknown): number {
  if (rawTime instanceof Date) return rawTime.getTime()
  const s = String(rawTime)

  return s.length > 13 ? Number(s.substring(0, 13)) : Number(s)
}

async function main() {
  Logger.info('Iniciando script de análisis histórico de iluminancia...')

  // Analizaremos los últimos 60 días
  const DIAS_ANALISIS = 60
  const ahora = new Date()

  console.log(`Fecha actual de ejecución: ${ahora.toString()}`)
  console.log(`Analizando los últimos ${DIAS_ANALISIS} días (8:00 AM - 4:00 PM Caracas time)...`)
  console.log('--------------------------------------------------------------------------------')
  console.log(
    '| Fecha      | N.Lecturas | Prom.Real (Caracas) | Prom.Incorrecto (UTC Shift) | Ventana 60m <=10k? | Ventana 60m <=26k? | Cumple Ambos? |',
  )
  console.log('--------------------------------------------------------------------------------')

  let diasTotalesConLecturas = 0
  let diasCumplenCriterioA2 = 0 // Ventana 60m <= 10k
  let diasCumplenCriterioAmbos = 0 // Ventana 60m <= 10k y Promedio 8am-4pm <= 15k

  try {
    for (let offset = DIAS_ANALISIS; offset >= 1; offset--) {
      const fechaBase = new Date(ahora)

      fechaBase.setDate(fechaBase.getDate() - offset)

      // Definir ventana de Caracas (8:00 AM a 4:00 PM)
      // Caracas es UTC-4, por lo que:
      // 8:00 AM Caracas = 12:00 PM UTC (12:00)
      // 4:00 PM Caracas = 8:00 PM UTC (20:00)
      const inicioCaracas = new Date(fechaBase)

      inicioCaracas.setUTCHours(12, 0, 0, 0)
      const finCaracas = new Date(fechaBase)

      finCaracas.setUTCHours(20, 0, 0, 0)

      // Definir la ventana incorrecta si el servidor asume su hora local como UTC (8:00 AM UTC a 4:00 PM UTC)
      // 8:00 AM UTC = 4:00 AM Caracas
      // 4:00 PM UTC = 12:00 PM Caracas
      const inicioIncorrecto = new Date(fechaBase)

      inicioIncorrecto.setUTCHours(8, 0, 0, 0)
      const finIncorrecto = new Date(fechaBase)

      finIncorrecto.setUTCHours(16, 0, 0, 0)

      // Consulta de iluminancia para la ventana real de Caracas
      const queryReal = `
        SELECT illuminance, time
        FROM "environment_metrics"
        WHERE time >= '${inicioCaracas.toISOString()}' AND time <= '${finCaracas.toISOString()}'
        AND source = 'Weather_Station'
        ORDER BY time ASC
      `

      // Consulta de promedio para la ventana incorrecta
      const queryIncorrecto = `
        SELECT AVG(illuminance) as avg_lux
        FROM "environment_metrics"
        WHERE time >= '${inicioIncorrecto.toISOString()}' AND time <= '${finIncorrecto.toISOString()}'
        AND source = 'Weather_Station'
      `

      // 1. Obtener lecturas reales de Caracas
      const streamReal = influxClient.query(queryReal)
      const lecturas: { t: number; lux: number }[] = []
      let sumaReal = 0

      for await (const row of streamReal) {
        const lux = Number(row.illuminance || 0)
        const t = rowTimeToMs(row.time)

        if (!isNaN(t)) {
          lecturas.push({ t, lux })
          sumaReal += lux
        }
      }

      const totalLecturas = lecturas.length

      if (totalLecturas < 100) {
        // Ignorar días sin suficientes datos para evitar falsos análisis
        continue
      }

      diasTotalesConLecturas++
      const promReal = sumaReal / totalLecturas

      // 2. Obtener promedio incorrecto (UTC Shift)
      const streamIncorrecto = influxClient.query(queryIncorrecto)
      let promIncorrecto = 0

      for await (const row of streamIncorrecto) {
        if (row.avg_lux != null) promIncorrecto = Number(row.avg_lux)
      }

      // 3. Evaluar ventana deslizante de 60 minutos con promedio para <= 10k y <= 26k
      const VENTANA_MS = 60 * 60000
      const BRECHA_MAX_MS = 30 * 60000

      let cumple60m10k = false
      let cumple60m26k = false

      // Ventana de 10k
      for (let i = 0; i < lecturas.length; i++) {
        let prev = lecturas[i].t
        let sum = lecturas[i].lux
        let count = 1

        for (let j = i + 1; j < lecturas.length; j++) {
          const gap = lecturas[j].t - prev

          if (gap > BRECHA_MAX_MS) break

          sum += lecturas[j].lux
          count++
          prev = lecturas[j].t

          if (prev - lecturas[i].t >= VENTANA_MS) {
            const avg = sum / count

            if (avg <= 10000) {
              cumple60m10k = true
              break
            }
          }
        }
        if (cumple60m10k) break
      }

      // Ventana de 26k
      for (let i = 0; i < lecturas.length; i++) {
        let prev = lecturas[i].t
        let sum = lecturas[i].lux
        let count = 1

        for (let j = i + 1; j < lecturas.length; j++) {
          const gap = lecturas[j].t - prev

          if (gap > BRECHA_MAX_MS) break

          sum += lecturas[j].lux
          count++
          prev = lecturas[j].t

          if (prev - lecturas[i].t >= VENTANA_MS) {
            const avg = sum / count

            if (avg <= 26000) {
              cumple60m26k = true
              break
            }
          }
        }
        if (cumple60m26k) break
      }

      const cumpleAmbos = cumple60m10k && promReal <= 15000

      if (cumple60m10k) diasCumplenCriterioA2++
      if (cumpleAmbos) diasCumplenCriterioAmbos++

      const fechaStr = fechaBase.toISOString().split('T')[0]

      console.log(
        `| ${fechaStr} | ${String(totalLecturas).padEnd(10)} | ${promReal.toFixed(1).padEnd(19)} | ${promIncorrecto.toFixed(1).padEnd(27)} | ${cumple60m10k ? 'SÍ'.padEnd(18) : 'NO'.padEnd(18)} | ${cumple60m26k ? 'SÍ'.padEnd(18) : 'NO'.padEnd(18)} | ${cumpleAmbos ? 'SÍ' : 'NO'} |`,
      )
    }

    console.log('--------------------------------------------------------------------------------')
    console.log(`Días totales con lecturas suficientes: ${diasTotalesConLecturas}`)
    console.log(
      `Días que cumplieron con ventana 60m <= 10k (Veto Criterio A2): ${diasCumplenCriterioA2}`,
    )
    console.log(
      `Días que cumplieron ambos (Ventana 60m <= 10k y Promedio Real <= 15k): ${diasCumplenCriterioAmbos}`,
    )
    console.log('--------------------------------------------------------------------------------')
  } catch (err) {
    Logger.error('Error durante el análisis:', err)
  } finally {
    await influxClient.close()
  }
}

main()

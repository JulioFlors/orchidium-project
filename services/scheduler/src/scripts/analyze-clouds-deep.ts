import { influxClient } from '../lib/influx'

function rowTimeToMs(rawTime: unknown): number {
  if (rawTime instanceof Date) return rawTime.getTime()
  const s = String(rawTime)

  return s.length > 13 ? Number(s.substring(0, 13)) : Number(s)
}

async function main() {
  console.log('=== INICIANDO ANÁLISIS HISTÓRICO DE DÍAS NUBLADOS Y LLUVIA SOBRE MOJADO ===')
  const DIAS = 30
  const ahora = new Date()

  // Guardaremos resultados para el reporte
  const resultadosEncapotamiento: {
    fecha: string
    luxMin: number
    luxMax: number
    luxAvg: number
    duracionMin: number
  }[] = []
  const casosLluviaSobreMojado: {
    fecha: string
    hora: string
    tempPre: number
    tempPost: number
    humPre: number
    humPost: number
    luxPre: number
    luxPost: number
    deltaT: number
    deltaH: number
    rainInt: number
  }[] = []

  for (let offset = DIAS; offset >= 0; offset--) {
    const fechaBase = new Date(ahora)

    fechaBase.setDate(fechaBase.getDate() - offset)
    const fechaStr = fechaBase.toISOString().split('T')[0]

    // Ventana diurna Caracas: 8:00 AM a 4:00 PM (12:00 UTC a 20:00 UTC)
    const inicioUTC = new Date(fechaBase)

    inicioUTC.setUTCHours(12, 0, 0, 0)
    const finUTC = new Date(fechaBase)

    finUTC.setUTCHours(20, 0, 0, 0)

    const query = `
      SELECT date_bin(interval '5 minutes', time) as bin_time,
             AVG(temperature) as temp,
             AVG(humidity) as hum,
             AVG(illuminance) as lux,
             MAX(rain_intensity) as rain
      FROM "environment_metrics"
      WHERE time >= '${inicioUTC.toISOString()}' AND time <= '${finUTC.toISOString()}'
        AND zone = 'EXTERIOR'
      GROUP BY bin_time
      ORDER BY bin_time ASC
    `

    try {
      const stream = influxClient.query(query)
      const samples: {
        t: number
        temp: number
        hum: number
        lux: number
        rain: number
        timeStr: string
      }[] = []

      for await (const row of stream) {
        const temp = row.temp != null ? Number(row.temp) : null
        const hum = row.hum != null ? Number(row.hum) : null
        const lux = row.lux != null ? Number(row.lux) : null
        const rain = row.rain != null ? Number(row.rain) : 0
        const t = rowTimeToMs(row.bin_time)

        // Si faltan temp o hum o lux en ese bloque de 5 min, usamos un fallback inteligente o extrapolamos
        // Para el análisis requerimos datos completos en el bloque
        if (temp !== null && hum !== null && !isNaN(t)) {
          // Si lux es null (por ejemplo, porque falló el sensor de luz o no reportó en esos 5 min), asumimos 0 o interpolamos
          const finalLux = lux !== null ? lux : 0

          // Convertir hora UTC a hora local Caracas para visualizar mejor
          const dateCaracas = new Date(t)
          const caracasTimeStr = dateCaracas.toLocaleTimeString('es-VE', {
            timeZone: 'America/Caracas',
            hour12: false,
          })

          samples.push({
            t,
            temp,
            hum,
            lux: finalLux,
            rain,
            timeStr: caracasTimeStr,
          })
        }
      }

      if (samples.length < 10) continue // Omitir días con telemetría insuficiente

      // 1. Analizar encapotamiento post-lluvia (Objetivo 1)
      let inRain = false
      for (let i = 0; i < samples.length; i++) {
        if (samples[i].rain > 0 && !inRain) {
          inRain = true
        } else if (inRain && samples[i].rain === 0) {
          inRain = false
          // Analizar la ventana de 1 hora y media posterior (90 minutos)
          const postEndTime = samples[i].t + 90 * 60000
          const postSamples: number[] = []
          let lastIdx = i

          for (let j = i; j < samples.length; j++) {
            if (samples[j].t > postEndTime) break
            if (samples[j].rain > 0) {
              // Volvió a llover, recortar ventana post-lluvia antes del nuevo evento
              break
            }
            postSamples.push(samples[j].lux)
            lastIdx = j
          }

          if (postSamples.length > 3) {
            const min = Math.min(...postSamples)
            const max = Math.max(...postSamples)
            const avg = postSamples.reduce((a, b) => a + b, 0) / postSamples.length
            const durMin = Math.round((samples[lastIdx].t - samples[i].t) / 60000)

            // Guardar si es un encapotamiento real (máx < 25,000 lux durante el día)
            if (max < 25000 && max > 0) {
              resultadosEncapotamiento.push({
                fecha: fechaStr,
                luxMin: min,
                luxMax: max,
                luxAvg: avg,
                duracionMin: durMin,
              })
            }
          }
        }
      }

      // 2. Buscar patrones de "lluvia sobre mojado" (Objetivo 2)
      // Buscar caídas de temperatura e incrementos de humedad en una ventana de 15 minutos (3 muestras consecutivas de 5 min)
      // bajo condiciones de iluminancia ya baja (lux < 12,000)
      for (let i = 3; i < samples.length; i++) {
        const sCurrent = samples[i]
        const sPrev = samples[i - 3] // Hace 15 min aprox. (3 bloques de 5 min)

        const deltaT = sCurrent.temp - sPrev.temp
        const deltaH = sCurrent.hum - sPrev.hum

        // Criterios de "lluvia sobre mojado":
        // - Ya estaba nublado previamente: lux previo < 12000
        // - Caída térmica brusca: deltaT <= -1.0°C
        // - Subida de humedad: deltaH >= 3.0% HR (o saturado a >= 98%)
        // - Que coincida con que rain_intensity es mayor a 0 en la muestra actual (para validar si llovió físicamente)
        if (
          sPrev.lux < 12000 &&
          deltaT <= -1.0 &&
          (deltaH >= 2.0 || sCurrent.hum >= 98.0) &&
          sCurrent.rain > 0 &&
          sPrev.rain === 0
        ) {
          casosLluviaSobreMojado.push({
            fecha: fechaStr,
            hora: sCurrent.timeStr,
            tempPre: sPrev.temp,
            tempPost: sCurrent.temp,
            humPre: sPrev.hum,
            humPost: sCurrent.hum,
            luxPre: sPrev.lux,
            luxPost: sCurrent.lux,
            deltaT,
            deltaH,
            rainInt: sCurrent.rain,
          })
        }
      }
    } catch (err) {
      console.error(`Error procesando día ${fechaStr}:`, err)
    }
  }

  // Imprimir Resultados de Encapotamiento Post-Lluvia
  console.log('\n=== RESULTADOS DE ENCAPOTAMIENTO POST-LLUVIA (OBJETIVO 1) ===')
  console.log('Días donde la iluminancia no se recuperó post-lluvia (Lux Máx < 25,000 lux):')
  console.log('----------------------------------------------------------------------')
  console.log('| Fecha      | Lux Mín  | Lux Máx  | Lux Prom  | Duración Post (min) |')
  console.log('----------------------------------------------------------------------')
  resultadosEncapotamiento.forEach((r) => {
    console.log(
      `| ${r.fecha} | ${r.luxMin.toFixed(0).padEnd(8)} | ${r.luxMax.toFixed(0).padEnd(8)} | ${r.luxAvg.toFixed(0).padEnd(9)} | ${String(r.duracionMin).padEnd(19)} |`,
    )
  })
  console.log('----------------------------------------------------------------------')

  // Imprimir Casos de Lluvia sobre Mojado
  console.log('\n=== CASOS DE LLUVIA SOBRE MOJADO ENCONTRADOS (OBJETIVO 2) ===')
  console.log('Fenómenos de inicio de lluvia diurna bajo nubosidad persistente preexistente:')
  console.log(
    '-----------------------------------------------------------------------------------------------------------',
  )
  console.log(
    '| Fecha      | Hora  | Temp Pre | Temp Post | Hum Pre | Hum Post | Lux Pre | Lux Post | DeltaT | DeltaH |',
  )
  console.log(
    '-----------------------------------------------------------------------------------------------------------',
  )
  casosLluviaSobreMojado.forEach((c) => {
    console.log(
      `| ${c.fecha} | ${c.hora} | ${c.tempPre.toFixed(1).padEnd(8)} | ${c.tempPost.toFixed(1).padEnd(9)} | ${c.humPre.toFixed(1).padEnd(7)} | ${c.humPost.toFixed(1).padEnd(8)} | ${c.luxPre.toFixed(0).padEnd(7)} | ${c.luxPost.toFixed(0).padEnd(8)} | ${c.deltaT.toFixed(1).padEnd(6)} | ${c.deltaH.toFixed(1).padEnd(6)} |`,
    )
  })
  console.log(
    '-----------------------------------------------------------------------------------------------------------',
  )

  console.log('\n=== FIN DEL ANÁLISIS ===')
}

main().catch((err) => console.error(err))

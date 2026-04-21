import crypto from 'node:crypto'

import { prisma, TaskPurpose, TaskSource, ZoneType } from '@package/database'

import { Logger } from '../lib/logger'
import { influxClient } from '../lib/influx'

// Límites Botánicos por Defecto (Tropical Orchids - Epiphytes)
const LIMITS = {
  // Disparadores (Triggers)
  MAX_TEMPERATURE_C: 32.0, // Sobre este límite hace demasiado calor
  MIN_RELATIVE_HUMIDITY: 50.0, // Por debajo de este límite el aire está resecando las raíces

  // Guardianes (Throttles)
  MAX_VWC_FOR_WETTING: 0.35, // 35% de Humedad de suelo satelital (AgroMonitoring). Si hay más, el suelo está lodoso, no regar el piso.
  MAX_RAIN_PROBABILITY: 0.6, // Si la probabilidad de lluvia > 60%, la naturaleza lo enfriará/hidratará, no intervenir.

  // Tiempos (Minutes)
  SOIL_WETTING_DURATION: 5, // Minutos de aspersión al suelo
  HUMIDIFICATION_DURATION: 3, // Minutos de nebulización directa
  COOLDOWN_MINUTES: 60, // No emitir otra tarea si en los últimos 60 mins ya se actuó
}

/**
 * Motor de Inferencia Botánica (Botanical Inference Engine).
 * Lee de InfluxDB (variables térmicas actuales) y de Postgres (Predicciones Climáticas - WeatherOracle).
 * Cruza la información y despacha rutinas reactivas a las condiciones.
 */
export async function runInferenceEngine() {
  Logger.info('[ ORACLE ENGINE ] Iniciando evaluación botánica autónoma...')

  try {
    // 1. Obtener última lectura de VWC y lluvia (Oracle)
    const now = new Date()
    const forecast = await prisma.weatherForecast.findFirst({
      where: {
        timestamp: { gte: now }, // Pronóstico actual o inmediato
      },
      orderBy: { timestamp: 'asc' },
    })

    const rainProb = forecast?.precipProb || 0
    const vwc = forecast?.soilMoisture || 0.0

    // Si viene una tormenta fuerte, cedemos el control a la naturaleza.
    if (rainProb > LIMITS.MAX_RAIN_PROBABILITY) {
      Logger.warn(
        `[ ORACLE ENGINE ] Probabilidad de lluvia alta (${(rainProb * 100).toFixed(0)}%). Motor en modo pasivo.`,
      )

      return
    }

    // 2. Obtener la telemetría térmica de los últimos 30 minutos en el interior (InfluxDB)
    // Buscamos promedios para evadir picos transitorios (ej. alguien abrió una puerta caliente).
    const query = `
      SELECT 
        AVG(temperature) as avg_temp, 
        AVG(humidity) as avg_hum 
      FROM "environment_metrics" 
      WHERE time >= now() - interval '30 minutes'
      AND "zone" != 'EXTERIOR'
    `
    const stream = influxClient.query(query)

    let avgTemp = 0
    let avgHum = 0
    let count = 0

    for await (const row of stream) {
      if (row.avg_temp != null) avgTemp = Number(row.avg_temp)
      if (row.avg_hum != null) avgHum = Number(row.avg_hum)
      count++
    }

    if (count === 0 || (avgTemp === 0 && avgHum === 0)) {
      Logger.warn(
        '[ ORACLE ENGINE ] Sin telemetría reciente de InfluxDB. (Es posible que el nodo esté offline o InfluxDB tenga problemas de TLS).',
      )

      return
    }

    Logger.info(
      `[ ORACLE ENGINE ] Telemetría actual -> Temp: ${avgTemp.toFixed(1)}°C | Hum: ${avgHum.toFixed(1)}% | VWC Suelo: ${(vwc * 100).toFixed(1)}%`,
    )

    // 3. Revisar Cooldown de tareas autónomas para evitar loops infinitos
    const recentTask = await prisma.taskLog.findFirst({
      where: {
        source: TaskSource.INFERENCE,
        scheduledAt: { gte: new Date(now.getTime() - LIMITS.COOLDOWN_MINUTES * 60000) },
      },
    })

    if (recentTask) {
      Logger.warn(
        `[ ORACLE ENGINE ] Cooldown activo. Tarea autónoma ejecutada hace menos de ${LIMITS.COOLDOWN_MINUTES} mins.`,
      )

      return
    }

    // 4. LÓGICA DE RECUPERACIÓN (PROACTIVA - 17:00h)
    // Si se saltó el riego de la mañana por pronóstico y al final NO llovió, recuperamos.
    const isRecoveryWindow = now.getHours() === 17 && now.getMinutes() >= 0 && now.getMinutes() < 30

    if (isRecoveryWindow) {
      Logger.info(
        '[ RECOVERY ENGINE ] Ventana de las 17:00h detectada. Buscando deudas de riego...',
      )

      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      const endOfDay = new Date(now.setHours(23, 59, 59, 999))

      // Buscar si hubo riegos de zona A cancelados por clima/pronóstico hoy
      const skippedTasks = await prisma.taskLog.findMany({
        where: {
          purpose: TaskPurpose.IRRIGATION,
          zones: { has: ZoneType.ZONA_A },
          status: 'CANCELLED',
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          notes: { contains: 'WeatherGuard' },
        },
      })

      if (skippedTasks.length > 0) {
        Logger.info(
          `[ RECOVERY ENGINE ] Se encontraron ${skippedTasks.length} tareas de riego canceladas hoy. Validando lluvia real...`,
        )

        // Consultar InfluxDB: ¿Llovió realmente hoy? (> 180 segundos de lluvia acumulada es el umbral para no regar)
        const rainQuery = `
          SELECT SUM("duration_seconds") as total_rain
          FROM "rain_events"
          WHERE time >= now() - interval '12 hours'
          AND zone = 'EXTERIOR'
        `
        const rainStream = influxClient.query(rainQuery)
        let actualRainDuration = 0

        for await (const row of rainStream) {
          if (row.total_rain) actualRainDuration = Number(row.total_rain)
        }

        Logger.info(
          `[ RECOVERY ENGINE ] Lluvia real detectada hoy: ${actualRainDuration} segundos.`,
        )

        if (actualRainDuration < 180) {
          // Si llovió menos de 3 minutos
          // VALIDACIÓN FINAL: ¿Lloverá en la noche?
          const tonightForecast = await prisma.weatherForecast.findFirst({
            where: {
              timestamp: { gte: new Date(Date.now() + 2 * 3600000) },
              precipProb: { gte: 0.7 },
            },
            orderBy: { timestamp: 'asc' },
          })

          if (!tonightForecast) {
            Logger.success(
              '[ RECOVERY ENGINE ] Pronóstico fallido: No llovió y no viene lluvia nocturna. Reprogramando riego.',
            )

            await prisma.taskLog.create({
              data: {
                scheduledAt: new Date(),
                status: 'PENDING',
                source: TaskSource.INFERENCE,
                purpose: TaskPurpose.IRRIGATION,
                zones: [ZoneType.ZONA_A],
                duration: skippedTasks[0].duration, // Recuperamos la misma duración
                notes: `Tarea de recuperación: El pronóstico matutino falló (Lluvia real: ${actualRainDuration}s).`,
              },
            })

            return // Salimos tras crear la tarea de recuperación
          } else {
            Logger.warn(
              `[ RECOVERY ENGINE ] Se detectó probabilidad de lluvia nocturna intensa (${(tonightForecast.precipProb * 100).toFixed(0)}%). Cancelando recuperación.`,
            )
          }
        } else {
          Logger.success(
            '[ RECOVERY ENGINE ] La naturaleza hizo su trabajo. Lluvia real suficiente detectada.',
          )
        }
      }
    }

    // 5. LÓGICA DE DECISIÓN REACTIVA (Existente)
    let selectedPurpose: TaskPurpose | null = null
    let selectedDuration = 0

    // REGLA A: Demasiado calor, requerimos 'Evaporative Cooling' humedeciendo el piso
    if (avgTemp > LIMITS.MAX_TEMPERATURE_C) {
      // Solo regamos el piso si el terreno lo admite
      if (vwc < LIMITS.MAX_VWC_FOR_WETTING) {
        Logger.warn(
          `[ ORACLE ENGINE ] Alerta Térmica: ${avgTemp.toFixed(1)}°C. Activando ruteo de Evaporative Cooling.`,
        )
        selectedPurpose = TaskPurpose.SOIL_WETTING
        selectedDuration = LIMITS.SOIL_WETTING_DURATION
      } else {
        Logger.warn(
          `[ ORACLE ENGINE ] Suelo muy saturado (VWC ${(vwc * 100).toFixed(0)}%). Abortando enfriamiento por piso.`,
        )
        // Fallback: Si hace mucho calor pero el piso es barro, al menos damos un choque térmico de humedad.
        selectedPurpose = TaskPurpose.HUMIDIFICATION
        selectedDuration = LIMITS.HUMIDIFICATION_DURATION
      }
    }
    // REGLA B: Resequedad letal ambiental
    else if (avgHum < LIMITS.MIN_RELATIVE_HUMIDITY) {
      Logger.warn(
        `[ ORACLE ENGINE ] Alerta Desecación: ${avgHum.toFixed(1)}%. Activando Nebulización Aérea.`,
      )
      selectedPurpose = TaskPurpose.HUMIDIFICATION
      selectedDuration = LIMITS.HUMIDIFICATION_DURATION
    }

    // 6. Inyección a Postgres si hay decisión reactiva
    if (selectedPurpose) {
      const taskId = crypto.randomUUID()

      await prisma.taskLog.create({
        data: {
          id: taskId,
          // Lo programamos inmediatamente (PENDING se recogerá en el loop de los próximos 60segs)
          scheduledAt: new Date(),
          status: 'PENDING',
          source: TaskSource.INFERENCE,
          purpose: selectedPurpose,
          zones: [ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D], // Por defecto toda el area cultivable
          duration: selectedDuration,
          notes: `Generado auto: Temp=${avgTemp.toFixed(1)}C, Hum=${avgHum.toFixed(1)}%, VWC=${(vwc * 100).toFixed(1)}%`,
        },
      })
      Logger.success(
        `[ ORACLE ENGINE ] Comando ${selectedPurpose} de ${selectedDuration} min encolado exitosamente.`,
      )
    } else {
      Logger.success(`[ ORACLE ENGINE ] Microclima estable. No se requiere intervención.`)
    }
  } catch (err: unknown) {
    Logger.error('Error durante iteración:', err)
  }
}

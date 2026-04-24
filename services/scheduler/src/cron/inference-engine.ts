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
    // 1. Obtener lluvia real acumulada (sensor de gotas, no pronóstico)
    const now = new Date()
    const rainQuery = `
      SELECT SUM("duration_seconds") as total_rain
      FROM "rain_events"
      WHERE time >= now() - interval '2 hours'
      AND zone = 'EXTERIOR'
    `
    const rainStream = influxClient.query(rainQuery)
    let recentRainSeconds = 0

    for await (const row of rainStream) {
      if (row.total_rain) recentRainSeconds = Number(row.total_rain)
    }

    // Si llovió más de 3 minutos en las últimas 2h, modo pasivo
    if (recentRainSeconds >= 180) {
      Logger.warn(
        `[ ORACLE ENGINE ] Lluvia real reciente: ${Math.round(recentRainSeconds / 60)} min. Motor en modo pasivo.`,
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

    // 2b. Obtener VWC del suelo (AgroMonitoring en Postgres)
    const soilData = await prisma.weatherForecast.findFirst({
      where: { source: 'AgroMonitoring', soilMoisture: { not: null } },
      orderBy: { timestamp: 'desc' },
    })
    const vwc = soilData?.soilMoisture || 0.0

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

    // 4. ADAPTACIÓN DE CRONOGRAMA (RainSeasonAdapter)
    // Evalúa si el próximo riego debe diferirse por lluvia acumulada.
    // Se ejecuta siempre, no solo a las 17h.
    const { evaluateRainSeason } = await import('../lib/rain-season-adapter')
    const { classifyCurrentDay } = await import('../lib/day-classifier')

    const dayClass = await classifyCurrentDay()

    const rainDecision = await evaluateRainSeason({
      interiorHumidity: avgHum,
      dayType: dayClass.type,
    })

    if (rainDecision.shouldDeferIrrigation) {
      Logger.warn(
        `[ RAIN ADAPTER ] ${rainDecision.reason} → Riego diferido a ${rainDecision.deferToDate?.toLocaleString() ?? 'N/A'}`,
      )
    } else {
      Logger.info(
        `[ RAIN ADAPTER ] ${rainDecision.reason} (Último riego: hace ${rainDecision.daysSinceLastIrrigation} día${rainDecision.daysSinceLastIrrigation !== 1 ? 's' : ''})`,
      )
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

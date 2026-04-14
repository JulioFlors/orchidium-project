import { InfluxDBClient } from '@influxdata/influxdb3-client'
import { prisma, TaskPurpose, TaskSource, ZoneType } from '@package/database'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from '../logger'

// ---- Configuración ----
const INFLUX_URL = process.env.INFLUX_URL || process.env.INFLUX_URL_CLOUD || process.env.INFLUX_URL_LOCAL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN_SERVERLESS
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET,
})

// Límites Botánicos por Defecto (Tropical Orchids - Epiphytes)
const LIMITS = {
  // Disparadores (Triggers)
  MAX_TEMPERATURE_C: 32.0,   // Sobre este límite hace demasiado calor
  MIN_RELATIVE_HUMIDITY: 50.0, // Por debajo de este límite el aire está resecando las raíces

  // Guardianes (Throttles)
  MAX_VWC_FOR_WETTING: 0.35,  // 35% de Humedad de suelo satelital (AgroMonitoring). Si hay más, el suelo está lodoso, no regar el piso.
  MAX_RAIN_PROBABILITY: 0.60, // Si la probabilidad de lluvia > 60%, la naturaleza lo enfriará/hidratará, no intervenir.

  // Tiempos (Minutes)
  SOIL_WETTING_DURATION: 5,   // Minutos de aspersión al suelo
  HUMIDIFICATION_DURATION: 3, // Minutos de nebulización directa
  COOLDOWN_MINUTES: 60        // No emitir otra tarea si en los últimos 60 mins ya se actuó
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
      orderBy: { timestamp: 'asc' }
    })

    const rainProb = forecast?.precipProb || 0
    const vwc = forecast?.soilMoisture || 0.0

    // Si viene una tormenta fuerte, cedemos el control a la naturaleza.
    if (rainProb > LIMITS.MAX_RAIN_PROBABILITY) {
      Logger.warn(`[ ORACLE ENGINE ] Probabilidad de lluvia alta (${(rainProb * 100).toFixed(0)}%). Motor en modo pasivo.`)
      return
    }

    // 2. Obtener la telemetría térmica de los últimos 15 minutos en el interior (InfluxDB)
    // Buscamos promedios para evadir picos transitorios (ej. alguien abrió una puerta caliente).
    const query = `
      SELECT 
        AVG(temperature) as avg_temp, 
        AVG(humidity) as avg_hum 
      FROM "environment_metrics" 
      WHERE time >= now() - interval '15 minutes'
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
      Logger.warn('[ ORACLE ENGINE ] Sin telemetría reciente de InfluxDB. Saltando inferencia.')
      return
    }

    Logger.info(`[ ORACLE ENGINE ] Telemetría actual -> Temp: ${avgTemp.toFixed(1)}°C | Hum: ${avgHum.toFixed(1)}% | VWC Suelo: ${(vwc * 100).toFixed(1)}%`)

    // 3. Revisar Cooldown de tareas autónomas para evitar loops infinitos
    const recentTask = await prisma.taskLog.findFirst({
      where: {
        source: TaskSource.ORACLE_INFERENCE,
        createdAt: { gte: new Date(now.getTime() - LIMITS.COOLDOWN_MINUTES * 60000) }
      }
    })

    if (recentTask) {
      Logger.warn(`[ ORACLE ENGINE ] Cooldown activo. Tarea autónoma ejecutada hace menos de ${LIMITS.COOLDOWN_MINUTES} mins.`)
      return
    }

    // 4. Lógica de Decisión
    let selectedPurpose: TaskPurpose | null = null
    let selectedDuration = 0
    
    // REGLA A: Demasiado calor, requerimos 'Evaporative Cooling' humedeciendo el piso
    if (avgTemp > LIMITS.MAX_TEMPERATURE_C) {
      // Solo regamos el piso si el terreno lo admite
      if (vwc < LIMITS.MAX_VWC_FOR_WETTING) {
        Logger.warn(`[ ORACLE ENGINE ] Alerta Térmica: ${avgTemp.toFixed(1)}°C. Activando ruteo de Evaporative Cooling.`)
        selectedPurpose = TaskPurpose.SOIL_WETTING
        selectedDuration = LIMITS.SOIL_WETTING_DURATION
      } else {
        Logger.warn(`[ ORACLE ENGINE ] Suelo muy saturado (VWC ${(vwc * 100).toFixed(0)}%). Abortando enfriamiento por piso.`)
        // Fallback: Si hace mucho calor pero el piso es barro, al menos damos un choque térmico de humedad.
        selectedPurpose = TaskPurpose.HUMIDIFICATION
        selectedDuration = LIMITS.HUMIDIFICATION_DURATION
      }
    } 
    // REGLA B: Resequedad letal ambiental
    else if (avgHum < LIMITS.MIN_RELATIVE_HUMIDITY) {
      Logger.warn(`[ ORACLE ENGINE ] Alerta Desecación: ${avgHum.toFixed(1)}%. Activando Nebulización Aérea.`)
      selectedPurpose = TaskPurpose.HUMIDIFICATION
      selectedDuration = LIMITS.HUMIDIFICATION_DURATION
    }

    // 5. Inyección a Postgres si hay decisión
    if (selectedPurpose) {
      const taskId = uuidv4()
      await prisma.taskLog.create({
        data: {
          id: taskId,
          // Lo programamos inmediatamente (PENDING se recogerá en el loop de los próximos 60segs)
          scheduledAt: new Date(), 
          status: 'PENDING',
          source: TaskSource.ORACLE_INFERENCE,
          purpose: selectedPurpose,
          zones: [ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D], // Por defecto toda el area cultivable
          duration: selectedDuration,
          notes: `Generado auto: Temp=${avgTemp.toFixed(1)}C, Hum=${avgHum.toFixed(1)}%, VWC=${(vwc * 100).toFixed(1)}%`
        }
      })
      Logger.success(`[ ORACLE ENGINE ] Comando ${selectedPurpose} de ${selectedDuration} min encolado exitosamente.`)
    } else {
      Logger.success(`[ ORACLE ENGINE ] Microclima estable. No se requiere intervención.`)
    }

  } catch (err: any) {
    Logger.error('[ ORACLE ENGINE ] Error durante iteración:', err.message)
  }
}

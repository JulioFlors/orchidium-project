import { prisma, TaskPurpose, TaskSource, TaskStatus, ZoneType } from '@package/database'

import { Logger } from './logger'

/**
 * Adaptador de Temporada de Lluvia.
 *
 * Gestiona el espaciado interdiario del riego por aspersión (6AM, L/M/V/D):
 *
 * REGLAS DE NEGOCIO (del cultivador):
 * - Riego interdiario: un día riego, el otro no, el siguiente sí.
 * - Si llueve >20min, equivale a un riego. El siguiente día programado se omite.
 * - Si llueve 2 días seguidos, se omiten las tareas de riego Y nebulización.
 *   Se deja un día de "descanso hídrico" y se evalúa el clima de ese día.
 * - Si el día de descanso es nublado (<26k lux promedio) + HR alta (>80%),
 *   se agrega un segundo día de descanso antes de retomar.
 * - Si el día de descanso fue soleado (>40k lux), se puede considerar
 *   humidificar 10min al día siguiente a las 6am.
 *
 * TODO: Muchas de estas reglas son tentativas. Necesitan ajuste con datos
 * de temporada de lluvia (mayo-octubre). Dejar anotaciones TODO: en cada regla.
 */

const RAIN_ADAPTER = {
  SIGNIFICANT_RAIN_SECONDS: 1200, // 20 min = lluvia significativa (equivale a riego)
  LOOKBACK_HOURS: 48, // Ventana de análisis
  MAX_DAYS_WITHOUT_IRRIGATION: 3, // Máximo tolerable sin regar (emergencia)
  DEFAULT_IRRIGATION_DURATION: 15, // Minutos de aspersión diferida (confirmado: 15 min)
  IRRIGATION_HOUR: 6, // 6:00 AM
  // TODO: Calibrar con datos reales del DHT22
  HIGH_HUMIDITY_THRESHOLD: 80, // HR% para día extra de descanso
  OVERCAST_LUX_THRESHOLD: 26000, // Promedio < 26k = nublado
}

export interface RainSeasonDecision {
  shouldDeferIrrigation: boolean
  deferToDate: Date | null
  reason: string
  rainAccumulation48h: number
  lastIrrigationDate: Date | null
  daysSinceLastIrrigation: number
}

/**
 * Evalúa si el próximo riego debe diferirse por lluvia y opcionalmente
 * crea la tarea diferida en la base de datos.
 */
export async function evaluateRainSeason(options?: {
  interiorHumidity?: number
  dayType?: string
  avgLuxToday?: number
  dryRun?: boolean
}): Promise<RainSeasonDecision> {
  const now = new Date()
  const {
    interiorHumidity = 0,
    dayType = 'UNKNOWN',
    avgLuxToday = 0,
    dryRun = false,
  } = options || {}

  try {
    // 1. Lluvia acumulada en últimas 48h (solo eventos cerrados)
    const since48h = new Date(now.getTime() - RAIN_ADAPTER.LOOKBACK_HOURS * 3600000)
    const rainAgg = await prisma.rainEvent.aggregate({
      where: { zone: ZoneType.EXTERIOR, startedAt: { gte: since48h }, endedAt: { not: null } },
      _sum: { durationSeconds: true },
    })
    const rainAccumulation48h = rainAgg._sum.durationSeconds ?? 0

    // 2. Último riego exitoso (IRRIGATION por aspersión)
    const lastIrrigation = await prisma.taskLog.findFirst({
      where: {
        purpose: TaskPurpose.IRRIGATION,
        status: { in: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS] },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    const lastIrrigationDate = lastIrrigation?.scheduledAt || null
    const daysSinceLastIrrigation = lastIrrigationDate
      ? Math.floor((now.getTime() - lastIrrigationDate.getTime()) / 86400000)
      : 999

    // 3. Lluvia de ayer (12h-36h atrás → ventana del día anterior)
    const sinceYesterday = new Date(now.getTime() - 36 * 3600000)
    const untilYesterday = new Date(now.getTime() - 12 * 3600000)
    const rainYesterdayAgg = await prisma.rainEvent.aggregate({
      where: {
        zone: ZoneType.EXTERIOR,
        startedAt: { gte: sinceYesterday, lt: untilYesterday },
        endedAt: { not: null },
      },
      _sum: { durationSeconds: true },
    })
    const rainYesterday = rainYesterdayAgg._sum.durationSeconds ?? 0

    // 4. Lluvia de anteayer (36h-60h atrás)
    const sinceDayBefore = new Date(now.getTime() - 60 * 3600000)
    const untilDayBefore = new Date(now.getTime() - 36 * 3600000)
    const rainDayBeforeAgg = await prisma.rainEvent.aggregate({
      where: {
        zone: ZoneType.EXTERIOR,
        startedAt: { gte: sinceDayBefore, lt: untilDayBefore },
        endedAt: { not: null },
      },
      _sum: { durationSeconds: true },
    })
    const rainDayBefore = rainDayBeforeAgg._sum.durationSeconds ?? 0

    // 5. Lógica de decisión
    const rainedYesterday = rainYesterday >= RAIN_ADAPTER.SIGNIFICANT_RAIN_SECONDS
    const rainedDayBefore = rainDayBefore >= RAIN_ADAPTER.SIGNIFICANT_RAIN_SECONDS
    const highHumidity = interiorHumidity > RAIN_ADAPTER.HIGH_HUMIDITY_THRESHOLD
    const overcastDay = dayType === 'OVERCAST' || dayType === 'RAINY'
    const overcastByLux = avgLuxToday > 0 && avgLuxToday < RAIN_ADAPTER.OVERCAST_LUX_THRESHOLD

    // CASO A: Demasiados días sin riego → ejecutar obligatoriamente
    if (daysSinceLastIrrigation >= RAIN_ADAPTER.MAX_DAYS_WITHOUT_IRRIGATION) {
      return {
        shouldDeferIrrigation: false,
        deferToDate: null,
        reason: `Emergencia: ${daysSinceLastIrrigation} días sin riego. Ejecutar obligatoriamente.`,
        rainAccumulation48h,
        lastIrrigationDate,
        daysSinceLastIrrigation,
      }
    }

    // CASO B: Llovió 2 días seguidos → descanso hídrico extendido
    // TODO: Evaluar si el día de descanso fue soleado >40k para considerar humidificación
    if (rainedYesterday && rainedDayBefore) {
      // Si además el día es nublado + HR alta → 2 días de descanso
      if ((overcastDay || overcastByLux) && highHumidity) {
        const pasadoManana = getNext6am(now, 2)

        const decision: RainSeasonDecision = {
          shouldDeferIrrigation: true,
          deferToDate: pasadoManana,
          reason: `2 días de lluvia consecutivos + día ${dayType} + HR ${interiorHumidity.toFixed(0)}%. Descanso hídrico extendido (2 días).`,
          rainAccumulation48h,
          lastIrrigationDate,
          daysSinceLastIrrigation,
        }

        if (!dryRun) await createDeferredIrrigation(pasadoManana, decision.reason)

        return decision
      }

      // 2 días de lluvia pero hoy no nublado → 1 día de descanso
      const tomorrow = getNext6am(now, 1)

      const decision: RainSeasonDecision = {
        shouldDeferIrrigation: true,
        deferToDate: tomorrow,
        reason: `2 días de lluvia consecutivos. Descanso hídrico de 1 día.`,
        rainAccumulation48h,
        lastIrrigationDate,
        daysSinceLastIrrigation,
      }

      if (!dryRun) await createDeferredIrrigation(tomorrow, decision.reason)

      return decision
    }

    // CASO C: Llovió ayer >20min → diferir 1 día (mantener interdiario)
    // TODO: Considerar el clima del día actual para decidir si el diferido
    // debe ejecutarse mañana o pasado mañana.
    if (rainedYesterday && daysSinceLastIrrigation <= 1) {
      const tomorrow = getNext6am(now, 1)

      const decision: RainSeasonDecision = {
        shouldDeferIrrigation: true,
        deferToDate: tomorrow,
        reason: `Lluvia ayer (${Math.round(rainYesterday / 60)}min). Diferido para mantener espaciado interdiario.`,
        rainAccumulation48h,
        lastIrrigationDate,
        daysSinceLastIrrigation,
      }

      if (!dryRun) await createDeferredIrrigation(tomorrow, decision.reason)

      return decision
    }

    // CASO D: Sin lluvia significativa → cronograma normal
    return {
      shouldDeferIrrigation: false,
      deferToDate: null,
      reason: `Sin lluvia significativa reciente. Cronograma normal.`,
      rainAccumulation48h,
      lastIrrigationDate,
      daysSinceLastIrrigation,
    }
  } catch {
    Logger.rain('Error evaluando temporada de lluvia.')

    return {
      shouldDeferIrrigation: false,
      deferToDate: null,
      reason: 'Error en evaluación. Ejecutar por seguridad.',
      rainAccumulation48h: 0,
      lastIrrigationDate: null,
      daysSinceLastIrrigation: 999,
    }
  }
}

/**
 * Crea una tarea de riego diferida si no existe ya una para esa fecha.
 * Verifica la cola de ejecuciones para evitar duplicados.
 */
async function createDeferredIrrigation(scheduledAt: Date, reason: string) {
  // Verificar duplicados en la cola (±30 min del slot)
  const startOfSlot = new Date(scheduledAt.getTime() - 30 * 60000)
  const endOfSlot = new Date(scheduledAt.getTime() + 30 * 60000)

  const existing = await prisma.taskLog.findFirst({
    where: {
      purpose: TaskPurpose.IRRIGATION,
      source: { in: [TaskSource.INFERENCE, TaskSource.ROUTINE] },
      scheduledAt: { gte: startOfSlot, lte: endOfSlot },
      status: { in: [TaskStatus.PENDING, TaskStatus.CONFIRMED] },
    },
  })

  if (existing) {
    Logger.rain(`Ya existe tarea para ${scheduledAt.toLocaleString()}. No se crea duplicado.`)

    return
  }

  await prisma.taskLog.create({
    data: {
      scheduledAt,
      status: TaskStatus.PENDING,
      source: TaskSource.INFERENCE,
      purpose: TaskPurpose.IRRIGATION,
      zones: [ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D],
      duration: RAIN_ADAPTER.DEFAULT_IRRIGATION_DURATION,
      notes: `[ RAIN ADAPTER ] ${reason}`,
    },
  })

  Logger.rain(`Tarea de riego diferida creada para ${scheduledAt.toLocaleString()}.`)
}

function getNext6am(from: Date, daysAhead: number): Date {
  const target = new Date(from)

  target.setDate(target.getDate() + daysAhead)
  target.setHours(RAIN_ADAPTER.IRRIGATION_HOUR, 0, 0, 0)

  return target
}

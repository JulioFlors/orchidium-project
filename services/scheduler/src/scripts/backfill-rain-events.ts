/**
 * ============================================================
 * BACKFILL: Reconstrucción de Eventos de Lluvia → PostgreSQL
 * ============================================================
 * Lee los datos crudos de `rain_intensity` desde InfluxDB, los
 * agrupa en eventos de lluvia discretos (cooldown de 15 minutos)
 * y los inserta en la tabla `RainEvent` en PostgreSQL.
 *
 * Incluye saneamiento automático de timestamps (epoch de MicroPython)
 * y truncamiento de eventos anómalos de lluvia larga (sensor sucio)
 * del 11 al 14 de mayo de 2026.
 *
 * CÓMO EJECUTAR:
 * ```bash
 * $env:BACKFILL_DAYS=90; npx dotenv-cli -e ../../.env -- pnpm tsx services/scheduler/src/scripts/backfill-rain-events.ts
 * ```
 * ============================================================
 */

import { prisma, ZoneType } from '@package/database'

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

const BACKFILL_DAYS = parseInt(process.env.BACKFILL_DAYS || '30', 10)
const DRY_RUN = process.env.BACKFILL_DRY_RUN === 'true'
const COOLDOWN_MS = 15 * 60 * 1000 // 15 minutos sin lluvia para cerrar evento

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

interface TempEvent {
  startedAt: Date
  endedAt: Date
  intensities: number[]
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info(`  RECONSTRUCCIÓN DE RAIN EVENTS: ${BACKFILL_DAYS} días`)
  if (DRY_RUN) Logger.warn('  ⚠️  MODO DRY-RUN — No se escribirá en Postgres')
  Logger.info('════════════════════════════════════════════════════════')

  const now = new Date()
  const startTime = new Date(now)

  startTime.setDate(startTime.getDate() - BACKFILL_DAYS)
  startTime.setHours(0, 0, 0, 0)

  const endTime = new Date(now)

  Logger.info(
    `Buscando datos de lluvia en InfluxDB desde ${startTime.toISOString()} hasta ${endTime.toISOString()}...`,
  )

  let currentEvent: TempEvent | null = null
  let createdCount = 0
  let totalRows = 0

  // Dividimos la búsqueda en bloques de 5 días para evitar "Query would scan 1000 Parquet files"
  const BLOCK_DAYS = 5
  const blockMs = BLOCK_DAYS * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  try {
    while (startMs < endMs) {
      let nextMs = startMs + blockMs

      if (nextMs > endMs) nextMs = endMs

      const blockStart = new Date(startMs)
      const blockEnd = new Date(nextMs)

      Logger.info(
        `[BLOQUE] Consultando rango: ${blockStart.toISOString()} -> ${blockEnd.toISOString()}`,
      )

      const query = `
        SELECT time, "rain_intensity" 
        FROM "environment_metrics" 
        WHERE "zone" = 'EXTERIOR' 
          AND time >= '${blockStart.toISOString()}' 
          AND time < '${blockEnd.toISOString()}'
        ORDER BY time ASC
      `

      const stream = influxClient.query(query)

      for await (const row of stream) {
        totalRows++
        const tDate = rowTimeToDate(row.time)
        const intensity = row.rain_intensity != null ? Number(row.rain_intensity) : 0

        if (intensity > 0) {
          if (!currentEvent) {
            // Iniciar nuevo evento de lluvia
            currentEvent = {
              startedAt: tDate,
              endedAt: tDate,
              intensities: [intensity],
            }
          } else {
            // Evaluar si pertenece al mismo evento
            const gap = tDate.getTime() - currentEvent.endedAt.getTime()

            if (gap > COOLDOWN_MS) {
              // El gap supera el cooldown, cerramos el evento anterior y abrimos uno nuevo
              await saveRainEvent(currentEvent)
              createdCount++
              currentEvent = {
                startedAt: tDate,
                endedAt: tDate,
                intensities: [intensity],
              }
            } else {
              // Continuación del evento de lluvia actual
              currentEvent.endedAt = tDate
              currentEvent.intensities.push(intensity)
            }
          }
        } else {
          // Lectura de 0. Si hay un evento abierto y ha pasado el cooldown, lo cerramos
          if (currentEvent) {
            const gap = tDate.getTime() - currentEvent.endedAt.getTime()

            if (gap > COOLDOWN_MS) {
              await saveRainEvent(currentEvent)
              createdCount++
              currentEvent = null
            }
          }
        }
      }

      startMs = nextMs
    }

    // Guardar el último evento si quedó abierto
    if (currentEvent) {
      await saveRainEvent(currentEvent)
      createdCount++
    }

    Logger.info('════════════════════════════════════════════════════════')
    Logger.success(
      `Reconstrucción completada. Filas procesadas: ${totalRows}. Eventos creados: ${createdCount}`,
    )
    Logger.info('════════════════════════════════════════════════════════')
  } catch (err) {
    Logger.error('Error durante la reconstrucción de eventos de lluvia:', err)
  } finally {
    await prisma.$disconnect()
    await influxClient.close()
  }
}

async function saveRainEvent(event: TempEvent) {
  const { intensities } = event
  let { startedAt, endedAt } = event
  let durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

  if (durationSeconds <= 0) {
    durationSeconds = 60 // Duración mínima 1 minuto para lecturas únicas
  }

  // 1. Saneamiento automático de Timestamps (Epoch de MicroPython, desfase de 30 años)
  // Si el año es menor que 2025, le sumamos 30 años para normalizar a Unix epoch.
  if (startedAt.getFullYear() < 2025) {
    const originalStart = startedAt.toISOString()

    startedAt = new Date(startedAt)
    startedAt.setFullYear(startedAt.getFullYear() + 30)

    endedAt = new Date(endedAt)
    endedAt.setFullYear(endedAt.getFullYear() + 30)

    Logger.info(
      `[EPOCH CORRECTION] Ajustando fecha de lluvia de ${originalStart} a ${startedAt.toISOString()}`,
    )
  }

  // 2. Control de Anomalía del Sensor Sucio (11 al 14 de Mayo de 2026)
  // El sensor reportó lluvia continua > 12h, cuando en realidad llovió máx 1h (6am a 7am aprox).
  const anomalyStart = new Date('2026-05-11T00:00:00Z')
  const anomalyEnd = new Date('2026-05-14T23:59:59Z')

  if (startedAt >= anomalyStart && startedAt <= anomalyEnd) {
    // Si el evento dura más de 4 horas en este rango sospechoso, aplicamos la sanitización a 1 hora
    if (durationSeconds > 4 * 3600) {
      const originalEnd = endedAt.toISOString()
      const originalDuration = durationSeconds

      durationSeconds = 3600 // Truncamos a exactamente 1 hora (3600 segundos)
      endedAt = new Date(startedAt.getTime() + 1 * 3600 * 1000)

      Logger.warn(
        `[ANOMALÍA DETECTADA] Evento de lluvia del ${startedAt.toISOString()} al ${originalEnd} detectado con duración excesiva (${(originalDuration / 3600).toFixed(1)}h). Truncado a 1h por sospecha de sensor sucio.`,
      )
    }
  }

  const avgIntensity = Number(
    (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(2),
  )
  const peakIntensity = Math.max(...intensities)

  if (DRY_RUN) {
    Logger.info(
      `[DRY-RUN] RainEvent: Inicio=${startedAt.toISOString()} Fin=${endedAt.toISOString()} Duración=${durationSeconds}s PromInt=${avgIntensity} MaxInt=${peakIntensity}`,
    )

    return
  }

  try {
    await prisma.rainEvent.upsert({
      where: {
        zone_startedAt: { zone: ZoneType.EXTERIOR, startedAt },
      },
      create: {
        startedAt,
        endedAt,
        durationSeconds,
        avgIntensity,
        peakIntensity,
        zone: ZoneType.EXTERIOR,
        closedBy: 'BACKFILL_SCRIPT',
      },
      update: {
        endedAt,
        durationSeconds,
        avgIntensity,
        peakIntensity,
        closedBy: 'BACKFILL_SCRIPT',
      },
    })
    Logger.success(
      `Guardado RainEvent: ${startedAt.toISOString()} -> ${endedAt.toISOString()} (${Math.round(durationSeconds / 60)} min, Avg=${avgIntensity})`,
    )
  } catch (err) {
    Logger.error(`Error guardando RainEvent en Postgres (${startedAt.toISOString()}):`, err)
  }
}

main().catch((err) => {
  Logger.error('Error fatal en el script de backfill de lluvia:', err)
  process.exit(1)
})

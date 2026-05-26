/**
 * ============================================================
 * BACKFILL: Historial de Datos Ambientales → PostgreSQL
 * ============================================================
 * Rellena la tabla `DailyEnvironmentStat` con datos históricos
 * de InfluxDB, incluyendo métricas botánicas derivadas (DLI,
 * VPD, DIF, riesgo epidemiológico, balance hídrico).
 *
 * ESTE SCRIPT ES ÚNICAMENTE PARA SER EJECUTADO MANUALMENTE
 * DENTRO DEL VPS.
 *
 * CÓMO EJECUTAR (desde ~/pristinoplant/services/scheduler en el VPS):
 * ```bash
 * docker run --rm -it \
 *   -v "$(pwd)/../../:/app" \
 *   -w /app/services/scheduler \
 *   --env-file ../../.env \
 *   -e INFLUX_URL="https://vps.sisparrow.com:8181" \
 *   -e INFLUX_TOKEN="apiv3_kcwBrLenNHizPffsCsEy03KmFeYWpvxkopjhQbCuDUBp2nCWw5ZMB7cSnV27D5OGmjsECS5KN4HzO8oNwE7JcQ" \
 *   -e INFLUX_ORG="PristinoPlant" \
 *   --network host \
 *   node:24-alpine \
 *   sh -c "corepack enable && pnpm install && pnpm --filter=@package/database db:generate && pnpm tsx src/scripts/backfill-history.ts"
 * ```
 *
 * PARÁMETROS OPCIONALES (variables de entorno):
 *   BACKFILL_DAYS=30   → Cuántos días hacia atrás procesar (default: 30)
 *   BACKFILL_ZONE=EXTERIOR → Solo procesar una zona (default: todas)
 *   BACKFILL_DRY_RUN=true  → Solo calcula, no guarda en Postgres
 * ============================================================
 */

import { prisma, ZoneType } from '@package/database'

import { Logger } from '../lib/logger'
import { influxClient } from '../lib/influx'
import { processDay } from '../lib/telemetry-processor'

// ── Config ────────────────────────────────────────────────────────────────────
const BACKFILL_DAYS = parseInt(process.env.BACKFILL_DAYS || '30', 10)
const BACKFILL_ZONE = process.env.BACKFILL_ZONE as ZoneType | undefined
const DRY_RUN = process.env.BACKFILL_DRY_RUN === 'true'

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const allZones: ZoneType[] = [ZoneType.EXTERIOR, ZoneType.ZONA_A]
  const zones = BACKFILL_ZONE ? [BACKFILL_ZONE] : allZones

  Logger.info('════════════════════════════════════════════════════════')
  const dayText = BACKFILL_DAYS === 1 ? 'día' : 'días'

  Logger.info(`  BACKFILL: ${BACKFILL_DAYS} ${dayText} × ${zones.join(', ')}`)
  if (DRY_RUN) Logger.warn('  ⚠️  MODO DRY-RUN — No se escribirá en Postgres')
  Logger.info('════════════════════════════════════════════════════════')

  const now = new Date()

  for (let offset = BACKFILL_DAYS; offset >= 1; offset--) {
    const dayStart = new Date(now)

    dayStart.setDate(dayStart.getDate() - offset)
    dayStart.setHours(0, 0, 0, 0)

    for (const zone of zones) {
      await processDay(zone, dayStart, DRY_RUN)
    }
  }

  Logger.info('════════════════════════════════════════════════════════')
  Logger.success('  Backfill completado.')
  Logger.info('════════════════════════════════════════════════════════')

  await prisma.$disconnect()
  await influxClient.close()
}

const isMain = import.meta.url
  ? import.meta.url === `file://${process.argv[1]}`
  : require.main === module

if (isMain || process.argv[1]?.endsWith('backfill-history.ts')) {
  main().catch((err) => {
    Logger.error('Error fatal en backfill:', err)
    process.exit(1)
  })
}

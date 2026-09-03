/**
 * ============================================================================
 * EVALUADOR COMPARATIVO DE MICROCLIMA: ORQUIDEARIO vs EXTERIOR
 * ============================================================================
 * Analiza los días con datos suficientes y válidos en ambas estaciones meteorológicas
 * (EMA Exterior vs EMA Orquideario / ZONA_A) para contrastar:
 * 
 * 1. Malla-Sombra (% de filtro y transmisión de luz):
 *    - Amanecer (06:00 am - 07:59 am)
 *    - Fotoperíodo (08:00 am - 04:00 pm)
 *    - Atardecer (04:01 pm - 06:00 pm)
 *    - DLI (Daily Light Integral en mol/m²/d)
 * 
 * 2. Balance Térmico y Ventilación Natural (ΔT = Interior - Exterior):
 *    - Global 24h
 *    - Día (08:00 am - 04:00 pm)
 *    - Noche (07:00 pm - 05:00 am)
 *    - DIF (Diferencial Térmico Día-Noche)
 * 
 * 3. Conservación de Humedad y Microclima (ΔHR = Interior - Exterior):
 *    - Global 24h
 *    - Día (08:00 am - 04:00 pm)
 *    - Noche (07:00 pm - 05:00 am)
 *    - VPD promedio diurno (Déficit de Presión de Vapor en kPa)
 * 
 * CÓMO EJECUTAR EN EL VPS:
 * ----------------------------------------------------------------------------
 * Opción A (desde el host del VPS con pnpm):
 *   pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/compare-microclimates.ts
 * 
 * Opción B (dentro del contenedor scheduler):
 *   docker exec -it scheduler node -e "import('./dist/bundle.mjs')"  # o con tsx
 *   # O usando un contenedor efímero:
 *   docker run --rm -it \
 *     -v "$(pwd)/../../:/app" \
 *     -w /app/services/scheduler \
 *     --env-file ../../.env \
 *     --network host \
 *     node:24-alpine \
 *     sh -c "corepack enable && pnpm install && pnpm tsx src/scripts/compare-microclimates.ts"
 * 
 * PARÁMETROS OPCIONALES (argumentos CLI o variables de entorno):
 *   --days=30            -> Analizar los últimos N días (default: todos los disponibles)
 *   --from=YYYY-MM-DD    -> Fecha inicial (hora Caracas)
 *   --to=YYYY-MM-DD      -> Fecha final (hora Caracas)
 *   --min-filter=0       -> Filtro mínimo de porcentaje de luz para alertar anomalías
 *   --source=influx      -> Fuerza recálculo directo desde InfluxDB (default: postgres)
 *   --json               -> Exporta resumen estructurado en formato JSON
 * ============================================================================
 */

import { prisma, ZoneType, DailyEnvironmentStat } from '@package/database'
import { influxClient } from '../lib/influx'
import { Logger, colors } from '../lib/logger'
import { getCaracasMidnight } from '../lib/telemetry-processor'

// ── Tipos y Estructuras ──────────────────────────────────────────────────────

export interface MetricPair {
  readonly exterior: number | null
  readonly interior: number | null
  readonly delta: number | null // Interior - Exterior
}

export interface LightSegmentPair {
  readonly exteriorLux: number | null
  readonly interiorLux: number | null
  readonly filterPct: number | null // % de luz bloqueada por la malla
  readonly transmitPct: number | null // % de luz que pasa por la malla
}

export interface DayEvaluation {
  readonly date: string
  readonly dateObj: Date
  readonly isValidOverall: boolean
  readonly isValidLight: boolean
  readonly isValidTemp: boolean
  readonly isValidHum: boolean
  readonly reason: string

  // Iluminancia y Malla
  readonly dawn: LightSegmentPair
  readonly dayLight: LightSegmentPair
  readonly dusk: LightSegmentPair
  readonly dli: {
    readonly exterior: number | null
    readonly interior: number | null
    readonly retentionPct: number | null
  }

  // Temperatura y Ventilación (°C)
  readonly tempGlobal: MetricPair
  readonly tempDay: MetricPair
  readonly tempNight: MetricPair
  readonly dif: {
    readonly exterior: number | null
    readonly interior: number | null
    readonly diff: number | null
  }

  // Humedad y Microclima (%)
  readonly humGlobal: MetricPair
  readonly humDay: MetricPair
  readonly humNight: MetricPair
  readonly vpd: {
    readonly exterior: number | null
    readonly interior: number | null
    readonly delta: number | null
  }
}

export interface AggregateStats {
  readonly count: number
  readonly avgFilterDawn: number | null
  readonly avgFilterDay: number | null
  readonly avgFilterDusk: number | null
  readonly avgFilterDli: number | null

  readonly avgDeltaTempGlobal: number | null
  readonly avgDeltaTempDay: number | null
  readonly avgDeltaTempNight: number | null
  readonly avgInteriorDif: number | null
  readonly avgExteriorDif: number | null

  readonly avgDeltaHumGlobal: number | null
  readonly avgDeltaHumDay: number | null
  readonly avgDeltaHumNight: number | null
  readonly avgInteriorVpd: number | null
  readonly avgExteriorVpd: number | null
}

// ── Helpers Matemáticos y Formato ────────────────────────────────────────────

function round(val: number | null, decimals = 1): number | null {
  if (val === null || isNaN(val)) return null
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

function calculateFilterPct(ext: number | null, int: number | null): number | null {
  if (ext === null || int === null || ext <= 0) return null
  const transmit = int / ext
  const filter = Math.max(0, Math.min(100, (1 - transmit) * 100))
  return round(filter, 1)
}

function calculateTransmitPct(ext: number | null, int: number | null): number | null {
  if (ext === null || int === null || ext <= 0) return null
  const transmit = Math.max(0, Math.min(100, (int / ext) * 100))
  return round(transmit, 1)
}

function calculateDelta(int: number | null, ext: number | null, decimals = 2): number | null {
  if (int === null || ext === null) return null
  return round(int - ext, decimals)
}

function safeAverage(numbers: (number | null)[]): number | null {
  const valid = numbers.filter((n): n is number => n !== null && !isNaN(n))
  if (valid.length === 0) return null
  const sum = valid.reduce((acc, curr) => acc + curr, 0)
  return round(sum / valid.length, 2)
}

function formatDelta(val: number | null, unit = '', inverseColor = false): string {
  if (val === null) return `${colors.dim}  --  ${colors.reset}`
  const sign = val > 0 ? `+${val}` : `${val}`
  const text = `${sign}${unit}`.padStart(7)

  // Para temperatura diurna: si el interior es más fresco que el exterior (val < 0), es verde!
  if (!inverseColor) {
    if (val < 0) return `${colors.green}${text}${colors.reset}`
    if (val > 1.5) return `${colors.red}${text}${colors.reset}`
    return `${colors.yellow}${text}${colors.reset}`
  } else {
    // Para humedad: si el interior es más húmedo (val > 0), es verde!
    if (val > 0) return `${colors.green}${text}${colors.reset}`
    if (val < -5) return `${colors.red}${text}${colors.reset}`
    return `${colors.yellow}${text}${colors.reset}`
  }
}

function formatPct(val: number | null): string {
  if (val === null) return `${colors.dim}  --  ${colors.reset}`
  const text = `${val.toFixed(1)}%`.padStart(6)
  return `${colors.cyan}${text}${colors.reset}`
}

function formatValue(val: number | null, unit = '', pad = 6): string {
  if (val === null) return `${colors.dim}${'--'.padStart(pad)}${colors.reset}`
  return `${val.toFixed(1)}${unit}`.padStart(pad)
}

// ── Procesamiento desde PostgreSQL ───────────────────────────────────────────

async function fetchStatsFromPostgres(
  fromDate?: Date,
  toDate?: Date,
): Promise<Map<string, { exterior?: DailyEnvironmentStat; interior?: DailyEnvironmentStat }>> {
  const whereClause: {
    date?: { gte?: Date; lte?: Date }
    zone: { in: ZoneType[] }
  } = {
    zone: { in: [ZoneType.EXTERIOR, ZoneType.ZONA_A] },
  }

  if (fromDate || toDate) {
    whereClause.date = {}
    if (fromDate) whereClause.date.gte = fromDate
    if (toDate) whereClause.date.lte = toDate
  }

  const rows = await prisma.dailyEnvironmentStat.findMany({
    where: whereClause,
    orderBy: { date: 'asc' },
  })

  const daysMap = new Map<
    string,
    { exterior?: DailyEnvironmentStat; interior?: DailyEnvironmentStat }
  >()

  for (const row of rows) {
    const key = row.date.toISOString().split('T')[0]
    const current = daysMap.get(key) || {}
    if (row.zone === ZoneType.EXTERIOR) {
      current.exterior = row
    } else if (row.zone === ZoneType.ZONA_A) {
      current.interior = row
    }
    daysMap.set(key, current)
  }

  return daysMap
}

/**
 * 🛡️ DÍAS CON FALLAS DOCUMENTADAS / TELEMETRÍA CORRUPTA:
 * Sincronizado con la exclusión de `rebuild-rain-history.ts`:
 * - 10 al 17 de Agosto de 2026: Período con telemetría corrupta, lecturas intercaladas/duplicadas
 *   y desfase horario de la estación EMA Exterior.
 */
export function isKnownFailureDate(date: Date): { isFailed: boolean; reason?: string } {
  try {
    const caracasStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
    const [m, d, y] = caracasStr.split('/')
    const dayNum = parseInt(d, 10)

    if (y === '2026' && m === '08' && dayNum >= 10 && dayNum <= 17) {
      return {
        isFailed: true,
        reason: 'Falla documentada (Telemetría corrupta/desfasada 10-17 Ago 2026)',
      }
    }
  } catch {
    // Si ocurre un error parseando fecha, no excluir
  }

  return { isFailed: false }
}

function evaluateDayFromStats(
  dateStr: string,
  ext?: DailyEnvironmentStat,
  int?: DailyEnvironmentStat,
  includeCorrupt = false,
): DayEvaluation {
  const dateObj = new Date(`${dateStr}T04:00:00.000Z`)

  // 🛡️ Filtro de Exclusión: Días con fallas documentadas en rebuild-rain-history.ts
  const failureCheck = isKnownFailureDate(dateObj)
  if (!includeCorrupt && failureCheck.isFailed) {
    return {
      date: dateStr,
      dateObj,
      isValidOverall: false,
      isValidLight: false,
      isValidTemp: false,
      isValidHum: false,
      reason: failureCheck.reason ?? 'Falla documentada de telemetría',
      dawn: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dayLight: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dusk: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dli: { exterior: null, interior: null, retentionPct: null },
      tempGlobal: { exterior: null, interior: null, delta: null },
      tempDay: { exterior: null, interior: null, delta: null },
      tempNight: { exterior: null, interior: null, delta: null },
      dif: { exterior: null, interior: null, diff: null },
      humGlobal: { exterior: null, interior: null, delta: null },
      humDay: { exterior: null, interior: null, delta: null },
      humNight: { exterior: null, interior: null, delta: null },
      vpd: { exterior: null, interior: null, delta: null },
    }
  }

  if (!ext || !int) {
    const missing = !ext && !int ? 'Ambas EMAs faltantes' : !ext ? 'Falta EMA Exterior' : 'Falta EMA Orquideario'
    return {
      date: dateStr,
      dateObj,
      isValidOverall: false,
      isValidLight: false,
      isValidTemp: false,
      isValidHum: false,
      reason: missing,
      dawn: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dayLight: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dusk: { exteriorLux: null, interiorLux: null, filterPct: null, transmitPct: null },
      dli: { exterior: null, interior: null, retentionPct: null },
      tempGlobal: { exterior: null, interior: null, delta: null },
      tempDay: { exterior: null, interior: null, delta: null },
      tempNight: { exterior: null, interior: null, delta: null },
      dif: { exterior: null, interior: null, diff: null },
      humGlobal: { exterior: null, interior: null, delta: null },
      humDay: { exterior: null, interior: null, delta: null },
      humNight: { exterior: null, interior: null, delta: null },
      vpd: { exterior: null, interior: null, delta: null },
    }
  }

  // 1. Evaluación de Iluminancia (Fotoperíodo es el pilar principal)
  const hasExtDayLux = ext.avgIllumDay !== null && ext.avgIllumDay > 0
  const hasIntDayLux = int.avgIllumDay !== null && int.avgIllumDay > 0
  const isValidLight = Boolean(hasExtDayLux && hasIntDayLux)

  const filterDawn = calculateFilterPct(ext.avgIllumDawn, int.avgIllumDawn)
  const transmitDawn = calculateTransmitPct(ext.avgIllumDawn, int.avgIllumDawn)

  const filterDay = calculateFilterPct(ext.avgIllumDay, int.avgIllumDay)
  const transmitDay = calculateTransmitPct(ext.avgIllumDay, int.avgIllumDay)

  const filterDusk = calculateFilterPct(ext.avgIllumDusk, int.avgIllumDusk)
  const transmitDusk = calculateTransmitPct(ext.avgIllumDusk, int.avgIllumDusk)

  const dliRetention = calculateFilterPct(ext.dli, int.dli)

  // 2. Evaluación Térmica (Día y Noche)
  const hasExtTemp = ext.avgTempDay !== null && ext.avgTempNight !== null
  const hasIntTemp = int.avgTempDay !== null && int.avgTempNight !== null
  const isValidTemp = Boolean(hasExtTemp && hasIntTemp)

  const deltaTempGlobal = calculateDelta(int.avgTemperature, ext.avgTemperature)
  const deltaTempDay = calculateDelta(int.avgTempDay, ext.avgTempDay)
  const deltaTempNight = calculateDelta(int.avgTempNight, ext.avgTempNight)
  const deltaDif = calculateDelta(int.dif, ext.dif)

  // 3. Evaluación de Humedad (Día y Noche)
  const hasExtHum = ext.avgHumDay !== null && ext.avgHumNight !== null
  const hasIntHum = int.avgHumDay !== null && int.avgHumNight !== null
  const isValidHum = Boolean(hasExtHum && hasIntHum)

  const deltaHumGlobal = calculateDelta(int.avgHumidity, ext.avgHumidity)
  const deltaHumDay = calculateDelta(int.avgHumDay, ext.avgHumDay)
  const deltaHumNight = calculateDelta(int.avgHumNight, ext.avgHumNight)
  const deltaVpd = calculateDelta(int.vpdAvg, ext.vpdAvg, 3)

  const isValidOverall = isValidLight && isValidTemp && isValidHum

  let reason = 'Datos completos y representativos'
  if (!isValidOverall) {
    const missingParts: string[] = []
    if (!isValidLight) missingParts.push('Luz insuficiente')
    if (!isValidTemp) missingParts.push('Temp incompleta')
    if (!isValidHum) missingParts.push('Hum incompleta')
    reason = missingParts.join(', ')
  }

  return {
    date: dateStr,
    dateObj,
    isValidOverall,
    isValidLight,
    isValidTemp,
    isValidHum,
    reason,
    dawn: {
      exteriorLux: ext.avgIllumDawn,
      interiorLux: int.avgIllumDawn,
      filterPct: filterDawn,
      transmitPct: transmitDawn,
    },
    dayLight: {
      exteriorLux: ext.avgIllumDay,
      interiorLux: int.avgIllumDay,
      filterPct: filterDay,
      transmitPct: transmitDay,
    },
    dusk: {
      exteriorLux: ext.avgIllumDusk,
      interiorLux: int.avgIllumDusk,
      filterPct: filterDusk,
      transmitPct: transmitDusk,
    },
    dli: {
      exterior: ext.dli,
      interior: int.dli,
      retentionPct: dliRetention,
    },
    tempGlobal: {
      exterior: ext.avgTemperature,
      interior: int.avgTemperature,
      delta: deltaTempGlobal,
    },
    tempDay: {
      exterior: ext.avgTempDay,
      interior: int.avgTempDay,
      delta: deltaTempDay,
    },
    tempNight: {
      exterior: ext.avgTempNight,
      interior: int.avgTempNight,
      delta: deltaTempNight,
    },
    dif: {
      exterior: ext.dif,
      interior: int.dif,
      diff: deltaDif,
    },
    humGlobal: {
      exterior: ext.avgHumidity,
      interior: int.avgHumidity,
      delta: deltaHumGlobal,
    },
    humDay: {
      exterior: ext.avgHumDay,
      interior: int.avgHumDay,
      delta: deltaHumDay,
    },
    humNight: {
      exterior: ext.avgHumNight,
      interior: int.avgHumNight,
      delta: deltaHumNight,
    },
    vpd: {
      exterior: ext.vpdAvg,
      interior: int.vpdAvg,
      delta: deltaVpd,
    },
  }
}

// ── Cálculo de Agregados Globales ───────────────────────────────────────────

function computeAggregateStats(days: DayEvaluation[]): AggregateStats {
  const validDays = days.filter((d) => d.isValidLight || d.isValidTemp || d.isValidHum)

  return {
    count: validDays.length,
    avgFilterDawn: safeAverage(validDays.map((d) => d.dawn.filterPct)),
    avgFilterDay: safeAverage(validDays.map((d) => d.dayLight.filterPct)),
    avgFilterDusk: safeAverage(validDays.map((d) => d.dusk.filterPct)),
    avgFilterDli: safeAverage(validDays.map((d) => d.dli.retentionPct)),

    avgDeltaTempGlobal: safeAverage(validDays.map((d) => d.tempGlobal.delta)),
    avgDeltaTempDay: safeAverage(validDays.map((d) => d.tempDay.delta)),
    avgDeltaTempNight: safeAverage(validDays.map((d) => d.tempNight.delta)),
    avgInteriorDif: safeAverage(validDays.map((d) => d.dif.interior)),
    avgExteriorDif: safeAverage(validDays.map((d) => d.dif.exterior)),

    avgDeltaHumGlobal: safeAverage(validDays.map((d) => d.humGlobal.delta)),
    avgDeltaHumDay: safeAverage(validDays.map((d) => d.humDay.delta)),
    avgDeltaHumNight: safeAverage(validDays.map((d) => d.humNight.delta)),
    avgInteriorVpd: safeAverage(validDays.map((d) => d.vpd.interior)),
    avgExteriorVpd: safeAverage(validDays.map((d) => d.vpd.exterior)),
  }
}

// ── Renderizado en Consola ──────────────────────────────────────────────────

function printHeader(daysCount: number, from?: string, to?: string, includeCorrupt = false) {
  console.log(`\n${colors.bold}${colors.green}╔══════════════════════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.bold}${colors.green}║        PRISTINOPLANT — CONTRASTE MICROCLIMÁTICO (ORQUIDEARIO vs EXTERIOR)        ║${colors.reset}`)
  console.log(`${colors.bold}${colors.green}╚══════════════════════════════════════════════════════════════════════════════════╝${colors.reset}`)
  console.log(`  ${colors.bold}Parámetros de Evaluación:${colors.reset}`)
  const daysText = daysCount > 0 ? ` (Últimos ${daysCount} días)` : ''
  console.log(`  - Ventana temporal: ${from ?? 'Inicio histórico'} ➔ ${to ?? 'Último registro disponible'}${daysText}`)
  console.log(`  - Estaciones comparadas: EMA Exterior (Actuador) vs EMA Orquideario (ZONA_A)`)
  console.log(`  - Criterio de validez: Supervivencia ≥60% de muestras por franja temporal`)
  if (!includeCorrupt) {
    console.log(`  - Filtro de exclusión: ${colors.yellow}🛡️ 10 al 17 de Agosto 2026 EXCLUIDOS (Falla documentada en rebuild-rain-history.ts)${colors.reset}`)
  } else {
    console.log(`  - Filtro de exclusión: ${colors.red}⚠️ Días corruptos INCLUIDOS forzadamente (--include-corrupt)${colors.reset}`)
  }
  console.log('──────────────────────────────────────────────────────────────────────────────────')
}

function printInventoryTable(evaluations: DayEvaluation[]) {
  console.log(`\n${colors.bold}📅 INVENTARIO Y DISPONIBILIDAD DE DATOS POR DÍA:${colors.reset}`)
  console.log('┌────────────┬─────────────┬─────────────┬─────────────┬────────────────────────────────────┐')
  console.log('│   Fecha    │ Luz / Malla │ Temperatura │   Humedad   │ Estado y Diagnóstico               │')
  console.log('├────────────┼─────────────┼─────────────┼─────────────┼────────────────────────────────────┤')

  for (const ev of evaluations) {
    const failureCheck = isKnownFailureDate(ev.dateObj)
    const isExcludedByFailure = failureCheck.isFailed

    const luzIcon = isExcludedByFailure
      ? `${colors.dim}  Excluido ${colors.reset}`
      : ev.isValidLight
        ? `${colors.green}    OK    ${colors.reset}`
        : `${colors.red} Incompleto${colors.reset}`
    const tempIcon = isExcludedByFailure
      ? `${colors.dim}  Excluido ${colors.reset}`
      : ev.isValidTemp
        ? `${colors.green}    OK    ${colors.reset}`
        : `${colors.red} Incompleto${colors.reset}`
    const humIcon = isExcludedByFailure
      ? `${colors.dim}  Excluido ${colors.reset}`
      : ev.isValidHum
        ? `${colors.green}    OK    ${colors.reset}`
        : `${colors.red} Incompleto${colors.reset}`

    let statusTag = ''
    if (isExcludedByFailure) {
      statusTag = `${colors.yellow}🛡️  Excluido (Falla documentada)${colors.reset}`
    } else if (ev.isValidOverall) {
      statusTag = `${colors.green}✅ Válido Completo (3/3)${colors.reset}`
    } else if (ev.isValidLight || ev.isValidTemp || ev.isValidHum) {
      statusTag = `${colors.yellow}⚠️  Parcial (${ev.reason})${colors.reset}`
    } else {
      statusTag = `${colors.dim}❌ Descartado (${ev.reason})${colors.reset}`
    }

    console.log(`│ ${ev.date} │ ${luzIcon} │ ${tempIcon} │ ${humIcon} │ ${statusTag.padEnd(46)} │`)
  }

  console.log('└────────────┴─────────────┴─────────────┴─────────────┴────────────────────────────────────┘')
}

function printShadeMeshTable(evaluations: DayEvaluation[]) {
  const validLightDays = evaluations.filter((e) => e.isValidLight || e.dayLight.filterPct !== null)

  console.log(`\n${colors.bold}☀️  1. FILTRADO DE ILUMINANCIA Y COMPORTAMIENTO DE MALLA-SOMBRA:${colors.reset}`)
  console.log('┌────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────┐')
  console.log('│            │      Amanecer (6h-8h)       │    Fotoperíodo (8h-16h)     │      Atardecer (16h-18h)    │   DLI Fotosintético │')
  console.log('│   Fecha    ├───────┬───────┬──────┬──────┼───────┬───────┬──────┬──────┼───────┬───────┬──────┬──────┼──────┬──────┬───────┤')
  console.log('│            │  Ext  │  Int  │ Filt │ Trans│  Ext  │  Int  │ Filt │ Trans│  Ext  │  Int  │ Filt │ Trans│ Ext  │ Int  │ Filt% │')
  console.log('├────────────┼───────┼───────┼──────┼──────┼───────┼───────┼──────┼──────┼───────┼───────┼──────┼──────┼──────┼──────┼───────┤')

  for (const ev of validLightDays) {
    const extDawn = formatValue(ev.dawn.exteriorLux ? Math.round(ev.dawn.exteriorLux) : null, '', 5)
    const intDawn = formatValue(ev.dawn.interiorLux ? Math.round(ev.dawn.interiorLux) : null, '', 5)
    const fltDawn = formatPct(ev.dawn.filterPct)
    const trnDawn = formatPct(ev.dawn.transmitPct)

    const extDay = formatValue(ev.dayLight.exteriorLux ? Math.round(ev.dayLight.exteriorLux) : null, '', 5)
    const intDay = formatValue(ev.dayLight.interiorLux ? Math.round(ev.dayLight.interiorLux) : null, '', 5)
    const fltDay = formatPct(ev.dayLight.filterPct)
    const trnDay = formatPct(ev.dayLight.transmitPct)

    const extDusk = formatValue(ev.dusk.exteriorLux ? Math.round(ev.dusk.exteriorLux) : null, '', 5)
    const intDusk = formatValue(ev.dusk.interiorLux ? Math.round(ev.dusk.interiorLux) : null, '', 5)
    const fltDusk = formatPct(ev.dusk.filterPct)
    const trnDusk = formatPct(ev.dusk.transmitPct)

    const extDli = formatValue(ev.dli.exterior, '', 4)
    const intDli = formatValue(ev.dli.interior, '', 4)
    const fltDli = formatPct(ev.dli.retentionPct)

    console.log(
      `│ ${ev.date} │ ${extDawn} │ ${intDawn} │${fltDawn}│${trnDawn}│ ${extDay} │ ${intDay} │${fltDay}│${trnDay}│ ${extDusk} │ ${intDusk} │${fltDusk}│${trnDusk}│ ${extDli} │ ${intDli} │${fltDli} │`,
    )
  }

  console.log('└────────────┴───────┴───────┴──────┴──────┴───────┴───────┴──────┴──────┴───────┴───────┴──────┴──────┴──────┴──────┴───────┘')
}

function printThermalVentilationTable(evaluations: DayEvaluation[]) {
  const validTempDays = evaluations.filter((e) => e.isValidTemp || e.tempDay.delta !== null)

  console.log(`\n${colors.bold}🌡️  2. DIFERENCIAL TÉRMICO Y VENTILACIÓN NATURAL (Efectividad del Orquideario):${colors.reset}`)
  console.log(`  ${colors.dim}Nota: ΔT = Interior - Exterior. Valores negativos en el día indican amortiguamiento del calor.${colors.reset}`)
  console.log('┌────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────┐')
  console.log('│   Fecha    │         Global 24h          │       Diurno (8h-16h)       │      Nocturno (19h-5h)      │  DIF Térmico (D-N)  │')
  console.log('│            ├───────┬───────┬─────────────┼───────┬───────┬─────────────┼───────┬───────┬─────────────┼──────┬──────┬───────┤')
  console.log('│            │  Ext  │  Int  │  ΔT Global  │  Ext  │  Int  │   ΔT Día    │  Ext  │  Int  │   ΔT Noche  │ Ext  │ Int  │ Dif Δ │')
  console.log('├────────────┼───────┼───────┼─────────────┼───────┼───────┼─────────────┼───────┼───────┼─────────────┼──────┼──────┼───────┤')

  for (const ev of validTempDays) {
    const extGlob = formatValue(ev.tempGlobal.exterior, '°C', 5)
    const intGlob = formatValue(ev.tempGlobal.interior, '°C', 5)
    const dltGlob = formatDelta(ev.tempGlobal.delta, '°C', false)

    const extDay = formatValue(ev.tempDay.exterior, '°C', 5)
    const intDay = formatValue(ev.tempDay.interior, '°C', 5)
    const dltDay = formatDelta(ev.tempDay.delta, '°C', false)

    const extNit = formatValue(ev.tempNight.exterior, '°C', 5)
    const intNit = formatValue(ev.tempNight.interior, '°C', 5)
    const dltNit = formatDelta(ev.tempNight.delta, '°C', false)

    const extDif = formatValue(ev.dif.exterior, '°', 4)
    const intDif = formatValue(ev.dif.interior, '°', 4)
    const dltDif = formatDelta(ev.dif.diff, '°', false)

    console.log(
      `│ ${ev.date} │ ${extGlob} │ ${intGlob} │   ${dltGlob}   │ ${extDay} │ ${intDay} │   ${dltDay}   │ ${extNit} │ ${intNit} │   ${dltNit}   │ ${extDif} │ ${intDif} │${dltDif}│`,
    )
  }

  console.log('└────────────┴───────┴───────┴─────────────┴───────┴───────┴─────────────┴───────┴───────┴─────────────┴──────┴──────┴───────┘')
}

function printHumidityAndVpdTable(evaluations: DayEvaluation[]) {
  const validHumDays = evaluations.filter((e) => e.isValidHum || e.humDay.delta !== null)

  console.log(`\n${colors.bold}💧 3. CONSERVACIÓN DE HUMEDAD Y DÉFICIT DE PRESIÓN DE VAPOR (VPD):${colors.reset}`)
  console.log(`  ${colors.dim}Nota: ΔHR = Interior - Exterior. Valores positivos en el día indican retención hídrica efectiva.${colors.reset}`)
  console.log('┌────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────┐')
  console.log('│   Fecha    │       HR Global (24h)       │      HR Diurna (8h-16h)     │     HR Nocturna (19h-5h)    │   VPD Diurno (kPa)  │')
  console.log('│            ├───────┬───────┬─────────────┼───────┬───────┬─────────────┼───────┬───────┬─────────────┼──────┬──────┬───────┤')
  console.log('│            │  Ext  │  Int  │  ΔHR Global │  Ext  │  Int  │   ΔHR Día   │  Ext  │  Int  │  ΔHR Noche  │ Ext  │ Int  │ Δ VPD │')
  console.log('├────────────┼───────┼───────┼─────────────┼───────┼───────┼─────────────┼───────┼───────┼─────────────┼──────┼──────┼───────┤')

  for (const ev of validHumDays) {
    const extGlob = formatValue(ev.humGlobal.exterior, '%', 5)
    const intGlob = formatValue(ev.humGlobal.interior, '%', 5)
    const dltGlob = formatDelta(ev.humGlobal.delta, '%', true)

    const extDay = formatValue(ev.humDay.exterior, '%', 5)
    const intDay = formatValue(ev.humDay.interior, '%', 5)
    const dltDay = formatDelta(ev.humDay.delta, '%', true)

    const extNit = formatValue(ev.humNight.exterior, '%', 5)
    const intNit = formatValue(ev.humNight.interior, '%', 5)
    const dltNit = formatDelta(ev.humNight.delta, '%', true)

    const extVpd = formatValue(ev.vpd.exterior, '', 4)
    const intVpd = formatValue(ev.vpd.interior, '', 4)
    const dltVpd = formatDelta(ev.vpd.delta, '', false)

    console.log(
      `│ ${ev.date} │ ${extGlob} │ ${intGlob} │   ${dltGlob}   │ ${extDay} │ ${intDay} │   ${dltDay}   │ ${extNit} │ ${intNit} │   ${dltNit}   │ ${extVpd} │ ${intVpd} │${dltVpd}│`,
    )
  }

  console.log('└────────────┴───────┴───────┴─────────────┴───────┴───────┴─────────────┴───────┴───────┴─────────────┴──────┴──────┴───────┘')
}

function printAgronomicConclusions(stats: AggregateStats) {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}               DICTAMEN AGRONÓMICO Y CONCLUSIONES TÉCNICAS                        ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════════${colors.reset}`)

  console.log(`\n  ${colors.bold}1. Comportamiento de la Malla-Sombra:${colors.reset}`)
  if (stats.avgFilterDay !== null) {
    const dayFilter = stats.avgFilterDay
    const dayTransmit = round(100 - dayFilter, 1)
    console.log(
      `     • ${colors.bold}Filtrado Promedio en Fotoperíodo:${colors.reset} ${colors.green}${dayFilter}%${colors.reset} (Transmisión: ${dayTransmit}%)`,
    )
    console.log(
      `     • Amanecer: ${stats.avgFilterDawn ?? '--'}% | Atardecer: ${stats.avgFilterDusk ?? '--'}% | Integral DLI: ${stats.avgFilterDli ?? '--'}%`,
    )
    if (dayFilter >= 65 && dayFilter <= 80) {
      console.log(`     • ${colors.green}✔ Excelente coincidencia con mallas sombra tipo 70% recomendadas para Cattleya y orquídeas tropicales.${colors.reset}`)
    } else if (dayFilter < 50) {
      console.log(`     • ${colors.yellow}⚠ Malla ligera o con alta transmitancia lumínica (<50%). Vigilar posible estrés térmico en hojas.${colors.reset}`)
    } else {
      console.log(`     • ${colors.blue}ℹ Malla de alta densidad (>80%). Monitorear que el DLI acumulado no descienda de 10 mol/m²/d.${colors.reset}`)
    }
  } else {
    console.log(`     • ${colors.dim}Datos insuficientes para determinar el filtrado medio de la malla.${colors.reset}`)
  }

  console.log(`\n  ${colors.bold}2. Ventilación Natural y Disipación de Calor:${colors.reset}`)
  if (stats.avgDeltaTempDay !== null) {
    const deltaDay = stats.avgDeltaTempDay
    const deltaDayFormatted = deltaDay > 0 ? `+${deltaDay}°C` : `${deltaDay}°C`
    console.log(
      `     • ${colors.bold}Diferencial Térmico Diurno (Int - Ext):${colors.reset} ${deltaDay <= 0 ? colors.green : colors.yellow}${deltaDayFormatted}${colors.reset}`,
    )
    if (deltaDay <= 0) {
      console.log(
        `     • ${colors.green}✔ Ventilación natural ÓPTIMA: El orquideario no acumula efecto invernadero y se mantiene más fresco o igual al exterior.${colors.reset}`,
      )
    } else if (deltaDay <= 2.0) {
      console.log(
        `     • ${colors.yellow}✔ Ventilación ADECUADA: Elevación térmica controlada (+${deltaDay}°C respecto al exterior). La circulación de aire es funcional.${colors.reset}`,
      )
    } else {
      console.log(
        `     • ${colors.red}⚠ Sobrecalentamiento significativo (+${deltaDay}°C). Se sugiere optimizar aperturas cenitales o laterales.${colors.reset}`,
      )
    }

    if (stats.avgInteriorDif !== null) {
      const dif = stats.avgInteriorDif
      console.log(
        `     • ${colors.bold}DIF Térmico Interior (Día - Noche):${colors.reset} ${dif >= 5 && dif <= 9 ? colors.green : colors.yellow}${dif}°C${colors.reset} (Exterior: ${stats.avgExteriorDif ?? '--'}°C)`,
      )
      if (dif >= 5 && dif <= 9) {
        console.log(`     • ${colors.green}✔ Rango DIF IDEAL para inducción floral en Cattleya (5°C - 8°C).${colors.reset}`)
      }
    }
  } else {
    console.log(`     • ${colors.dim}Datos insuficientes para evaluar ventilación térmica.${colors.reset}`)
  }

  console.log(`\n  ${colors.bold}3. Retención de Humedad y Microclima (VPD):${colors.reset}`)
  if (stats.avgDeltaHumDay !== null && stats.avgInteriorVpd !== null) {
    const deltaHum = stats.avgDeltaHumDay
    const sign = deltaHum > 0 ? `+${deltaHum}%` : `${deltaHum}%`
    console.log(
      `     • ${colors.bold}Conservación de Humedad Diurna (Int - Ext):${colors.reset} ${deltaHum >= 0 ? colors.green : colors.yellow}${sign}${colors.reset}`,
    )
    console.log(
      `     • ${colors.bold}VPD Diurno Interior:${colors.reset} ${stats.avgInteriorVpd >= 0.8 && stats.avgInteriorVpd <= 1.2 ? colors.green : colors.yellow}${stats.avgInteriorVpd} kPa${colors.reset} (Exterior: ${stats.avgExteriorVpd ?? '--'} kPa)`,
    )

    if (deltaHum >= 3) {
      console.log(
        `     • ${colors.green}✔ Efecto buffer hídrico CONFIRMADO: El orquideario amortigua la sequedad diurna manteniendo mayor humedad que el exterior.${colors.reset}`,
      )
    } else if (deltaHum >= -3) {
      console.log(
        `     • ${colors.blue}ℹ Equilibrio hídrico: La humedad interior acompaña los ciclos exteriores con buena aireación.${colors.reset}`,
      )
    }

    if (stats.avgInteriorVpd >= 0.7 && stats.avgInteriorVpd <= 1.3) {
      console.log(`     • ${colors.green}✔ El VPD interior se encuentra en la ventana botánica óptima de transpiración para orquídeas.${colors.reset}`)
    }
  } else {
    console.log(`     • ${colors.dim}Datos insuficientes para diagnosticar conservación hídrica.${colors.reset}`)
  }

  console.log(`\n${colors.dim}──────────────────────────────────────────────────────────────────────────────────${colors.reset}`)
}

// ── Ejecución Principal ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  let daysLimit: number | undefined
  let fromDate: Date | undefined
  let toDate: Date | undefined
  let asJson = false
  let includeCorrupt = false

  for (const arg of args) {
    if (arg.startsWith('--days=')) {
      daysLimit = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--from=')) {
      fromDate = new Date(`${arg.split('=')[1]}T04:00:00.000Z`)
    } else if (arg.startsWith('--to=')) {
      toDate = new Date(`${arg.split('=')[1]}T23:59:59.999Z`)
    } else if (arg === '--json') {
      asJson = true
    } else if (arg === '--include-corrupt') {
      includeCorrupt = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/compare-microclimates.ts [opciones]

Opciones:
  --days=N             Limitar evaluación a los últimos N días
  --from=YYYY-MM-DD    Fecha inicial en formato ISO (ej: 2026-06-01)
  --to=YYYY-MM-DD      Fecha final en formato ISO (ej: 2026-07-01)
  --include-corrupt    Incluye días con fallas documentadas (10-17 Ago 2026, excluidos por defecto)
  --json               Emite únicamente la salida final en formato JSON estructurado
  --help               Muestra este mensaje de ayuda
`)
      return
    }
  }

  // Si se especificó --days, calcular fecha desde
  if (daysLimit && !fromDate) {
    const today = getCaracasMidnight(new Date())
    fromDate = new Date(today.getTime() - daysLimit * 24 * 60 * 60 * 1000)
  }

  if (!asJson) {
    printHeader(
      daysLimit ?? 0,
      fromDate ? fromDate.toISOString().split('T')[0] : undefined,
      toDate ? toDate.toISOString().split('T')[0] : undefined,
      includeCorrupt,
    )
  }

  // Consultar PostgreSQL (fuente canónica oficial con métricas auditadas)
  const daysMap = await fetchStatsFromPostgres(fromDate, toDate)

  if (daysMap.size === 0) {
    if (!asJson) {
      Logger.warn(
        'No se encontraron registros en la tabla DailyEnvironmentStat para el rango seleccionado.',
      )
      console.log(
        `\n${colors.yellow}💡 Sugerencia:${colors.reset} Ejecute el script de backfill histórico para calcular las métricas desde InfluxDB:\n` +
          `   pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/backfill-history.ts\n`,
      )
    } else {
      console.log(JSON.stringify({ error: 'No data found' }))
    }
    return
  }

  const evaluations: DayEvaluation[] = []

  for (const [dateStr, pair] of daysMap.entries()) {
    evaluations.push(evaluateDayFromStats(dateStr, pair.exterior, pair.interior, includeCorrupt))
  }

  // Ordenar por fecha cronológica ascendente
  evaluations.sort((a, b) => a.date.localeCompare(b.date))

  const stats = computeAggregateStats(evaluations)

  if (asJson) {
    console.log(JSON.stringify({ evaluations, aggregate: stats }, null, 2))
    return
  }

  // Imprimir vistas especializadas
  printInventoryTable(evaluations)
  printShadeMeshTable(evaluations)
  printThermalVentilationTable(evaluations)
  printHumidityAndVpdTable(evaluations)
  printAgronomicConclusions(stats)
}

main()
  .catch((err) => {
    Logger.error('Error durante la ejecución del comparador microclimático:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await influxClient.close()
  })

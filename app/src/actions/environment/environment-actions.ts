'use server'

import { getSensorDataInternal, getRainSummaryInternal } from '@/lib/server/environment'
import { ZoneType } from '@/config/mappings'

/**
 * Obtiene el historial de sensores ambiental desde PostgreSQL (agregado) e InfluxDB (tiempo real).
 * @param range Rango de tiempo (1h, 12h, 24h, 7d, 30d, all)
 * @param zone Zona de los sensores
 * @param metric Opcional: métrica específica a filtrar
 */
export async function getSensorData(
  range: string,
  zone: ZoneType,
  metric?: string | null,
): Promise<{
  success: boolean
  data?: Record<string, unknown>[]
  liveKPIs?: {
    dli: number | null
    vpdAvg: number | null
    dif: number | null
    isLive: boolean
  } | null
  lastRainState?: { state: string; timestamp: number } | null
  error?: string
}> {
  try {
    const result = await getSensorDataInternal(range, zone, metric)
    const data = Array.isArray(result) ? result : result.data
    const liveKPIs = Array.isArray(result) ? null : result.liveKPIs
    const lastRainState = Array.isArray(result) ? null : result.lastRainState

    return { success: true, data, liveKPIs, lastRainState }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    return { success: false, error: message }
  }
}

/**
 * Obtiene eventos de lluvia recientes.
 */
export async function getRainData(range: string = '12h', zone: ZoneType = ZoneType.EXTERIOR) {
  try {
    const data = await getRainSummaryInternal(range, zone)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

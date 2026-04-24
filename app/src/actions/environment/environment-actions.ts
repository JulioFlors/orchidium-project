'use server'

import { getSensorHistoryInternal } from '@/lib/server'

/**
 * Obtiene el historial de sensores ambiental desde PostgreSQL (agregado) e InfluxDB (tiempo real).
 * @param range Rango de tiempo (1h, 12h, 24h, 7d, 30d, all)
 * @param zone Zona de los sensores
 * @param metric Opcional: métrica específica a filtrar
 */
export async function getSensorHistory(
  range: string,
  zone: string,
  metric?: string | null,
): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
  try {
    const data = await getSensorHistoryInternal(range, zone, metric)

    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    return { success: false, error: message }
  }
}

/**
 * Obtiene eventos de lluvia recientes.
 */
export async function getRainHistory(zone: string = 'EXTERIOR') {
  // Por ahora, esto podría delegarse también a environment.ts si crece,
  // pero lo mantenemos simple llamando al motor interno si es necesario.
  // En este caso, reutilizamos la lógica de history filtrando por rain_intensity.
  try {
    const data = await getSensorHistoryInternal('24h', zone, 'rain_intensity')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

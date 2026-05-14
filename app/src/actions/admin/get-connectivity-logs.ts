'use server'

import { prisma } from '@package/database'

import { Logger } from '@/lib'

/**
 * Obtiene los últimos registros de conectividad de los dispositivos IoT.
 * @param limit Número máximo de registros a recuperar.
 */
export async function getConnectivityLogs(limit: number = 15, deviceId?: string) {
  try {
    const logs = await prisma.deviceLog.findMany({
      where: {
        device: deviceId ? deviceId : { in: ['Actuator_Controller', 'Weather_Station_ZONA_A'] },
        // Usar filtro positivo para evitar escaneos costosos de heartbeats (ONLINE).
        // status: { in: ['OFFLINE', 'REBOOT'] },
      },
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
    })

    return {
      ok: true,
      logs,
    }
  } catch (error) {
    Logger.error('Error fetching connectivity logs:', error)

    return {
      ok: false,
      message: 'No se pudieron recuperar los logs de conectividad.',
    }
  }
}

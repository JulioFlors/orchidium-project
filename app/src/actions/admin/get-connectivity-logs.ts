'use server'

import { prisma } from '@package/database'

/**
 * Obtiene los últimos registros de conectividad de los dispositivos IoT.
 * @param limit Número máximo de registros a recuperar.
 */
export async function getConnectivityLogs(limit: number = 50) {
  try {
    const logs = await prisma.deviceLog.findMany({
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
    // eslint-disable-next-line no-console
    console.error('Error fetching connectivity logs:', error)

    return {
      ok: false,
      message: 'No se pudieron recuperar los logs de conectividad.',
    }
  }
}

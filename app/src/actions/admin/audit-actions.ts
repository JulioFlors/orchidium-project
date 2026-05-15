'use server'

import { prisma } from '@package/database'

import { Logger } from '@/lib'

/**
 * Obtiene el historial de auditoría de un dispositivo y tipo específico.
 */
export async function getAuditHistory(deviceId: string, type: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { deviceId, type },
      orderBy: { timestamp: 'asc' }, // Ascendente para que la gráfica se dibuje de izquierda a derecha
      take: 500,
    })

    return { ok: true, logs }
  } catch (error) {
    Logger.error(`Error fetching audit history for ${deviceId}/${type}:`, error)

    return { ok: false, message: 'No se pudo recuperar el historial de auditoría.' }
  }
}

/**
 * Limpia el historial de auditoría de un tipo específico (por dispositivo y tipo).
 */
export async function clearAuditHistory(deviceId: string, type: string) {
  try {
    await prisma.auditLog.deleteMany({
      where: { deviceId, type },
    })

    return { ok: true }
  } catch (error) {
    Logger.error(`Error clearing audit history for ${deviceId}/${type}:`, error)

    return { ok: false, message: 'No se pudo limpiar el historial de auditoría.' }
  }
}

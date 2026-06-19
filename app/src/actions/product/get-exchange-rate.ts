'use server'

import { prisma } from '@package/database'

/**
 * Consulta la base de datos para obtener la tasa de cambio vigente más reciente
 * para el día de hoy (hora de Caracas).
 * Filtra por fecha menor o igual al día actual a medianoche y ordena de forma descendente.
 * Retorna null si no se encuentra ninguna tasa válida o si la base de datos no está disponible.
 */
function getCaracasTodayMidnight(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date())
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  const year = parts.find((p) => p.type === 'year')?.value

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

/**
 * Consulta la base de datos para obtener la tasa de cambio vigente más reciente
 * para el día de hoy (hora de Caracas).
 * Filtra por fecha menor o igual al día actual a medianoche y ordena de forma descendente.
 * Retorna null si no se encuentra ninguna tasa válida o si la base de datos no está disponible.
 */
export async function getLatestExchangeRate(): Promise<number | null> {
  try {
    const today = getCaracasTodayMidnight()

    const latest = await prisma.exchangeRate.findFirst({
      where: {
        date: {
          lte: today,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return latest ? latest.rate : null
  } catch (error) {
    console.error('Error al consultar getLatestExchangeRate en base de datos:', error)

    return null
  }
}

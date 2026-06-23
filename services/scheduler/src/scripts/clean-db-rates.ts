import { prisma } from '@package/database'

import { Logger } from '../lib/logger'

async function main() {
  Logger.info('Iniciando limpieza de la tabla ExchangeRate...', '🧹')
  try {
    const deleted = await prisma.exchangeRate.deleteMany()

    Logger.success(
      `Se eliminaron correctamente ${deleted.count} registros de la tabla ExchangeRate.`,
    )
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)

    Logger.error(`Error al limpiar la tabla ExchangeRate: ${errMsg}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()

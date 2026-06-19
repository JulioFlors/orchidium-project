import { prisma } from '@package/database'

async function main() {
  console.log('Consultando registros de la tabla ExchangeRate...')
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { date: 'asc' },
    })

    console.log(`Se encontraron ${rates.length} registros:`)
    rates.forEach((r) => {
      console.log(
        `- ID: ${r.id} | Fecha: ${r.date.toISOString()} | Tasa: ${r.rate} | Moneda: ${r.currency} | Creado: ${r.createdAt.toISOString()}`,
      )
    })
  } catch (err) {
    console.error('Error al consultar ExchangeRate:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

import { prisma } from '@package/database'

async function main() {
  console.log('Querying all virtual rain events in Postgres for July 9, 2026...')
  const events = await prisma.rainEvent.findMany({
    where: {
      isInfered: true,
      startedAt: {
        gte: new Date('2026-07-09T00:00:00Z'),
        lte: new Date('2026-07-10T23:59:59Z'),
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  console.log(`Found ${events.length} virtual events:`)
  for (const e of events) {
    console.log(
      `- ID: ${e.id} | Start: ${e.startedAt.toLocaleString('es-VE', { timeZone: 'America/Caracas' })} | End: ${e.endedAt?.toLocaleString('es-VE', { timeZone: 'America/Caracas' }) || 'OPEN'} | Type: ${e.triggerType} | Reason: ${e.triggerReason}`
    )
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

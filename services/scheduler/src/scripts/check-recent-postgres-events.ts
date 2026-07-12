import { prisma } from '@package/database'

async function main() {
  console.log('Querying Postgres for recent RainEvent records...')
  const events = await prisma.rainEvent.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  })

  for (const e of events) {
    console.log(`ID: ${e.id} | Start: ${e.startedAt.toLocaleString('es-VE')} | End: ${e.endedAt?.toLocaleString('es-VE') ?? 'OPEN'} | Virtual: ${e.isInfered} | Type: ${e.triggerType} | Reason: ${e.triggerReason} | ClosedBy: ${e.closedBy}`)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

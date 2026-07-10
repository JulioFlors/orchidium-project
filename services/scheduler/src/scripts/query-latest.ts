import { prisma } from '@package/database'

async function main() {
  console.log('Querying latest inferred rain events in DB (no cutoff)...')
  const events = await prisma.rainEvent.findMany({
    where: { isInfered: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  })

  console.log(`Latest 10 inferred events in database:`)
  for (const ev of events) {
    const localStart = new Date(ev.startedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
    const localEnd = ev.endedAt ? new Date(ev.endedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' }) : 'In progress'
    console.log(`- ID: ${ev.id.substring(0, 8)} | Start: ${localStart} | End: ${localEnd} | Type: ${ev.triggerType}`)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

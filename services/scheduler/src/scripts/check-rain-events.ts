import { prisma } from '@package/database'

async function main() {
  console.log('Querying latest RainEvents in Postgres...')
  try {
    const events = await prisma.rainEvent.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    })

    console.log('Latest 10 RainEvents:')
    console.log(JSON.stringify(events, null, 2))
  } catch (err) {
    console.error('Error fetching RainEvents:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

import { prisma } from '@package/database'

async function main() {
  console.log('Sanitizing corrupt RainEvents in Postgres...')
  try {
    const corruptEvents = await prisma.rainEvent.findMany({
      where: {
        startedAt: {
          lt: new Date('2025-01-01T00:00:00Z'),
        },
      },
    })

    console.log(`Found ${corruptEvents.length} corrupt events.`)

    for (const event of corruptEvents) {
      console.log(`Fixing event ${event.id}: startedAt = ${event.startedAt.toISOString()}`)

      const newStartedAt = new Date(event.startedAt)

      newStartedAt.setFullYear(newStartedAt.getFullYear() + 30)

      const newEndedAt = event.endedAt ? new Date(event.endedAt) : null

      if (newEndedAt && newEndedAt.getFullYear() < 2025) {
        newEndedAt.setFullYear(newEndedAt.getFullYear() + 30)
      }

      let durationSeconds = event.durationSeconds

      if (newEndedAt) {
        durationSeconds = Math.round((newEndedAt.getTime() - newStartedAt.getTime()) / 1000)
      }

      const updated = await prisma.rainEvent.update({
        where: { id: event.id },
        data: {
          startedAt: newStartedAt,
          endedAt: newEndedAt,
          durationSeconds,
        },
      })

      console.log(`Updated event ${updated.id}:`)
      console.log(`  startedAt: ${updated.startedAt.toISOString()}`)
      console.log(`  endedAt:   ${updated.endedAt ? updated.endedAt.toISOString() : 'null'}`)
      console.log(`  duration:  ${updated.durationSeconds}s`)
    }
  } catch (err) {
    console.error('Error during sanitization:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

import * as fs from 'fs'

import { prisma } from '@package/database'

async function main() {
  console.log('Querying all inferred rain events before the thresholds change...')
  const events = await prisma.rainEvent.findMany({
    where: { isInfered: true },
    orderBy: { startedAt: 'asc' },
  })

  console.log(`Found ${events.length} inferred events.`)

  const data = events.map((ev) => ({
    id: ev.id,
    startedAt: ev.startedAt.toISOString(),
    endedAt: ev.endedAt ? ev.endedAt.toISOString() : null,
    durationSeconds: ev.durationSeconds,
    triggerType: ev.triggerType,
    triggerReason: ev.triggerReason,
    triggerTempDrop: ev.triggerTempDrop,
    triggerHumRise: ev.triggerHumRise,
    triggerLuxDropPct: ev.triggerLuxDropPct,
    closeType: ev.closeType,
    closeReason: ev.closeReason,
    closedBy: ev.closedBy,
  }))

  const targetPath =
    'C:\\Users\\Julio\\.gemini\\antigravity\\brain\\087a6557-ed4b-44aa-aac9-3a1c185d9ae4\\scratch\\events_before.json'

  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2))
  console.log(`Saved baseline to ${targetPath}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

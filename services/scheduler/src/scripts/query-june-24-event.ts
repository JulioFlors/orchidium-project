import { prisma } from '@package/database'

async function main() {
  const event = await prisma.rainEvent.findFirst({
    where: {
      isInfered: true,
      startedAt: {
        gte: new Date('2026-06-24T14:50:00.000Z'),
        lte: new Date('2026-06-24T15:10:00.000Z'),
      },
    },
  })

  console.log('--- EVENTO VIRTUAL DEL 24 DE JUNIO EN POSTGRES ---')
  if (event) {
    console.log(`ID: ${event.id}`)
    console.log(`Inicio: ${event.startedAt.toISOString()}`)
    console.log(`Cese: ${event.endedAt?.toISOString()}`)
    console.log(`Trigger Reason: ${event.triggerReason}`)
    console.log(`Close Reason: ${event.closeReason}`)
    console.log(`BaselineTemp: ${event.baselineTemp} | BaselineHum: ${event.baselineHum} | BaselineLux: ${event.baselineLux}`)
    console.log(`StartTemp: ${event.startTemp} | StartHum: ${event.startHum} | StartLux: ${event.startLux}`)
  } else {
    console.log('No se encontró el evento.')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

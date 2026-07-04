import { prisma } from '@package/database'

async function main() {
  const events = await prisma.rainEvent.findMany({
    where: {
      startedAt: {
        gte: new Date('2026-07-03T00:00:00.000Z'),
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  })

  console.log('--- EVENTOS DE HOY 3 DE JULIO EN POSTGRES ---')
  if (events.length > 0) {
    for (const e of events) {
      console.log(`ID: ${e.id} | Tipo: ${e.isInfered ? 'Inferido' : 'Físico'}`)
      console.log(`Inicio: ${e.startedAt.toISOString()} | Fin: ${e.endedAt?.toISOString()}`)
      console.log(`Trigger Reason: ${e.triggerReason}`)
      console.log(`Close Reason: ${e.closeReason}`)
      console.log('-------------------------------------------------')
    }
  } else {
    console.log('No hay eventos de lluvia hoy.')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

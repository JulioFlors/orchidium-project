import { prisma } from '@package/database'

function toCaracasStr(date: Date | null): string {
  if (!date) return 'N/A'

  return date.toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

async function main() {
  const events = await prisma.rainEvent.findMany({
    where: {
      startedAt: {
        gte: new Date('2026-07-05T04:00:00.000Z'), // 5 de Julio 00:00 Caracas
        lte: new Date('2026-07-06T04:00:00.000Z'), // 6 de Julio 00:00 Caracas
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  })

  console.log(`\n======================================================`)
  console.log(`  EVENTOS DE LLUVIA POSTGRES - DOMINGO 5 DE JULIO`)
  console.log(`======================================================\n`)

  for (const e of events) {
    const isVirtual = e.inferred

    console.log(`[${isVirtual ? 'VIRTUAL' : 'FÍSICO'}] ID: ${e.id}`)
    console.log(`Inicio: ${toCaracasStr(e.startedAt)}`)
    console.log(`Fin:    ${toCaracasStr(e.endedAt)}`)
    console.log(`Trigger Type:   ${e.triggerType}`)
    console.log(`Trigger Detail: ${e.triggerReason}`)
    console.log(`Close Type:     ${e.closeType}`)
    console.log(`Close Detail:   ${e.closeReason}`)
    console.log(`------------------------------------------------------\n`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

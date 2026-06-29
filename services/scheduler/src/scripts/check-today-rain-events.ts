import { prisma } from '@package/database'

async function main() {
  console.log('Buscando eventos de lluvia inferidos del 29 de junio de 2026...')
  const events = await prisma.rainEvent.findMany({
    where: {
      isInfered: true,
      startedAt: {
        gte: new Date('2026-06-29T00:00:00Z'),
        lte: new Date('2026-06-29T23:59:59Z'),
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  for (const ev of events) {
    const localStart = new Date(ev.startedAt).toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })
    const localEnd = ev.endedAt ? new Date(ev.endedAt).toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' }) : 'Activo'
    const duration = ev.durationSeconds ? Math.round(ev.durationSeconds / 60) : 0
    console.log(`- [${localStart} - ${localEnd}] (${duration}m)`)
    console.log(`  Inicio: ${ev.triggerReason}`)
    console.log(`  Cierre: ${ev.closeReason}`)
    console.log(`  Cerrado por: ${ev.closedBy}`)
    console.log('----------------------------------------------------')
  }
}

main().catch(console.error)

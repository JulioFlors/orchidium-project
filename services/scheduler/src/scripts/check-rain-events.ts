import { prisma } from '@package/database'

async function main() {
  const events = await prisma.rainEvent.findMany({
    where: {
      startedAt: {
        gte: new Date('2026-06-01T00:00:00Z'),
        lt: new Date('2026-06-10T00:00:00Z'),
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  console.log('=== TODOS LOS EVENTOS DE LLUVIA DEL 01/06 al 09/06 ===')
  for (const e of events) {
    const isV = e.isVirtual

    console.log(
      `ID: ${e.id.slice(0, 8)} | Inicio: ${e.startedAt.toISOString()} | Fin: ${e.endedAt ? e.endedAt.toISOString() : 'ABIERTO'} | Duracion: ${e.durationSeconds}s (${e.durationSeconds ? Math.round(e.durationSeconds / 60) : 0} min) | ClosedBy: ${e.closedBy} | isVirtual: ${isV}`,
    )
  }
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect())

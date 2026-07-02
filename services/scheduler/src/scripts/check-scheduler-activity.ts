import { prisma } from '@package/database'

async function main() {
  const targetTime = new Date()
  targetTime.setDate(targetTime.getDate() - 3) // Últimos 3 días

  console.log(`Consultando actividad del planificador en Postgres desde ${targetTime.toISOString()}...`)

  const taskLogs = await prisma.taskEventLog.findMany({
    where: {
      timestamp: {
        gte: targetTime
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 50
  })

  console.log(`Se encontraron ${taskLogs.length} logs de tareas:`)
  for (const log of taskLogs) {
    console.log(
      `[${log.timestamp.toISOString()}] Task ID: ${log.taskId} | Status: ${log.status} | Notes: ${log.notes ?? 'N/A'}`
    )
  }

  // Consultar también la tabla de configuraciones o estado de lluvia
  const rainEvents = await prisma.rainEvent.findMany({
    where: {
      startedAt: {
        gte: targetTime
      }
    },
    orderBy: { startedAt: 'desc' }
  })

  console.log(`\nSe encontraron ${rainEvents.length} eventos de lluvia en Postgres:`)
  for (const e of rainEvents) {
    console.log(
      `ID: ${e.id.slice(0, 8)} | Inicio: ${e.startedAt.toISOString()} | Fin: ${e.endedAt?.toISOString()} | Cierre: ${e.closedBy} | Inferido: ${e.isInfered}`
    )
  }
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect())

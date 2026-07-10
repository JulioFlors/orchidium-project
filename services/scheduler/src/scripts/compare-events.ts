import { prisma } from '@package/database'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('Comparing rain events before and after threshold optimization...')

  const beforeJsonPath = 'C:\\Users\\Julio\\.gemini\\antigravity\\brain\\087a6557-ed4b-44aa-aac9-3a1c185d9ae4\\scratch\\events_before.json'
  if (!fs.existsSync(beforeJsonPath)) {
    console.error(`Baseline file not found at ${beforeJsonPath}`)
    process.exit(1)
  }

  const beforeEvents: any[] = JSON.parse(fs.readFileSync(beforeJsonPath, 'utf8'))
  const afterEvents = await prisma.rainEvent.findMany({
    where: { isInfered: true },
    orderBy: { startedAt: 'asc' },
  })

  console.log(`Baseline (Before): ${beforeEvents.length} events`)
  console.log(`Optimized (After): ${afterEvents.length} events`)

  const reportLines: string[] = []
  reportLines.push('# Reporte de Simulación y Comparación de Eventos')
  reportLines.push('')
  reportLines.push(`*   **Eventos antes del cambio (Base):** ${beforeEvents.length}`)
  reportLines.push(`*   **Eventos después del cambio (Optimizado):** ${afterEvents.length}`)
  reportLines.push(`*   **Eventos eliminados/filtrados (Reducción de ruido):** ${beforeEvents.length - afterEvents.length} (${((1 - afterEvents.length / beforeEvents.length) * 100).toFixed(1)}% de reducción)`)
  reportLines.push('')

  reportLines.push('## 1. Eventos Eliminados/Filtrados (Garúas leves y Falsos Positivos)')
  reportLines.push('')
  reportLines.push('| ID Anterior | Fecha (Caracas) | Tipo Anterior | Razón / Deltas Anteriores |')
  reportLines.push('| :--- | :--- | :--- | :--- |')

  let deletedCount = 0
  const afterMatchedIds = new Set<string>()

  for (const bef of beforeEvents) {
    // Buscar si existe un evento en el nuevo set que empiece dentro de +/- 30 minutos de este evento
    const befStart = new Date(bef.startedAt).getTime()
    const match = afterEvents.find(aft => {
      const aftStart = aft.startedAt.getTime()
      return Math.abs(aftStart - befStart) <= 30 * 60 * 1000
    })

    if (!match) {
      deletedCount++
      const localDateStr = new Date(bef.startedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
      reportLines.push(`| \`${bef.id.substring(0, 8)}\` | ${localDateStr} | \`${bef.triggerType}\` | ${bef.triggerReason} |`)
    } else {
      afterMatchedIds.add(match.id)
    }
  }

  if (deletedCount === 0) {
    reportLines.push('| (Ninguno) | - | - | - |')
  }

  reportLines.push('')
  reportLines.push('## 2. Eventos Modificados / Desplazados (Lluvia Real con Retraso por Sensibilidad)')
  reportLines.push('')
  reportLines.push('| ID Anterior | Fecha Base (Caracas) | Nueva Fecha (Caracas) | Desplazamiento | Tipo Base | Tipo Nuevo |')
  reportLines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')

  let shiftedCount = 0
  for (const bef of beforeEvents) {
    const befStart = new Date(bef.startedAt).getTime()
    const match = afterEvents.find(aft => {
      const aftStart = aft.startedAt.getTime()
      return Math.abs(aftStart - befStart) <= 30 * 60 * 1000
    })

    if (match) {
      const diffMs = match.startedAt.getTime() - befStart
      const diffMin = Math.round(diffMs / 60000)

      if (diffMin !== 0) {
        shiftedCount++
        const localBefStr = new Date(bef.startedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
        const localAftStr = match.startedAt.toLocaleString('es-VE', { timeZone: 'America/Caracas' })
        const shiftStr = diffMin > 0 ? `+${diffMin} min (Retraso)` : `${diffMin} min (Adelanto)`
        reportLines.push(`| \`${bef.id.substring(0, 8)}\` | ${localBefStr} | ${localAftStr} | **${shiftStr}** | \`${bef.triggerType}\` | \`${match.triggerType}\` |`)
      }
    }
  }

  if (shiftedCount === 0) {
    reportLines.push('| (Ninguno) | - | - | - | - | - |')
  }

  reportLines.push('')
  reportLines.push('## 3. Nuevos Eventos Creados (Si aplica)')
  reportLines.push('')
  reportLines.push('| ID Nuevo | Fecha (Caracas) | Tipo Nuevo | Razón / Deltas |')
  reportLines.push('| :--- | :--- | :--- | :--- |')

  let newCount = 0
  for (const aft of afterEvents) {
    if (!afterMatchedIds.has(aft.id)) {
      newCount++
      const localDateStr = aft.startedAt.toLocaleString('es-VE', { timeZone: 'America/Caracas' })
      reportLines.push(`| \`${aft.id.substring(0, 8)}\` | ${localDateStr} | \`${aft.triggerType}\` | ${aft.triggerReason} |`)
    }
  }

  if (newCount === 0) {
    reportLines.push('| (Ninguno) | - | - | - |')
  }

  const reportPath = 'C:\\Users\\Julio\\.gemini\\antigravity\\brain\\087a6557-ed4b-44aa-aac9-3a1c185d9ae4\\simulation_results.md'
  fs.writeFileSync(reportPath, reportLines.join('\n'))
  console.log(`Report generated successfully at ${reportPath}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

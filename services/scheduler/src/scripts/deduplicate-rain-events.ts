/**
 * ============================================================
 * DEDUPLICADOR: Limpieza de RainEvents duplicados en PostgreSQL
 * ============================================================
 * Identifica y elimina filas duplicadas causadas por re-ejecución
 * del script backfill-rain-events.ts.
 *
 * Criterio de duplicado: mismo (startedAt, zone).
 * Criterio de conservación: se conserva el registro con mayor
 * avgIntensity (el más completo). Si son iguales, se conserva el
 * de menor id (el más antiguo/original).
 *
 * Por defecto corre en DRY_RUN=true (solo reporta, no borra).
 * Para borrar: DEDUPLICATE_DRY_RUN=false
 *
 * CÓMO EJECUTAR:
 * ```powershell
 * # Ver conteo sin borrar (seguro):
 * npx dotenv-cli -e ../../.env -- pnpm tsx services/scheduler/src/scripts/deduplicate-rain-events.ts
 *
 * # Borrar duplicados (IRREVERSIBLE):
 * $env:DEDUPLICATE_DRY_RUN="false"; npx dotenv-cli -e ../../.env -- pnpm tsx services/scheduler/src/scripts/deduplicate-rain-events.ts
 * ```
 * ============================================================
 */

import { prisma } from '@package/database'

import { Logger } from '../lib/logger'

const DRY_RUN = process.env.DEDUPLICATE_DRY_RUN !== 'false'

interface DuplicateGroup {
  startedAt: Date
  zone: string
  count: number
  ids: string[]
  keepId: string
  deleteIds: string[]
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info('  DEDUPLICADOR DE RAIN EVENTS')
  if (DRY_RUN) {
    Logger.warn('  ⚠️  MODO DRY-RUN — No se borrará nada. Solo reporte.')
    Logger.warn('  Para borrar: DEDUPLICATE_DRY_RUN=false')
  } else {
    Logger.warn('  🔴 MODO REAL — Se eliminarán registros duplicados de PG')
  }
  Logger.info('════════════════════════════════════════════════════════')

  try {
    // 1. Obtener todos los eventos ordenados para detectar duplicados
    Logger.info('Cargando todos los RainEvents desde Postgres...')

    const allEvents = await prisma.rainEvent.findMany({
      orderBy: [{ startedAt: 'asc' }, { zone: 'asc' }],
      select: {
        id: true,
        startedAt: true,
        zone: true,
        avgIntensity: true,
        peakIntensity: true,
        durationSeconds: true,
        closedBy: true,
      },
    })

    Logger.info(`Total de RainEvents en DB: ${allEvents.length}`)

    // 2. Agrupar por (startedAt.toISOString(), zone)
    const groups = new Map<string, typeof allEvents>()

    for (const ev of allEvents) {
      const key = `${ev.startedAt.toISOString()}::${ev.zone}`
      const existing = groups.get(key) ?? []

      existing.push(ev)
      groups.set(key, existing)
    }

    // 3. Filtrar grupos con más de 1 elemento (duplicados)
    const duplicateGroups: DuplicateGroup[] = []

    for (const [, group] of groups) {
      if (group.length <= 1) continue

      // Conservar el de mayor avgIntensity; si empatan, el de menor id (string lex)
      const sorted = [...group].sort((a, b) => {
        const aInt = a.avgIntensity ?? 0
        const bInt = b.avgIntensity ?? 0

        if (bInt !== aInt) return bInt - aInt // mayor avgIntensity primero

        return a.id < b.id ? -1 : 1 // menor id como desempate
      })

      const keepId = sorted[0].id
      const deleteIds = sorted.slice(1).map((e) => e.id)

      duplicateGroups.push({
        startedAt: group[0].startedAt,
        zone: group[0].zone,
        count: group.length,
        ids: group.map((e) => e.id),
        keepId,
        deleteIds,
      })
    }

    // 4. Reporte de resultados
    const totalDuplicateGroups = duplicateGroups.length
    const totalToDelete = duplicateGroups.reduce((acc, g) => acc + g.deleteIds.length, 0)

    Logger.info('════════════════════════════════════════════════════════')
    Logger.info(`Grupos con duplicados: ${totalDuplicateGroups}`)
    Logger.info(`Total de filas a eliminar: ${totalToDelete}`)
    Logger.info(`Total que quedarán (únicos): ${allEvents.length - totalToDelete}`)
    Logger.info('════════════════════════════════════════════════════════')

    if (totalDuplicateGroups === 0) {
      Logger.success('No hay duplicados. La tabla está limpia.')

      return
    }

    // Mostrar los primeros 20 grupos para diagnóstico
    const preview = duplicateGroups.slice(0, 20)

    Logger.info(`Primeros ${preview.length} grupos duplicados (de ${totalDuplicateGroups}):`)

    for (const g of preview) {
      Logger.warn(
        `  [${g.zone}] ${g.startedAt.toISOString()} — ${g.count} copias → conservar: ${g.keepId.slice(0, 8)}... | borrar: ${g.deleteIds.length}`,
      )
    }

    if (totalDuplicateGroups > 20) {
      Logger.info(`  ... y ${totalDuplicateGroups - 20} grupos más.`)
    }

    // 5. Borrar (solo si no es DRY_RUN)
    if (DRY_RUN) {
      Logger.warn('════════════════════════════════════════════════════════')
      Logger.warn(`DRY-RUN completado. ${totalToDelete} filas SERÍAN eliminadas.`)
      Logger.warn('Para borrar de verdad: DEDUPLICATE_DRY_RUN=false')
      Logger.warn('════════════════════════════════════════════════════════')

      return
    }

    // Borrado real por lotes de 100 para no saturar la conexión
    Logger.info('Iniciando borrado de duplicados...')

    const allDeleteIds = duplicateGroups.flatMap((g) => g.deleteIds)
    const BATCH_SIZE = 100
    let deleted = 0

    for (let i = 0; i < allDeleteIds.length; i += BATCH_SIZE) {
      const batch = allDeleteIds.slice(i, i + BATCH_SIZE)
      const result = await prisma.rainEvent.deleteMany({
        where: { id: { in: batch } },
      })

      deleted += result.count
      Logger.info(
        `  Lote ${Math.ceil((i + 1) / BATCH_SIZE)}: eliminados ${result.count} registros (total: ${deleted}/${allDeleteIds.length})`,
      )
    }

    Logger.info('════════════════════════════════════════════════════════')
    Logger.success(`Deduplicación completada. Eliminados: ${deleted} registros.`)
    Logger.success(`Registros únicos restantes: ${allEvents.length - deleted}`)
    Logger.info('════════════════════════════════════════════════════════')
  } catch (err) {
    Logger.error('Error durante la deduplicación:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  Logger.error('Error fatal en el deduplicador:', err)
  process.exit(1)
})

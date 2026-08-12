import type { RainEvent } from '@package/database'

import fs from 'fs'
import path from 'path'

import { prisma, ZoneType } from '@package/database'

interface ObservedRain {
  id: string
  dayOfWeek: string
  startedAt: string
  endedAt: string
  description: string
}

interface ConsolidatedMatchItem {
  obs: ObservedRain
  obsDurMin: number
  matches: RainEvent[]
  note: string
}

interface ExactMatchItem {
  obs: ObservedRain
  obsDurMin: number
  match: RainEvent
  infStartStr: string
  infEndStr: string
  closeReason: string
}

interface MissedMatchItem {
  obs: ObservedRain
  obsDurMin: number
}

async function main() {
  const jsonPath = path.join(__dirname, 'resources', 'historical-observed-rain.json')
  const jsonRaw = fs.readFileSync(jsonPath, 'utf-8')
  const observedEvents: ObservedRain[] = JSON.parse(jsonRaw)

  console.log('====================================================================')
  console.log('  AUDITORÍA ANALÍTICA PROFUNDA: BITÁCORA MANUAL VS MOTOR INFERENCIAL')
  console.log('====================================================================')
  console.log(`Total de eventos observados en bitácora: ${observedEvents.length}\n`)

  const inferedEvents = await prisma.rainEvent.findMany({
    where: {
      zone: ZoneType.EXTERIOR,
      isInfered: true,
    },
    orderBy: { startedAt: 'asc' },
  })

  console.log(`Total de eventos inferidos en Postgres: ${inferedEvents.length}\n`)

  const TOLERANCE_MS = 45 * 60 * 1000 // 45 min de tolerancia para emparejar
  const matchedObservedIds = new Set<string>()

  const categoryConsolidated: ConsolidatedMatchItem[] = []
  const categoryDetectedExact: ExactMatchItem[] = []
  const categoryMissedShort: MissedMatchItem[] = [] // Garúas insignificantes (< 15 min)
  const categoryMissedSignificant: MissedMatchItem[] = [] // Lluvias de duración significativa (>= 15 min) no detectadas

  for (const obs of observedEvents) {
    const obsStart = new Date(obs.startedAt).getTime()
    const obsEnd = new Date(obs.endedAt).getTime()
    const obsDurMin = (obsEnd - obsStart) / (60 * 1000)

    // Buscar coincidencia en eventos inferidos
    const matches = inferedEvents.filter((inf) => {
      const infStart = inf.startedAt.getTime()
      const infEnd = inf.endedAt ? inf.endedAt.getTime() : infStart + 30 * 60 * 1000

      const overlaps = Math.max(
        0,
        Math.min(obsEnd + TOLERANCE_MS, infEnd + TOLERANCE_MS) -
          Math.max(obsStart - TOLERANCE_MS, infStart - TOLERANCE_MS),
      )

      return overlaps > 0
    })

    if (matches.length > 0) {
      matchedObservedIds.add(obs.id)
      const primaryMatch = matches[0]

      const infStartStr = primaryMatch.startedAt.toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Caracas',
      })
      const infEndStr = primaryMatch.endedAt
        ? primaryMatch.endedAt.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Caracas',
          })
        : 'En curso'

      if (matches.length > 1) {
        categoryConsolidated.push({
          obs,
          obsDurMin,
          matches,
          note: `Fragmentado / Emparejado en ${matches.length} eventos inferidos.`,
        })
      } else {
        categoryDetectedExact.push({
          obs,
          obsDurMin,
          match: primaryMatch,
          infStartStr,
          infEndStr,
          closeReason: primaryMatch.closeReason || 'Desconocido',
        })
      }
    } else {
      // Omitido / No detectado
      if (obsDurMin < 15) {
        categoryMissedShort.push({ obs, obsDurMin })
      } else {
        categoryMissedSignificant.push({ obs, obsDurMin })
      }
    }
  }

  console.log('--------------------------------------------------------------------')
  console.log(
    `✅ 1. EVENTOS DETECTADOS CON ÉXITO: ${categoryDetectedExact.length + categoryConsolidated.length}`,
  )
  console.log('--------------------------------------------------------------------')

  console.log('\n--- 🎯 Coincidencias Directas / Exactas ---')
  for (const item of categoryDetectedExact) {
    const obsS = new Date(item.obs.startedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })
    const obsE = new Date(item.obs.endedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })

    console.log(
      `- [${item.obs.dayOfWeek} ${item.obs.id}] Real: ${obsS}-${obsE} (${item.obsDurMin.toFixed(0)}m) => Inferido: ${item.infStartStr}-${item.infEndStr}`,
    )
    console.log(`  └─ Descripción: "${item.obs.description}"`)
    console.log(`  └─ Regla Cese: ${item.closeReason.substring(0, 90)}...`)
  }

  if (categoryConsolidated.length > 0) {
    console.log('\n--- 🧩 Eventos Múltiples / Consolidados ---')
    for (const item of categoryConsolidated) {
      console.log(
        `- [${item.obs.dayOfWeek} ${item.obs.id}] Real: ${item.obs.startedAt.substring(11, 16)} (${item.obsDurMin.toFixed(0)}m) => ${item.note}`,
      )
      console.log(`  └─ Descripción: "${item.obs.description}"`)
    }
  }

  console.log('\n--------------------------------------------------------------------')
  console.log(
    `⚠️ 2. EVENTOS NO DETECTADOS POR EL MOTOR (FALSOS NEGATIVOS): ${categoryMissedShort.length + categoryMissedSignificant.length}`,
  )
  console.log('--------------------------------------------------------------------')

  console.log(
    `\n--- 🔍 A. Omitidos de Duración SIGNIFICATIVA (≥ 15 min) [Candidatos a Calibración]: ${categoryMissedSignificant.length} ---`,
  )
  for (const item of categoryMissedSignificant) {
    const obsS = new Date(item.obs.startedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })
    const obsE = new Date(item.obs.endedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })

    console.log(
      `- [${item.obs.dayOfWeek} ${item.obs.id}] [${obsS} - ${obsE}] (${item.obsDurMin.toFixed(0)} min): "${item.obs.description}"`,
    )
  }

  console.log(
    `\n--- 🍃 B. Omitidos Micro-Eventos / Garúas Cortas (< 15 min) [Filtro correcto / Sin impacto]: ${categoryMissedShort.length} ---`,
  )
  for (const item of categoryMissedShort) {
    const obsS = new Date(item.obs.startedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })
    const obsE = new Date(item.obs.endedAt).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })

    console.log(
      `- [${item.obs.dayOfWeek} ${item.obs.id}] [${obsS} - ${obsE}] (${item.obsDurMin.toFixed(0)} min): "${item.obs.description}"`,
    )
  }
}

main().catch(console.error)

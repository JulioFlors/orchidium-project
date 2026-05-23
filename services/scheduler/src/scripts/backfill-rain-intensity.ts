import { prisma } from '@package/database'

import { influxClient } from '../lib/influx'

async function main() {
  console.log('Starting rain intensity backfill from InfluxDB to Postgres...')
  try {
    // Buscar eventos de lluvia en 2026 que tengan intensidades nulas
    const events = await prisma.rainEvent.findMany({
      where: {
        startedAt: {
          gte: new Date('2026-01-01T00:00:00Z'),
        },
        endedAt: {
          not: null,
        },
        OR: [{ avgIntensity: null }, { peakIntensity: null }],
      },
    })

    console.log(`Found ${events.length} events needing backfill.`)

    for (const event of events) {
      console.log(`Processing event ${event.id}:`)
      console.log(`  startedAt: ${event.startedAt.toISOString()}`)
      console.log(`  endedAt:   ${event.endedAt!.toISOString()}`)

      let avgIntensity: number | null = null
      let peakIntensity: number | null = null

      try {
        const intensityQuery = `
          SELECT AVG("rain_intensity") as avg_int, MAX("rain_intensity") as peak_int 
          FROM "environment_metrics" 
          WHERE "zone" = 'EXTERIOR' 
            AND time >= '${event.startedAt.toISOString()}' 
            AND time <= '${event.endedAt!.toISOString()}'
        `
        const stream = influxClient.query(intensityQuery)

        for await (const row of stream) {
          if (row.avg_int != null) avgIntensity = Number(row.avg_int)
          if (row.peak_int != null) peakIntensity = Number(row.peak_int)
        }
      } catch (influxErr) {
        console.error(`  InfluxDB query failed for event ${event.id}:`, influxErr)
        continue
      }

      console.log(`  Query results -> avg: ${avgIntensity}, peak: ${peakIntensity}`)

      if (avgIntensity !== null || peakIntensity !== null) {
        const updated = await prisma.rainEvent.update({
          where: { id: event.id },
          data: {
            avgIntensity,
            peakIntensity,
          },
        })

        console.log(`  Successfully updated PostgreSQL for event ${updated.id}`)
      } else {
        console.log(`  No intensity data found in InfluxDB for this period.`)
      }
    }
  } catch (err) {
    console.error('Error during backfill:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

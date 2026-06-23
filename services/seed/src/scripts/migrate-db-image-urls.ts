import { prisma, PlantType } from '@package/database'
import * as path from 'path'
import { Logger } from '../lib/logger'

const PLANT_TYPE_FOLDERS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'adenium_obesum',
  BROMELIAD: 'bromeliads',
  CACTUS: 'cactus',
  ORCHID: 'orchids',
  SUCCULENT: 'succulents',
}

async function main() {
  Logger.raw('\n')
  Logger.raw('\x1b[36m┌──────────────────────────────────────────────────┐')
  Logger.raw('\x1b[36m│   🔧  Corrección de URLs de Imágenes en DB        │')
  Logger.raw('\x1b[36m└──────────────────────────────────────────────────┘\x1b[0m\n')

  const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://storage.sisparrow.com'
  Logger.info(`URL base de R2: ${r2PublicUrl}`)

  // Obtener todas las especies con sus imágenes y género
  const speciesList = await prisma.species.findMany({
    include: {
      images: true,
      genus: true,
    },
  })

  let totalCount = 0
  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const species of speciesList) {
    const genusName = species.genus.name
    const plantType = species.genus.type
    const plantTypeFolder = PLANT_TYPE_FOLDERS[plantType] || 'others'
    const genusSlug = genusName.toLowerCase().replace(/\s+/g, '-')
    const speciesSlug = species.slug

    for (const image of species.images) {
      totalCount++
      const currentUrl = image.url
      const filename = path.basename(currentUrl)

      // Clave esperada estructurada en R2
      const key = `plants/${plantTypeFolder}/${genusSlug}/${speciesSlug}/${filename}`
      const expectedUrl = `${r2PublicUrl}/${key}`

      if (currentUrl === expectedUrl) {
        skippedCount++
        continue
      }

      try {
        await prisma.speciesImage.update({
          where: { id: image.id },
          data: { url: expectedUrl },
        })
        Logger.info(`  ✅ [UPDATED] Especie "${species.name}":`)
        Logger.raw(`     De:  ${currentUrl}\n`)
        Logger.raw(`     A:   ${expectedUrl}\n`)
        updatedCount++
      } catch (err) {
        errorCount++
        Logger.error(`  ❌ Error al actualizar imagen ${image.id} para especie ${species.name}:`, err)
      }
    }
  }

  Logger.raw('\n')
  Logger.raw('\x1b[32m┌──────────────────────────────────────────────────┐')
  Logger.raw('\x1b[32m│              📊 Resumen de Corrección            │')
  Logger.raw('\x1b[32m├──────────────────────────────────────────────────┤')
  Logger.raw(`\x1b[32m│ \x1b[0mTotal Imágenes: \x1b[36m${String(totalCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mActualizadas:   \x1b[32m${String(updatedCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mSin Cambios:    \x1b[33m${String(skippedCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mErrores:        \x1b[31m${String(errorCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw('\x1b[32m└──────────────────────────────────────────────────┘\x1b[0m\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    Logger.error('❌ Error crítico al corregir URLs de imágenes:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

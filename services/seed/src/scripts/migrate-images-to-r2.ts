import * as fs from 'fs'
import * as path from 'path'
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { PlantType } from '@package/database'
import { Logger } from '../lib/logger'
import { initialData } from '../seed-data'

// ---- Configuración de R2 ----
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: true,
})

const R2_BUCKET = process.env.R2_BUCKET_NAME ?? ''
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

// Carpeta local de imágenes de la tienda (ej: app/public/plants)
const PLANTS_LOCAL_DIR = path.resolve(__dirname, '../../../../app/public/plants')

const PLANT_TYPE_FOLDERS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'adenium_obesum',
  BROMELIAD: 'bromeliads',
  CACTUS: 'cactus',
  ORCHID: 'orchids',
  SUCCULENT: 'succulents',
}

const STATIC_PLANT_IMAGES = [
  'orchids/orchids.webp',
  'adenium_obesum/marbella_0_2000.webp',
  'cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
  'cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
  'succulents/crassula-capitella-campfire_0_2000.webp',
  'succulents/pachyveria-scheideckeri_2_2000.webp'
]

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.webp':
      return 'image/webp'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    default:
      return 'application/octet-stream'
  }
}

async function main() {
  Logger.raw('\n')
  Logger.raw('\x1b[35m┌──────────────────────────────────────────────────┐')
  Logger.raw('\x1b[35m│   🌿  Migración Taxonómica de Imágenes a R2       │')
  Logger.raw('\x1b[35m└──────────────────────────────────────────────────┘\x1b[0m\n')

  if (!process.env.R2_ACCOUNT_ID || !R2_BUCKET || !R2_PUBLIC_URL) {
    Logger.error('❌ Error: Variables de entorno de Cloudflare R2 faltantes en el .env.')
    process.exit(1)
  }

  // Crear mapa de género a tipo de planta
  const genusMap = initialData.genus.reduce(
    (map, g) => {
      map[g.name] = g.type
      return map
    },
    {} as Record<string, PlantType>
  )

  let totalImagesCount = 0
  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const sp of initialData.species) {
    const genusName = sp.genus.name
    const plantType = genusMap[genusName]

    if (!plantType) {
      Logger.warn(`⚠️  Género ${genusName} no encontrado en initialData.genus para la especie ${sp.name}`)
      continue
    }

    const plantTypeFolder = PLANT_TYPE_FOLDERS[plantType] || 'others'
    const genusSlug = genusName.toLowerCase().replace(/\s+/g, '-')
    const speciesSlug = sp.slug

    for (const imgUrl of sp.images) {
      totalImagesCount++
      const filename = path.basename(imgUrl)
      
      // Nueva clave estructurada en R2
      const key = `plants/${plantTypeFolder}/${genusSlug}/${speciesSlug}/${filename}`
      const contentType = getContentType(filename)

      // Ruta física local absoluta
      const localFilePath = path.resolve(PLANTS_LOCAL_DIR, imgUrl)

      if (!fs.existsSync(localFilePath)) {
        Logger.warn(`  ⚠️  [NO EXISTE LOCAL] Archivo no encontrado en disco: ${localFilePath}`)
        errorCount++
        continue
      }

      try {
        // 1. Verificar si ya existe en R2
        await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
        skippedCount++
        Logger.raw(`  • [OMITIDO] ${key} ya existe en R2`)
      } catch (err) {
        const error = err as { name?: string; $metadata?: { httpStatusCode?: number } }

        // 2. Si no existe (404), subirlo
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          try {
            const fileBuffer = fs.readFileSync(localFilePath)
            await r2.send(
              new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
              })
            )
            uploadedCount++
            Logger.raw(`  ⬆️  [SUBIDO] ${key} (${contentType})`)
          } catch (uploadErr) {
            errorCount++
            Logger.error(`  ❌ Error al subir ${key}:`, uploadErr)
          }
        } else {
          errorCount++
          Logger.error(`  ❌ Error verificando ${key} en R2:`, err)
        }
      }
    }
  }

  Logger.raw('\n📦 Procesando imágenes estáticas del Landing/Sidebar/Submenú...\n')
  for (const imgUrl of STATIC_PLANT_IMAGES) {
    totalImagesCount++
    const key = `plants/${imgUrl}`
    const contentType = getContentType(imgUrl)
    const localFilePath = path.resolve(PLANTS_LOCAL_DIR, imgUrl)

    if (!fs.existsSync(localFilePath)) {
      Logger.warn(`  ⚠️  [NO EXISTE LOCAL] Archivo estático no encontrado: ${localFilePath}`)
      errorCount++
      continue
    }

    try {
      await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
      skippedCount++
      Logger.raw(`  • [OMITIDO ESTÁTICO] ${key} ya existe en R2\n`)
    } catch (err) {
      const error = err as { name?: string; $metadata?: { httpStatusCode?: number } }

      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          const fileBuffer = fs.readFileSync(localFilePath)
          await r2.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
              Body: fileBuffer,
              ContentType: contentType,
            })
          )
          uploadedCount++
          Logger.raw(`  ⬆️  [SUBIDO ESTÁTICO] ${key} (${contentType})\n`)
        } catch (uploadErr) {
          errorCount++
          Logger.error(`  ❌ Error al subir estático ${key}:`, uploadErr)
        }
      } else {
        errorCount++
        Logger.error(`  ❌ Error verificando estático ${key} en R2:`, err)
      }
    }
  }

  Logger.raw('\n')
  Logger.raw('\x1b[32m┌──────────────────────────────────────────────────┐')
  Logger.raw('\x1b[32m│              📊 Resumen de Migración             │')
  Logger.raw('\x1b[32m├──────────────────────────────────────────────────┤')
  Logger.raw(`\x1b[32m│ \x1b[0mProcesadas:   \x1b[36m${String(totalImagesCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mSubidas R2:   \x1b[32m${String(uploadedCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mOmitidas:     \x1b[33m${String(skippedCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw(`\x1b[32m│ \x1b[0mErrores:      \x1b[31m${String(errorCount).padEnd(32)}  \x1b[32m│`)
  Logger.raw('\x1b[32m└──────────────────────────────────────────────────┘\x1b[0m\n')
}

main()
  .catch((e) => {
    Logger.error('❌ Error crítico en migración:', e)
    process.exit(1)
  })


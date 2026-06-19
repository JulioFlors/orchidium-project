import * as fs from 'fs'
import * as path from 'path'
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Logger } from '../lib/logger'

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

// Carpeta local de imágenes de la tienda
const PLANTS_LOCAL_DIR = path.resolve(__dirname, '../../../../app/public/plants')

function getFilesRecursively(dir: string): string[] {
  let results: string[] = []
  
  if (!fs.existsSync(dir)) return results

  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath))
    } else {
      // Filtrar solo formatos de imagen comunes
      const ext = path.extname(file).toLowerCase()
      if (['.webp', '.png', '.jpg', '.jpeg'].includes(ext)) {
        results.push(filePath)
      }
    }
  }

  return results
}

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
  Logger.raw('\x1b[35m│       🌿  Migración de Imágenes a Cloudflare R2   │')
  Logger.raw('\x1b[35m└──────────────────────────────────────────────────┘\x1b[0m\n')

  if (!process.env.R2_ACCOUNT_ID || !R2_BUCKET || !R2_PUBLIC_URL) {
    Logger.error('❌ Error: Variables de entorno de Cloudflare R2 faltantes en el .env.')
    process.exit(1)
  }

  Logger.info(`📂 Buscando imágenes en: ${PLANTS_LOCAL_DIR}`)
  const absoluteFiles = getFilesRecursively(PLANTS_LOCAL_DIR)

  if (absoluteFiles.length === 0) {
    Logger.warn('⚠️  No se encontraron imágenes en la carpeta local.')
    process.exit(0)
  }

  Logger.info(`🔎 Encontradas ${absoluteFiles.length} imágenes para procesar.`)

  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const filePath of absoluteFiles) {
    // Calcular ruta relativa desde PLANTS_LOCAL_DIR
    const relativePath = path.relative(PLANTS_LOCAL_DIR, filePath).replace(/\\/g, '/')
    
    // Clave en R2: plants/cactus/imagen.webp
    const key = `plants/${relativePath}`
    const contentType = getContentType(filePath)

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
          const fileBuffer = fs.readFileSync(filePath)
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

  Logger.raw('\n')
  Logger.raw('\x1b[32m┌──────────────────────────────────────────────────┐')
  Logger.raw('\x1b[32m│              📊 Resumen de Migración             │')
  Logger.raw('\x1b[32m├──────────────────────────────────────────────────┤')
  Logger.raw(`\x1b[32m│ \x1b[0mProcesadas:   \x1b[36m${String(absoluteFiles.length).padEnd(32)}  \x1b[32m│`)
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

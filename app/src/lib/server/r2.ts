import { S3Client } from '@aws-sdk/client-s3'

/**
 * Cliente S3 compatible con Cloudflare R2.
 * Singleton para reutilizar la conexión entre invocaciones serverless.
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

/** Nombre del bucket R2 */
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? ''

/** URL pública del bucket (sin barra final) */
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

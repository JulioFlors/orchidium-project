'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'

/**
 * Genera una URL prefirmada (PUT) para subir directamente un WebP a R2
 * desde el navegador. El archivo NUNCA pasa por Vercel.
 *
 * @param key    - Clave del objeto en R2 (ej: "species/catleya-trianae-001.webp")
 * @param contentType - MIME type (siempre "image/webp")
 * @returns URL firmada válida por 60 segundos + URL pública final
 */
export async function generateUploadPresignedUrl(key: string, contentType: string) {
  if (contentType !== 'image/webp') {
    return { ok: false, message: 'Solo se aceptan archivos WebP.' }
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 60 })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return { ok: true, presignedUrl, publicUrl }
  } catch (err) {
    console.error('[R2] Error generando presigned URL:', err)

    return { ok: false, message: 'Error generando URL de subida.' }
  }
}

/**
 * Elimina un objeto de R2 por su clave.
 * Llamar solo desde Server Actions autenticados (ADMIN).
 */
export async function deleteR2Object(key: string) {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))

    return { ok: true }
  } catch (err) {
    console.error('[R2] Error eliminando objeto:', err)

    return { ok: false, message: 'Error eliminando imagen del storage.' }
  }
}

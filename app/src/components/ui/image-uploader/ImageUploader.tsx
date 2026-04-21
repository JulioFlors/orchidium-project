'use client'

import { useRef, useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'

import { generateUploadPresignedUrl } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

interface UploadedImage {
  url: string
  key: string
}

interface ImageUploaderProps {
  /** Carpeta R2 destino sin barra final (ej: "species/cattleya-trianae") */
  folder: string
  onUploaded: (image: UploadedImage) => void
  disabled?: boolean
}

/**
 * Componente de carga de imágenes AOT.
 * Acepta JPG/PNG → comprime a WebP ≤300KB en el navegador →
 * PUT directo a R2 via presigned URL (Vercel nunca toca el archivo).
 */
export function ImageUploader({ folder, onUploaded, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToastStore()

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('Solo se aceptan imágenes (JPG, PNG, WebP).')
          continue
        }

        try {
          setUploading(true)
          setProgress(`Comprimiendo ${file.name}…`)

          // 1. Comprimir a WebP en el navegador
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1920,
            fileType: 'image/webp',
            useWebWorker: true,
            onProgress: (p) => setProgress(`Comprimiendo… ${p}%`),
          })

          // 2. Generar clave única en R2
          const timestamp = Date.now()
          const key = `${folder}/${timestamp}.webp`

          setProgress('Obteniendo URL de subida…')

          // 3. Solicitar presigned URL al servidor
          const result = await generateUploadPresignedUrl(key, 'image/webp')

          if (!result.ok || !result.presignedUrl || !result.publicUrl) {
            const msg = result.message ?? 'Error en servidor.'

            setError(msg)
            addToast(msg, 'error')
            continue
          }

          setProgress('Subiendo a storage…')

          // 4. PUT directo a R2 desde el navegador
          const uploadRes = await fetch(result.presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/webp' },
            body: compressed,
          })

          if (!uploadRes.ok) {
            const msg = 'Error al subir la imagen. Intenta de nuevo.'

            setError(msg)
            addToast(msg, 'error')
            continue
          }

          onUploaded({ url: result.publicUrl, key })
          addToast('Imagen subida correctamente.', 'success')
          setProgress(null)
        } catch (e) {
          console.error('[ImageUploader]', e)
          const msg = 'Ocurrió un error inesperado al procesar la imagen.'

          setError(msg)
          addToast(msg, 'error')
        } finally {
          setUploading(false)
        }
      }
    },
    [folder, onUploaded, addToast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  return (
    <div className="flex flex-col gap-2">
      <div
        aria-disabled={disabled ?? uploading}
        aria-label="Zona de carga de imágenes"
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-sm transition-colors',
          uploading || disabled
            ? 'cursor-not-allowed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'
            : 'border-zinc-300 hover:border-emerald-400 hover:bg-emerald-50/10 dark:border-zinc-600 dark:hover:border-emerald-500',
        ].join(' ')}
        role="button"
        tabIndex={0}
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && !disabled && inputRef.current?.click()}
      >
        <span className="text-2xl">🌿</span>
        {uploading ? (
          <span className="text-secondary animate-pulse">{progress}</span>
        ) : (
          <span className="text-secondary text-center">
            Arrastra o haz clic para subir
            <br />
            <span className="text-xs opacity-60">
              JPG · PNG · WebP — máx. 10MB (comprime a WebP)
            </span>
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        multiple
        accept="image/*"
        aria-hidden="true"
        className="hidden"
        disabled={uploading || disabled}
        type="file"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

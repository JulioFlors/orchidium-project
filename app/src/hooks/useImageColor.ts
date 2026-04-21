'use client'

import { useState, useEffect } from 'react'

export interface RGB {
  r: number
  g: number
  b: number
}

// Convierte RGB a HSL para poder medir la saturación del color
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h, s, l }
}

// Convierte HSL a RGB para devolver el resultado
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6

      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

// Número de buckets de tono en el espectro (cada 30° = 12 buckets)
const HUE_BUCKETS = 12

interface HueBucket {
  totalH: number
  totalS: number
  totalL: number
  weight: number // Saturación acumulada como peso
  count: number
}

/**
 * Extrae el color DOMINANTE más vibrante de una imagen usando un histograma HSL.
 *
 * Algoritmo:
 * 1. Dibuja la imagen en un canvas 20×20 (400 píxeles).
 * 2. Convierte cada píxel a HSL, descartando los muy oscuros/claros/desaturados.
 * 3. Agrupa los píxeles en 12 buckets de Hue (cada 30° del espectro).
 * 4. Cada bucket acumula la saturación de sus píxeles como "peso".
 * 5. El bucket con mayor peso acumulado = el tono dominante más vibrante.
 * 6. Devuelve el promedio del bucket ganador, con saturación y luminosidad boosteadas.
 *
 * Esto garantiza que una imagen con muchos píxeles verdes (ej. plantas)
 * siempre devuelva verde, no un marrón o lila aislado.
 */
export function getDominantVibrantColor(imgElement: HTMLImageElement): RGB | null {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  if (!ctx) return null

  const width = (canvas.width = 20)
  const height = (canvas.height = 20)

  try {
    ctx.drawImage(imgElement, 0, 0, width, height)
    const data = ctx.getImageData(0, 0, width, height).data

    // Inicializar los 12 buckets
    const buckets: HueBucket[] = Array.from({ length: HUE_BUCKETS }, () => ({
      totalH: 0,
      totalS: 0,
      totalL: 0,
      weight: 0,
      count: 0,
    }))

    for (let i = 0; i < data.length; i += 4) {
      // Ignorar píxeles transparentes
      if (data[i + 3] < 128) continue

      const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2])

      // Filtrar píxeles muy oscuros, claros o desaturados (grises/blancos/negros)
      if (l < 0.12 || l > 0.88) continue
      if (s < 0.15) continue

      // Determinar en qué bucket cae este Hue (0-11)
      const bucketIndex = Math.min(Math.floor(h * HUE_BUCKETS), HUE_BUCKETS - 1)
      const bucket = buckets[bucketIndex]

      // Acumular valores, usando la saturación como peso
      bucket.totalH += h
      bucket.totalS += s
      bucket.totalL += l
      bucket.weight += s // Los píxeles más saturados pesan más
      bucket.count++
    }

    // Encontrar el bucket con mayor peso acumulado de saturación
    let winnerIndex = -1
    let maxWeight = 0

    for (let i = 0; i < HUE_BUCKETS; i++) {
      if (buckets[i].weight > maxWeight) {
        maxWeight = buckets[i].weight
        winnerIndex = i
      }
    }

    // Si no hubo ningún bucket válido, devolvemos null
    if (winnerIndex === -1 || buckets[winnerIndex].count === 0) return null

    const winner = buckets[winnerIndex]

    // Promediar los valores del bucket ganador
    const avgH = winner.totalH / winner.count
    const avgS = winner.totalS / winner.count
    const avgL = winner.totalL / winner.count

    // Boost final: forzar saturación alta (mín 0.75) y luminosidad viva (0.45-0.55)
    const boostedS = Math.max(avgS, 0.75)
    const boostedL = Math.min(Math.max(avgL, 0.45), 0.55)

    return hslToRgb(avgH, boostedS, boostedL)
  } catch (e) {
    console.error('Error extrayendo color dominante de la imagen:', e)

    return null
  }
}

/**
 * Hook para inferir un Ambient Glow a partir de una Url de imagen dada.
 * Crea un <img> fantasma asíncrono, extrae su color y expone los r,g,b.
 */
export function useImageColor(imageUrl?: string | null) {
  const [color, setColor] = useState<RGB | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      const t = setTimeout(() => setColor(null), 0)

      return () => clearTimeout(t)
    }

    const img = new Image()

    img.crossOrigin = 'anonymous' // Crucial para S3 y proveedores externos

    // Anexar querystring de caché en caso de dev-mode u orígenes ruidosos
    img.src = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`

    const onLoad = () => {
      const rgb = getDominantVibrantColor(img)

      setColor(rgb)
    }

    img.addEventListener('load', onLoad)

    return () => {
      img.removeEventListener('load', onLoad)
    }
  }, [imageUrl])

  // Renderizar la variable "134 23 45" lista para usarse como `--hover-glow: rgb(var(--glow))` o similar
  const rgbString = color ? `${color.r} ${color.g} ${color.b}` : ''

  return { color, rgbString }
}

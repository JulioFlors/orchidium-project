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

    // Boost de Vivacidad y Saturación:
    // 1. Amplificamos la saturación para hacer los colores notablemente más vívidos (mínimo 0.85, máximo 0.98)
    const boostedS = Math.min(Math.max(avgS * 1.35, 0.85), 0.98)

    // 2. Ajustamos la luminosidad en la ventana dulce (0.48 - 0.55) para que el color brille con máxima pureza cromática
    const boostedL = Math.min(Math.max(avgL, 0.48), 0.55)

    return hslToRgb(avgH, boostedS, boostedL)
  } catch {
    return null
  }
}

export interface PresetColor {
  name: string
  lightRgb: RGB
  darkRgb: RGB
  lightRgbString: string
  darkRgbString: string
  hue: number // 0..1
}

export const PRESET_COLORS: PresetColor[] = [
  {
    name: 'Esmeralda',
    lightRgb: { r: 5, g: 150, b: 105 },
    darkRgb: { r: 52, g: 211, b: 153 },
    lightRgbString: 'rgb(5, 150, 105)',
    darkRgbString: 'rgb(52, 211, 153)',
    hue: 0.44,
  },
  {
    name: 'Verde',
    lightRgb: { r: 22, g: 163, b: 74 },
    darkRgb: { r: 74, g: 222, b: 128 },
    lightRgbString: 'rgb(22, 163, 74)',
    darkRgbString: 'rgb(74, 222, 128)',
    hue: 0.39,
  },
  {
    name: 'Lima',
    lightRgb: { r: 101, g: 163, b: 13 },
    darkRgb: { r: 163, g: 230, b: 53 },
    lightRgbString: 'rgb(101, 163, 13)',
    darkRgbString: 'rgb(163, 230, 53)',
    hue: 0.23,
  },
  {
    name: 'Fucsia',
    lightRgb: { r: 192, g: 38, b: 211 },
    darkRgb: { r: 232, g: 121, b: 249 },
    lightRgbString: 'rgb(192, 38, 211)',
    darkRgbString: 'rgb(232, 121, 249)',
    hue: 0.81,
  },
  {
    name: 'Rosa',
    lightRgb: { r: 219, g: 39, b: 119 },
    darkRgb: { r: 244, g: 114, b: 182 },
    lightRgbString: 'rgb(219, 39, 119)',
    darkRgbString: 'rgb(244, 114, 182)',
    hue: 0.91,
  },
  {
    name: 'Carmín',
    lightRgb: { r: 225, g: 29, b: 72 },
    darkRgb: { r: 251, g: 113, b: 133 },
    lightRgbString: 'rgb(225, 29, 72)',
    darkRgbString: 'rgb(251, 113, 133)',
    hue: 0.96,
  },
  {
    name: 'Púrpura',
    lightRgb: { r: 147, g: 51, b: 234 },
    darkRgb: { r: 192, g: 132, b: 252 },
    lightRgbString: 'rgb(147, 51, 234)',
    darkRgbString: 'rgb(192, 132, 252)',
    hue: 0.75,
  },
  {
    name: 'Violeta',
    lightRgb: { r: 124, g: 58, b: 237 },
    darkRgb: { r: 167, g: 139, b: 250 },
    lightRgbString: 'rgb(124, 58, 237)',
    darkRgbString: 'rgb(167, 139, 250)',
    hue: 0.72,
  },
  {
    name: 'Rojo',
    lightRgb: { r: 220, g: 38, b: 38 },
    darkRgb: { r: 248, g: 113, b: 113 },
    lightRgbString: 'rgb(220, 38, 38)',
    darkRgbString: 'rgb(248, 113, 113)',
    hue: 0.0,
  },
  {
    name: 'Naranja',
    lightRgb: { r: 234, g: 88, b: 12 },
    darkRgb: { r: 251, g: 146, b: 60 },
    lightRgbString: 'rgb(234, 88, 12)',
    darkRgbString: 'rgb(251, 146, 60)',
    hue: 0.07,
  },
  {
    name: 'Ámbar',
    lightRgb: { r: 217, g: 119, b: 6 },
    darkRgb: { r: 251, g: 191, b: 36 },
    lightRgbString: 'rgb(217, 119, 6)',
    darkRgbString: 'rgb(251, 191, 36)',
    hue: 0.09,
  },
  {
    name: 'Amarillo',
    lightRgb: { r: 202, g: 138, b: 4 },
    darkRgb: { r: 250, g: 204, b: 21 },
    lightRgbString: 'rgb(202, 138, 4)',
    darkRgbString: 'rgb(250, 204, 21)',
    hue: 0.13,
  },
  {
    name: 'Turquesa',
    lightRgb: { r: 13, g: 148, b: 136 },
    darkRgb: { r: 45, g: 212, b: 191 },
    lightRgbString: 'rgb(13, 148, 136)',
    darkRgbString: 'rgb(45, 212, 191)',
    hue: 0.48,
  },
  {
    name: 'Cian',
    lightRgb: { r: 8, g: 145, b: 178 },
    darkRgb: { r: 34, g: 211, b: 238 },
    lightRgbString: 'rgb(8, 145, 178)',
    darkRgbString: 'rgb(34, 211, 238)',
    hue: 0.52,
  },
  {
    name: 'Azul Cielo',
    lightRgb: { r: 2, g: 132, b: 199 },
    darkRgb: { r: 56, g: 189, b: 248 },
    lightRgbString: 'rgb(2, 132, 199)',
    darkRgbString: 'rgb(56, 189, 248)',
    hue: 0.55,
  },
  {
    name: 'Azul',
    lightRgb: { r: 37, g: 99, b: 235 },
    darkRgb: { r: 96, g: 165, b: 250 },
    lightRgbString: 'rgb(37, 99, 235)',
    darkRgbString: 'rgb(96, 165, 250)',
    hue: 0.61,
  },
  {
    name: 'Índigo',
    lightRgb: { r: 79, g: 70, b: 229 },
    darkRgb: { r: 129, g: 140, b: 248 },
    lightRgbString: 'rgb(79, 70, 229)',
    darkRgbString: 'rgb(129, 140, 248)',
    hue: 0.66,
  },
]

/**
 * Retorna el preset del catálogo que mejor armoniza con el RGB dominante analizado.
 */
export function getDominantPresetColor(dominantRgb: RGB): PresetColor {
  const { h } = rgbToHsl(dominantRgb.r, dominantRgb.g, dominantRgb.b)

  let bestMatch = PRESET_COLORS[0]
  let minDiff = 1.0

  for (const preset of PRESET_COLORS) {
    let diff = Math.abs(preset.hue - h)

    if (diff > 0.5) diff = 1.0 - diff

    if (diff < minDiff) {
      minDiff = diff
      bestMatch = preset
    }
  }

  return bestMatch
}

/**
 * Retorna el preset del catálogo que mayor contraste complementario (+180°) genera.
 */
export function getContrastPresetColor(dominantRgb: RGB): PresetColor {
  const { h } = rgbToHsl(dominantRgb.r, dominantRgb.g, dominantRgb.b)
  const complementaryH = (h + 0.5) % 1.0

  let bestMatch = PRESET_COLORS[0]
  let minDiff = 1.0

  for (const preset of PRESET_COLORS) {
    let diff = Math.abs(preset.hue - complementaryH)

    if (diff > 0.5) diff = 1.0 - diff

    if (diff < minDiff) {
      minDiff = diff
      bestMatch = preset
    }
  }

  return bestMatch
}

/**
 * Encuentra el preset Tailwind más cercano para cualquier string RGB guardado.
 */
export function getPresetForColorString(colorStr?: string | null): PresetColor | null {
  if (!colorStr) return null

  const exact = PRESET_COLORS.find(
    (p) => p.lightRgbString === colorStr || p.darkRgbString === colorStr,
  )

  if (exact) return exact

  const match = colorStr.match(/\d+/g)

  if (!match || match.length < 3) return null

  const r = parseInt(match[0], 10)
  const g = parseInt(match[1], 10)
  const b = parseInt(match[2], 10)
  const { h } = rgbToHsl(r, g, b)

  let best = PRESET_COLORS[0]
  let minDiff = 1.0

  for (const preset of PRESET_COLORS) {
    let diff = Math.abs(preset.hue - h)

    if (diff > 0.5) diff = 1.0 - diff

    if (diff < minDiff) {
      minDiff = diff
      best = preset
    }
  }

  return best
}

/**
 * Retorna un preset determinista a partir de un string (ej. slug o url) para asegurar recomendación garantizada.
 */
export function getFallbackPresetForString(str?: string | null): PresetColor {
  if (!str) return PRESET_COLORS[0]

  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }

  const index = Math.abs(hash) % PRESET_COLORS.length

  return PRESET_COLORS[index]
}

export type ColorRecommendationMode = 'recommended' | 'contrast' | 'exact'

/**
 * Hook para inferir un Ambient Glow a partir de una Url de imagen dada.
 * Garantiza SIEMPRE un par cromático válido para Light Mode (600) y Dark Mode (400).
 */
export function useImageColor(
  imageUrl?: string | null,
  mode: ColorRecommendationMode = 'recommended',
) {
  const fallbackPreset = getFallbackPresetForString(imageUrl)

  const [colorResult, setColorResult] = useState<{
    lightColor: RGB
    darkColor: RGB
    presetName: string
    isLoaded: boolean
  }>({
    lightColor: fallbackPreset.lightRgb,
    darkColor: fallbackPreset.darkRgb,
    presetName: fallbackPreset.name,
    isLoaded: false,
  })

  useEffect(() => {
    if (!imageUrl) {
      const fb = getFallbackPresetForString(imageUrl)
      const t = setTimeout(
        () =>
          setColorResult({
            lightColor: fb.lightRgb,
            darkColor: fb.darkRgb,
            presetName: fb.name,
            isLoaded: true,
          }),
        0,
      )

      return () => clearTimeout(t)
    }

    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.src = imageUrl.startsWith('http')
      ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      : `${window.location.origin}${imageUrl}`

    const onLoad = () => {
      const rgb = getDominantVibrantColor(img)

      if (rgb) {
        if (mode === 'recommended') {
          const preset = getDominantPresetColor(rgb)

          setColorResult({
            lightColor: preset.lightRgb,
            darkColor: preset.darkRgb,
            presetName: preset.name,
            isLoaded: true,
          })
        } else if (mode === 'contrast') {
          const preset = getContrastPresetColor(rgb)

          setColorResult({
            lightColor: preset.lightRgb,
            darkColor: preset.darkRgb,
            presetName: preset.name,
            isLoaded: true,
          })
        } else {
          const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b)
          const lightColor = hslToRgb(h, Math.min(s * 1.3, 0.98), 0.48)
          const darkColor = hslToRgb(h, Math.min(s * 1.4, 0.98), 0.72)

          setColorResult({ lightColor, darkColor, presetName: '', isLoaded: true })
        }
      } else {
        setColorResult((prev) => ({ ...prev, isLoaded: true }))
      }
    }

    img.addEventListener('load', onLoad)

    return () => {
      img.removeEventListener('load', onLoad)
    }
  }, [imageUrl, mode])

  const lightRgbString = `${colorResult.lightColor.r} ${colorResult.lightColor.g} ${colorResult.lightColor.b}`
  const darkRgbString = `${colorResult.darkColor.r} ${colorResult.darkColor.g} ${colorResult.darkColor.b}`

  return {
    color: colorResult.lightColor,
    lightColor: colorResult.lightColor,
    darkColor: colorResult.darkColor,
    lightRgbString: `rgb(${lightRgbString})`,
    darkRgbString: `rgb(${darkRgbString})`,
    rgbString: `rgb(${lightRgbString})`,
    presetName: colorResult.presetName,
    isLoaded: colorResult.isLoaded,
  }
}

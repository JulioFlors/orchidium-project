/**
 * Utilidades para cálculos botánicos y análisis ambiental.
 */

/**
 * Calcula el Déficit de Presión de Vapor (VPD) en kPa.
 * Fórmula basada en la temperatura del aire y la humedad relativa.
 */
export function calculateVPD(tempC: number, humidityPercent: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))

  return Number((svp * (1 - humidityPercent / 100)).toFixed(3))
}

/**
 * Calcula el DLI (Daily Light Integral) en mol/m²/d.
 * @param lux Iluminancia en lux
 * @param deltaSeconds Segundos transcurridos desde la última muestra
 */
export function calculateDLIIncrement(lux: number, deltaSeconds: number): number {
  // Constante de conversión Lux -> PPFD (estimada para luz solar directa/malla: 0.018)
  // PPFD (µmol/m²/s) = Lux * 0.018
  const ppfd = lux * 0.018

  return ppfd * deltaSeconds
}

/**
 * Determina si una fecha/hora cae dentro del rango botánico diurno (08:00:00 - 16:00:59 VET).
 */
export function isDaytimeCaracas(date: Date): boolean {
  const hour = (date.getUTCHours() - 4 + 24) % 24
  const min = date.getUTCMinutes()

  return (hour >= 8 && hour < 16) || (hour === 16 && min === 0)
}

/**
 * Determina si una fecha/hora cae dentro del rango nocturno botánico (19:00:00 - 05:59:59 VET).
 * Usado para el cálculo de riesgo fúngico y temperatura promedio nocturna.
 */
export function isNighttimeCaracas(date: Date): boolean {
  const hour = (date.getUTCHours() - 4 + 24) % 24

  return hour >= 19 || hour <= 5
}

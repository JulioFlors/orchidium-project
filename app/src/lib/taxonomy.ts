/**
 * Utilidades de normalización taxonómica y consistencia de nombres botánicos.
 */

/**
 * Normaliza el nombre de un género a Title Case y recorta espacios redundantes.
 * Ej: "  cattleya  " -> "Cattleya"
 * Ej: "single   petals" -> "Single Petals"
 */
export function normalizeGenusName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Normaliza el nombre de una especie recortando espacios redundantes y asegurando
 * que el primer carácter esté en mayúscula, respetando el resto del nombre
 * (híbridos con 'x', cultivares con comillas simples, etc.).
 * Ej: "  cattleya violacea  " -> "Cattleya violacea"
 * Ej: "  rhyncholaeliocattleya george king 'southern cross' " -> "Rhyncholaeliocattleya george king 'southern cross'"
 */
export function normalizeSpeciesName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ')

  if (!clean) return ''

  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/**
 * Genera slug kebab-case limpio para URLs a partir del nombre taxonómico.
 */
export function toTaxonomicSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

/**
 * Compara dos nombres taxonómicos de forma insensible a mayúsculas y minúsculas.
 */
export function isSameTaxonomicName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

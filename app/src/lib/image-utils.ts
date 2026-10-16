/**
 * Utilidades para el manejo de imágenes y URLs del Orchidarium/Tienda.
 */

/**
 * Formatea y resuelve la URL de una imagen de planta apuntando a Cloudflare R2.
 * Si es una URL absoluta (HTTP/S), se mantiene.
 * Si es relativa, se concatena con la base URL pública de R2.
 * Si es vacía o nula, devuelve el placeholder.
 */
export function getImageUrl(url?: string): string {
  if (!url) return '/imgs/placeholder.jpg'
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  // Si es un recurso estático local de la carpeta public
  if (url.startsWith('/imgs/') || url.startsWith('/images/')) return url

  // Limpiar barras iniciales y comprobar si es ruta a carpeta local imgs
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url

  if (cleanUrl.startsWith('imgs/') || cleanUrl.startsWith('images/')) return `/${cleanUrl}`

  const prefix = cleanUrl.startsWith('plants/') ? '' : 'plants/'
  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://storage.sisparrow.com'

  return `${r2BaseUrl}/${prefix}${cleanUrl}`
}

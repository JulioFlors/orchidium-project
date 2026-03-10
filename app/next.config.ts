import type { NextConfig } from 'next'

import path from 'path'

import { config } from 'dotenv'

// Carga las variables de entorno desde el archivo .env en la raíz del monorepo
config({ path: '../.env' })

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactCompiler: true,
  transpilePackages: ['@package/database, @service/seeding'],
  turbopack: {
    root: path.resolve('..'),
  },
  allowedDevOrigins: ['localhost', '192.168.1.5'],
  images: {
    // ------------------------------------------------------------------------
    // TODO: PARCHE DE EMERGENCIA (Marzo 2026)
    // Desactiva la API de Vercel para evitar imágenes rotas por límite de cuota
    // (Consumo masivo el 8 de marzo provocado por Crawler externo)
    // ------------------------------------------------------------------------
    // unoptimized: true,

    // 1 mes de cache TTL para reducir transformaciones y escrituras (Recomendación Vercel)
    minimumCacheTTL: 2678400,
    // Limitar formatos para evitar procesar múltiples variantes innecesarias
    formats: ['image/webp'],
    // Reducir la matriz de tamaños generados (deviceSizes e imageSizes limitados)
    // Esto previene que Vercel genere docenas de versiones por cada imagen cargada
    deviceSizes: [640, 768, 1024, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },
}

export default nextConfig

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
}

export default nextConfig

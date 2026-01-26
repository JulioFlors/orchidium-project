import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

// ---- Recrear __dirname para entornos ESM/TypeScript ----
// Esto es necesario porque en "type": "module", __dirname no existe globalmente.
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---- Carga de Variables de Entorno (Monorepo) ---- 
// Resuelve la ruta absoluta hacia la raíz del monorepo (sube 2 niveles)
// para encontrar el archivo .env principal.
config({ path: join(__dirname, '../../.env') })

export default defineConfig({
  // Ruta relativa al esquema desde este archivo de configuración
  schema: 'prisma/schema.prisma',

  migrations: {
    // Dónde se guardan las migraciones SQL
    path: 'prisma/migrations',

    // Comando para el Seed
    seed: 'tsx ../../services/seed/src/seed-database.ts',
  },

  datasource: {
    // Lee la URL de la base de datos inyectada por dotenv o el sistema
    // Para migraciones y el CLI, usamos siempre la conexión directa si está disponible
    url: env('DATABASE_URL_UNPOOLED') || env('DATABASE_URL'),
  },
})
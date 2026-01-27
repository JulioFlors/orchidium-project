import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { Pool, type PoolConfig } from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import ws from 'ws'

const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[91m',
  CYAN: '\x1b[96m',
  GREEN: '\x1b[92m',
  YELLOW: '\x1b[93m'
}

// 1. Validación estricta de la variable de entorno
const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  throw new Error(`❌ ${Colors.RED}DATABASE_URL no definida. Revisa las variables de entorno en Vercel.${Colors.RESET}`)
}

const connectionString = rawUrl.replace(/^["']|["']$/g, '').trim()

// 2. Configuración de WebSocket para el driver Serverless
neonConfig.webSocketConstructor = ws

const adapter = (() => {
  const isNeonDatabase = connectionString.includes('neon.tech')
  const isServerless = process.env.VERCEL === '1'

  // Log de depuración (ocultando contraseña)
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log(`${Colors.YELLOW}🔍 Conectando a: ${maskedUrl}${Colors.RESET}`)

  // ---------------------------------------------------------
  // CASO A: MODO NEON (Cloud)
  // ---------------------------------------------------------
  if (isNeonDatabase) {
    // A.1: Entorno Vercel (Serverless)
    if (isServerless) {
      console.log(`${Colors.CYAN}⚡ [Prisma] Entorno VERCEL detectado: Usando Adapter NEON (Serverless)${Colors.RESET}`)

      // --- CORRECCIÓN CRÍTICA: Limpieza segura de URL ---
      try {
        const url = new URL(connectionString)

        // Eliminamos sslmode de forma segura. 
        // La clase URL se encarga de reordenar los '?' y '&' correctamente.
        url.searchParams.delete('sslmode')

        const cleanUrl = url.toString()

        const pool = new NeonPool({ connectionString: cleanUrl })
        return new PrismaNeon(pool as any)
      } catch (error) {
        console.error('Error parseando la URL de base de datos:', error)
        // Fallback de emergencia
        const pool = new NeonPool({ connectionString })
        return new PrismaNeon(pool as any)
      }
    }

    // A.2: Entorno Local contra Neon
    console.log(`${Colors.CYAN}⚡ [Prisma] Modo NEON (Local) -> Usando Driver PG Standard con SSL${Colors.RESET}`)
    const pool = new Pool({
      connectionString,
      ssl: true,
      connectionTimeoutMillis: 20000,
      idleTimeoutMillis: 20000
    })
    return new PrismaPg(pool)
  }

  // ---------------------------------------------------------
  // CASO B: ENTORNO LOCAL (Postgres Standard)
  // ---------------------------------------------------------
  console.log(`${Colors.GREEN}💻 [Prisma] Entorno LOCAL detectado: Usando Adapter PG (TCP Standard)${Colors.RESET}`)
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 20000
  })
  return new PrismaPg(pool)
})()

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
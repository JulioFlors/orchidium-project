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
  WHITE: '\x1b[97m',
  YELLOW: '\x1b[93m'
}

const rawUrl = process.env.DATABASE_URL

if (!rawUrl) {
  throw new Error(`❌ ${Colors.RED}DATABASE_URL no definida.${Colors.RESET}`)
}

const connectionString = rawUrl.replace(/^["']|["']$/g, '').trim()

// Config WS para Neon (Solo se activará si entramos en el bloque Serverless)
neonConfig.webSocketConstructor = ws

const adapter = (() => {
  const isNeonDatabase = connectionString.includes('neon.tech')
  const isServerless = process.env.VERCEL === '1'

  // --- LOG DE DEBUG (Para ver qué está leyendo realmente) ---
  // Ocultamos la contraseña para seguridad en el log
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log(`${Colors.YELLOW}🔍 Conectando a: ${maskedUrl}${Colors.RESET}`)

  // ---------------------------------------------------------
  // CASO A: MODO NEON (Cloud)
  // ---------------------------------------------------------
  if (isNeonDatabase) {
    // A.1: Entorno Serverless (Vercel) -> Usamos Driver HTTP/WS de Neon
    if (isServerless) {
      console.log(`${Colors.CYAN}⚡ [Prisma] Entorno VERCEL detectado: Usando Adapter NEON (Serverless)${Colors.RESET}`)
      // Limpiamos params incompatibles con serverless driver
      const cleanUrl = connectionString.replace('?sslmode=require', '')
      const pool = new NeonPool({ connectionString: cleanUrl })
      return new PrismaNeon(pool as any)
    }

    // A.2: Entorno Local (Desarrollo) -> Usamos Driver PG Standard con SSL
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
  // CASO B: ENTORNO LOCAL (Desarrolo) -> Usamos Driver PG Nativo (TCP)
  // ---------------------------------------------------------
  // En local, usamos el driver 'pg' estándar. Es más robusto, no requiere WebSockets,
  // y funciona perfectamente tanto con Docker como con Neon remoto.
  console.log(`${Colors.GREEN}💻 [Prisma] Entorno LOCAL detectado: Usando Adapter PG (TCP Standard)${Colors.RESET}`)

  const poolConfig: PoolConfig = {
    connectionString,
    // En local, un pool de 10 es saludable.
    max: 10,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 20000
  }

  const pool = new Pool(poolConfig)
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
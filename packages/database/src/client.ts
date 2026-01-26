import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { Pool, type PoolConfig } from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import ws from 'ws'

// ---- Configuración de Colores para Logs ----
const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[91m',
  CYAN: '\x1b[96m',
  GREEN: '\x1b[92m',
  YELLOW: '\x1b[93m'
}

// 1. Validar existencia de la variable
const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  // Nota: En tiempo de build de Vercel, si esto falla, detendrá el proceso explícitamente.
  throw new Error(`❌ ${Colors.RED}DATABASE_URL no definida en las variables de entorno.${Colors.RESET}`)
}

// 2. Limpieza básica de comillas
const connectionString = rawUrl.replace(/^["']|["']$/g, '').trim()

// 3. Configurar WebSocket solo si es necesario (Neon Serverless Driver)
neonConfig.webSocketConstructor = ws

const adapter = (() => {
  // Detectamos entorno
  const isNeonDatabase = connectionString.includes('neon.tech')
  const isVercel = process.env.VERCEL === '1'

  // --- LOG DE DEBUG ---
  // Enmascaramos la contraseña
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log(`${Colors.YELLOW}🔍 Conectando a: ${maskedUrl}${Colors.RESET}`)

  // ---------------------------------------------------------
  // CASO A: MODO NEON (Cloud)
  // ---------------------------------------------------------
  if (isNeonDatabase) {
    // A.1: Entorno Vercel (Production/Preview)
    // Usamos el driver @neondatabase/serverless que maneja mejor las conexiones
    // en entornos serverless y edge, incluso si usamos el Pooler.
    if (isVercel) {
      console.log(`${Colors.CYAN}⚡ [Prisma] Entorno VERCEL detectado: Usando Adapter NEON (Serverless)${Colors.RESET}`)

      try {
        // --- CORRECCIÓN CRÍTICA AQUÍ ---
        // Usamos la API URL para manipular los parámetros de forma segura
        const urlObj = new URL(connectionString)

        // El driver serverless de Neon prefiere manejar SSL internamente via WebSocket,
        // pero NO debemos romper la cadena de query params.
        urlObj.searchParams.delete('sslmode')

        // Convertimos de nuevo a string. Esto asegura que si quedan params, empiecen con '?'
        const cleanUrl = urlObj.toString()

        const pool = new NeonPool({ connectionString: cleanUrl })
        return new PrismaNeon(pool as any)
      } catch (error) {
        console.error('Error parseando URL de Neon:', error)
        // Fallback inseguro por si la URL no era válida, aunque rawUrl existía
        const pool = new NeonPool({ connectionString })
        return new PrismaNeon(pool as any)
      }
    }

    // A.2: Entorno Local (Desarrollo contra Neon)
    console.log(`${Colors.CYAN}⚡ [Prisma] Modo NEON (Local) -> Usando Driver PG Standard con SSL${Colors.RESET}`)
    const pool = new Pool({
      connectionString,
      ssl: true, // Forzamos SSL para local contra Neon
      connectionTimeoutMillis: 20000,
      idleTimeoutMillis: 20000
    })
    return new PrismaPg(pool)
  }

  // ---------------------------------------------------------
  // CASO B: ENTORNO LOCAL (Docker / Postgres local)
  // ---------------------------------------------------------
  console.log(`${Colors.GREEN}💻 [Prisma] Entorno LOCAL detectado: Usando Adapter PG (TCP Standard)${Colors.RESET}`)

  const poolConfig: PoolConfig = {
    connectionString,
    max: 10,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 20000
  }

  const pool = new Pool(poolConfig)
  return new PrismaPg(pool)
})()

// 4. Instanciación Singleton de Prisma
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
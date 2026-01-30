import { Pool, type PoolConfig } from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ---- Configuración de Colores para Logs ----
const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[91m',
  GREEN: '\x1b[92m',
  BLUE: '\x1b[94m',
}
// ---- Detectamos el entorno ----
const isVercel = process.env.VERCEL === '1'

// ---- Selección Inteligente de URL ----
// - Si estamos en Vercel, usamos la URL del Pooler (DATABASE_URL)
// - Si estamos en Local, usamos la Directa (DATABASE_URL_UNPOOLED) para evitar timeouts,
//   pero si no existe, usamos la del Pooler como fallback.
let connectionString = process.env.DATABASE_URL

if (!isVercel && process.env.DATABASE_URL_UNPOOLED) {
  connectionString = process.env.DATABASE_URL_UNPOOLED
}

if (!connectionString) {
  throw new Error(`❌ ${Colors.RED}No se encontró ninguna URL de base de datos definida.${Colors.RESET}`)
}

// ---- Configurar el Adapter ----
// Usamos el driver estándar 'pg' para TODO (Local y Vercel/Producción).
// Vercel soporta conexiones TCP perfectamente en sus Serverless Functions.
const adapter = (() => {

  // Log de depuración (ocultando contraseña)
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')

  console.log(`${Colors.BLUE}🔍 [Prisma] Conectando a: ${maskedUrl}${Colors.RESET}`)

  // Identificamos visualmente qué conexión estamos usando
  const isPooler = connectionString.includes('-pooler')
  const connectionType = isPooler ? 'Pooler (Optimized for Cloud)' : 'Unpooled (Optimized for Local)'

  // Configuración del Pool
  const poolConfig: PoolConfig = {
    connectionString,
    // Neon requiere SSL en Vercel
    // 'ssl: true' es equivalente a 'sslmode=require' pero más compatible con el objeto de config.
    ssl: true,
    // Timeouts generosos para evitar errores en "Cold Starts" de serverless
    connectionTimeoutMillis: 60000, // 60s
    idleTimeoutMillis: 60000,       // 60s
    max: 10 // Límite de conexiones en el pool local del contenedor
  }

  const pool = new Pool(poolConfig)

  if (isVercel) {
    console.log(`${Colors.BLUE}📡 [Prisma] Entorno VERCEL: ${connectionType} && Adapter PG (Standard TCP)${Colors.RESET}`)
  } else {
    console.log(`${Colors.GREEN}💻 [Prisma] Entorno LOCAL: ${connectionType} && Adapter PG (Standard TCP)${Colors.RESET}`)
  }

  return new PrismaPg(pool)
})()

// ---- Instanciación Singleton de Prisma ----
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
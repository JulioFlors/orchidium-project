import { Pool, PoolConfig } from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[91m',
  WHITE: '\x1b[97m'
}

// Configuración de la Conexión
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(`❌ ${Colors.RED}ERROR CRÍTICO:${Colors.RESET} ${Colors.WHITE}DATABASE_URL no está definida en las variables de entorno.${Colors.RESET}`);
}

// Lógica de Dimensionamiento del Pool
// Detectamos si estamos corriendo en Vercel (Serverless)
const isServerless = process.env.VERCEL === '1'

const poolConfig: PoolConfig = {
  connectionString,

  // - Si es Serverless (Vercel): Usamos máx 1 conexión para no saturar Neon con miles de lambdas simultáneas.
  // - Si NO es Serverless (Docker/Local): Usamos 10 conexiones (estándar).
  max: isServerless ? 1 : 10,

  // Fail fast: si la BD no responde en 10s, lanzamos error.
  connectionTimeoutMillis: 10000,
  // Tiempo que una conexión puede estar inactiva antes de cerrarse
  idleTimeoutMillis: isServerless ? 0 : 20000
}

// Creación del Pool y Adaptador
const pool = new Pool(poolConfig)
const adapter = new PrismaPg(pool)

// Definición del Singleton (Patrón estándar para Next.js)
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
